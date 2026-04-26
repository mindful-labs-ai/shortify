"""Worker 풀 — TaskQueue 를 폴링해서 dispatch.

지원 task_type:
  - extract_toc      → pipeline.ingest_pdf.extract_toc
  - conceptize       → pipeline.conceptizer.conceptize + scene_splitter.split
  - generate_video   → pipeline (image_gen → video_gen → narration → align → rhythm → compose)
"""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select, update
from sqlmodel.ext.asyncio.session import AsyncSession

from .. import notify
from ..db.models import Job, JobEvent, Pdf
from ..db.session import session_factory
from ..pipeline import get_pipeline
from ..pipeline._trace import current_job_id
from ..settings import settings
from ..storage.paths import output_dir
from .base import Task, TaskQueue

log = logging.getLogger("shortify.worker")


async def _set_stage(
    s: AsyncSession,
    job_id: str,
    stage: int,
    *,
    message: str | None = None,
    error: str | None = None,
    output_video_path: str | None = None,
    duration_ms: int | None = None,
    image_concept_slug: str | None = None,
    conceptized_json: dict | None = None,
) -> None:
    values: dict = {"stage": stage, "updated_at": datetime.now(tz=timezone.utc)}
    if message is not None:
        values["stage_message"] = message
    if error is not None:
        values["error"] = error
    if output_video_path is not None:
        values["output_video_path"] = output_video_path
    if duration_ms is not None:
        values["duration_ms"] = duration_ms
    if image_concept_slug is not None:
        values["image_concept_slug"] = image_concept_slug
    if conceptized_json is not None:
        values["conceptized_json"] = conceptized_json
    await s.execute(update(Job).where(Job.id == job_id).values(**values))
    s.add(JobEvent(job_id=job_id, stage=stage, message=message))
    await s.commit()
    log.info(
        "  job %s → stage %d (%s)%s",
        job_id,
        stage,
        message or "",
        f" error={error}" if error else "",
    )
    await notify.publish(job_id, stage=stage, message=message)


async def _handle_extract_toc(task: Task) -> None:
    pdf_id: str = task.payload["pdf_id"]
    pipeline = get_pipeline()
    async with session_factory()() as s:
        pdf = (await s.execute(select(Pdf).where(Pdf.id == pdf_id))).scalar_one()
    toc = await pipeline.extract_toc(pdf.local_path, pdf.page_count or 0)
    async with session_factory()() as s:
        await s.execute(update(Pdf).where(Pdf.id == pdf_id).values(toc_json=toc))
        await s.commit()


async def _handle_conceptize(task: Task) -> None:
    job_id: str = task.payload["job_id"]
    pipeline = get_pipeline()
    async with session_factory()() as s:
        await _set_stage(s, job_id, 1, message="extracting section")
    async with session_factory()() as s:
        job = (await s.execute(select(Job).where(Job.id == job_id))).scalar_one()
        pdf = (await s.execute(select(Pdf).where(Pdf.id == job.pdf_id))).scalar_one()
    text = await pipeline.extract_section(
        pdf.local_path, job.toc_section_index, pdf.toc_json or []
    )
    async with session_factory()() as s:
        await _set_stage(s, job_id, 2, message="conceptizing")
    conceptized = await pipeline.conceptize(text)
    async with session_factory()() as s:
        await _set_stage(
            s,
            job_id,
            3,
            message="awaiting image choice",
            conceptized_json=conceptized,
        )
        # 사용자가 conceptize 진행 중에 미리 컨셉을 선택했으면 그 slug 가
        # jobs.image_concept_slug 에 박혀있다. 그 경우 stage 3 에서 멈추지
        # 않고 즉시 4 로 진행 + generate_video enqueue.
        job = (await s.execute(select(Job).where(Job.id == job_id))).scalar_one()
        if job.image_concept_slug:
            await _set_stage(
                s,
                job_id,
                4,
                message="enqueued generate_video (concept pre-selected)",
            )
    if job.image_concept_slug:
        from .sqlite_impl import SqliteTaskQueue

        await SqliteTaskQueue().enqueue("generate_video", {"job_id": job_id})


def _existing_pngs(job_id: str, n: int) -> list[Path] | None:
    """images/scene_NNN.png 가 정확히 n 장 모두 있으면 그 목록을, 아니면 None."""
    out = output_dir(job_id) / "images"
    paths = [out / f"scene_{i:03d}.png" for i in range(n)]
    return paths if all(p.exists() for p in paths) else None


def _existing_mp4s(job_id: str, n: int) -> list[Path] | None:
    out = output_dir(job_id) / "clips"
    paths = [out / f"scene_{i:03d}.mp4" for i in range(n)]
    return paths if all(p.exists() for p in paths) else None


async def _handle_generate_video(task: Task) -> None:
    job_id: str = task.payload["job_id"]
    pipeline = get_pipeline()
    async with session_factory()() as s:
        job = (await s.execute(select(Job).where(Job.id == job_id))).scalar_one()
    assert job.image_concept_slug, "select-image must be called before generate_video"
    assert job.conceptized_json, "conceptized_json missing"

    started = datetime.now(tz=timezone.utc)
    narration_text = " ".join(b["text"] for b in job.conceptized_json["beats"])

    # ── Stage 4: Imaging (이미 N장 있으면 재사용) ──────────────────
    n_scenes = settings().scene_count
    scenes = pipeline.split_scenes(job.conceptized_json, n=n_scenes)
    if settings().test_mode:
        log.info("  [%s] TEST_MODE: %d scenes (instead of 14)", job_id, n_scenes)
    cached_pngs = _existing_pngs(job_id, len(scenes))
    if cached_pngs:
        log.info("  [%s] reusing %d cached images", job_id, len(cached_pngs))
        images = cached_pngs
        async with session_factory()() as s:
            await _set_stage(s, job_id, 4, message="reused cached images")
    else:
        async with session_factory()() as s:
            await _set_stage(s, job_id, 4, message="generating images")
        images = await pipeline.generate_images(
            scenes,
            job.image_concept_slug,
            job_id=job_id,
            conceptized=job.conceptized_json,
        )

    # ── Stage 5: Clipping (이미 14개 mp4 있으면 재사용) ────────────
    cached_mp4s = _existing_mp4s(job_id, len(images))
    if cached_mp4s:
        log.info("  [%s] reusing %d cached clips", job_id, len(cached_mp4s))
        clips = cached_mp4s
        async with session_factory()() as s:
            await _set_stage(s, job_id, 5, message="reused cached clips")
    else:
        async with session_factory()() as s:
            await _set_stage(s, job_id, 5, message="generating clips")
        clips = await pipeline.generate_clips(images, motion="subtle", job_id=job_id)

    # ── Stage 6: Narration (mp3 있으면 재사용) ────────────────────
    narration_path = output_dir(job_id) / "narration.mp3"
    if narration_path.exists() and narration_path.stat().st_size > 0:
        log.info("  [%s] reusing cached narration", job_id)
        narration = narration_path
        async with session_factory()() as s:
            await _set_stage(s, job_id, 6, message="reused cached narration")
    else:
        async with session_factory()() as s:
            await _set_stage(s, job_id, 6, message="generating narration")
        narration = await pipeline.generate_narration(
            text=narration_text,
            voice=settings().tts_voice,
            speed=1.0,
            job_id=job_id,
        )

    # ── Stage 7: Alignment (캐시 안 함 — 빠름·결정적) ──────────────
    async with session_factory()() as s:
        await _set_stage(s, job_id, 7, message="aligning words")
    words = await pipeline.align_words(narration, narration_text)

    # ── Stage 8: Compose (항상 새로 — final.mp4 생성 단계) ────────
    async with session_factory()() as s:
        await _set_stage(s, job_id, 8, message="composing")
    final = pipeline.compose_final(
        clips=clips,
        narration=narration,
        words=words,
        concept_slug=job.image_concept_slug,
        conceptized=job.conceptized_json,
        job_id=job_id,
    )

    duration_ms = int((datetime.now(tz=timezone.utc) - started).total_seconds() * 1000)
    async with session_factory()() as s:
        await _set_stage(
            s,
            job_id,
            9,
            message="done",
            output_video_path=str(final),
            duration_ms=duration_ms,
        )


HANDLERS = {
    "extract_toc": _handle_extract_toc,
    "conceptize": _handle_conceptize,
    "generate_video": _handle_generate_video,
}


class WorkerPool:
    def __init__(self, queue: TaskQueue, n: int = 2):
        self.queue = queue
        self.n = n
        self._tasks: list[asyncio.Task] = []
        self._stop = asyncio.Event()

    async def start(self) -> None:
        recovered = await self.queue.recover_orphans()
        if recovered:
            log.info("recovered %d orphan tasks", recovered)
        for i in range(self.n):
            self._tasks.append(asyncio.create_task(self._loop(f"w{i}")))

    async def stop(self) -> None:
        self._stop.set()
        for t in self._tasks:
            t.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()

    async def _loop(self, worker_id: str) -> None:
        while not self._stop.is_set():
            task = await self.queue.dequeue_one(worker_id)
            if task is None:
                await asyncio.sleep(0.5)
                continue
            handler = HANDLERS.get(task.task_type)
            if handler is None:
                log.error(
                    "[%s] unknown task_type %s (id=%s)",
                    worker_id,
                    task.task_type,
                    task.id,
                )
                await self.queue.mark_failed(
                    task.id, error=f"unknown task_type {task.task_type}", retry=False
                )
                continue
            t0 = time.perf_counter()
            log.info(
                "[%s] picked %s (id=%s, attempt=%d, payload=%s)",
                worker_id,
                task.task_type,
                task.id,
                task.attempts,
                task.payload,
            )
            # ai_traces 에 job_id 를 자동 주입하기 위해 ContextVar 를 세팅.
            payload_job_id = (
                task.payload.get("job_id") if isinstance(task.payload, dict) else None
            )
            ctx_token = current_job_id.set(payload_job_id)
            try:
                await handler(task)
                await self.queue.mark_done(task.id)
                log.info(
                    "[%s] done   %s (id=%s, took=%.2fs)",
                    worker_id,
                    task.task_type,
                    task.id,
                    time.perf_counter() - t0,
                )
            except Exception as e:  # noqa: BLE001
                log.exception(
                    "[%s] FAILED %s (id=%s, took=%.2fs): %s",
                    worker_id,
                    task.task_type,
                    task.id,
                    time.perf_counter() - t0,
                    e,
                )
                job_id = task.payload.get("job_id")
                if job_id:
                    async with session_factory()() as s:
                        await _set_stage(s, job_id, -1, message="failed", error=str(e))
                await self.queue.mark_failed(
                    task.id, error=str(e), retry=task.attempts < task.max_attempts
                )
            finally:
                current_job_id.reset(ctx_token)
