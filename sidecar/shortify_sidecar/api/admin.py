"""Admin / 모니터링 엔드포인트.

브라우저 어드민 페이지(``/admin/index.html`` — 별도 프로젝트)가 폴링하는
한 방 상태 dump + per-job 연결 뷰.
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import desc, func, select

from ..db.models import AiTrace, Job, JobEvent, Pdf, Prompt, QueueTask
from ..db.seed import PROMPT_SEED
from ..db.session import session_factory
from ..settings import settings

router = APIRouter(prefix="/admin")


# ─────────────────────────── serializers ───────────────────────────


def _ser_job(j: Job) -> dict:
    return {
        "id": j.id,
        "pdf_id": j.pdf_id,
        "toc_section_index": j.toc_section_index,
        "toc_section_title": j.toc_section_title,
        "image_concept_slug": j.image_concept_slug,
        "stage": j.stage,
        "stage_message": j.stage_message,
        "conceptized_json": j.conceptized_json,
        "output_video_path": j.output_video_path,
        "duration_ms": j.duration_ms,
        "error": j.error,
        "created_at": j.created_at.isoformat() if j.created_at else None,
        "updated_at": j.updated_at.isoformat() if j.updated_at else None,
        "deleted_at": j.deleted_at.isoformat() if j.deleted_at else None,
    }


def _ser_pdf(p: Pdf) -> dict:
    return {
        "id": p.id,
        "filename": p.filename,
        "page_count": p.page_count,
        "size_bytes": p.size_bytes,
        "sha256": p.sha256,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        "deleted_at": p.deleted_at.isoformat() if p.deleted_at else None,
    }


def _ser_event(e: JobEvent) -> dict:
    return {
        "id": e.id,
        "job_id": e.job_id,
        "stage": e.stage,
        "message": e.message,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }


def _ser_task(t: QueueTask) -> dict:
    return {
        "id": t.id,
        "type": t.task_type,
        "status": t.status,
        "attempts": t.attempts,
        "max_attempts": t.max_attempts,
        "scheduled_at": t.scheduled_at.isoformat() if t.scheduled_at else None,
        "started_at": t.started_at.isoformat() if t.started_at else None,
        "finished_at": t.finished_at.isoformat() if t.finished_at else None,
        "worker_id": t.worker_id,
        "error": t.error,
        "payload": t.payload_json,
    }


def _ser_prompt(p: Prompt) -> dict:
    return {
        "key": p.key,
        "template": p.template,
        "description": p.description,
        "variables": p.variables or [],
        "updated_at": p.updated_at.isoformat() if p.updated_at else None,
    }


def _ser_trace(t: AiTrace) -> dict:
    return {
        "id": t.id,
        "kind": t.kind,
        "model": t.model,
        "job_id": t.job_id,
        "status": t.status,
        "request_preview": t.request_preview,
        "request_meta": t.request_meta or {},
        "response_preview": t.response_preview,
        "response_meta": t.response_meta or {},
        "error": t.error,
        "started_at": t.started_at.isoformat() if t.started_at else None,
        "finished_at": t.finished_at.isoformat() if t.finished_at else None,
        "duration_ms": t.duration_ms,
    }


def _build_timeline(
    events: list[JobEvent],
    tasks: list[QueueTask],
    traces: list[AiTrace],
) -> list[dict]:
    """events / queue task transitions / AI traces 를 시간순으로 인터리브.

    각 entry 는 ``{ts, source, ref_id, ...}`` 모양으로 정규화. UI 가 ``source``
    별 색·아이콘으로 분기하면 한 job 의 전체 흐름이 한 줄에 보인다.
    """
    items: list[dict] = []

    for e in events:
        if e.created_at is None:
            continue
        items.append(
            {
                "ts": e.created_at.isoformat(),
                "source": "event",
                "ref_id": e.id,
                "stage": e.stage,
                "message": e.message,
            }
        )

    for t in tasks:
        # 한 task 의 lifecycle 을 3개 timeline entry 로 분할 (enqueue/start/end).
        if t.scheduled_at:
            items.append(
                {
                    "ts": t.scheduled_at.isoformat(),
                    "source": "task",
                    "ref_id": t.id,
                    "task_type": t.task_type,
                    "transition": "enqueued",
                }
            )
        if t.started_at:
            items.append(
                {
                    "ts": t.started_at.isoformat(),
                    "source": "task",
                    "ref_id": t.id,
                    "task_type": t.task_type,
                    "transition": "started",
                    "worker_id": t.worker_id,
                }
            )
        if t.finished_at:
            items.append(
                {
                    "ts": t.finished_at.isoformat(),
                    "source": "task",
                    "ref_id": t.id,
                    "task_type": t.task_type,
                    "transition": t.status,  # done | failed
                    "error": t.error,
                }
            )

    for tr in traces:
        if tr.started_at is None:
            continue
        items.append(
            {
                "ts": tr.started_at.isoformat(),
                "source": "trace",
                "ref_id": tr.id,
                "kind": tr.kind,
                "model": tr.model,
                "status": tr.status,
                "duration_ms": tr.duration_ms,
                "error": tr.error,
            }
        )

    items.sort(key=lambda x: x["ts"])
    return items


# ─────────────────────────── endpoints ───────────────────────────


@router.get("/state")
async def admin_state(
    events_limit: int = 100,
    queue_limit: int = 30,
    jobs_limit: int = 50,
    traces_limit: int = 100,
) -> dict:
    async with session_factory()() as s:
        rows = (
            await s.execute(
                select(QueueTask.status, func.count()).group_by(QueueTask.status)
            )
        ).all()
        counts = {row[0]: row[1] for row in rows}

        recent_tasks = (
            (
                await s.execute(
                    select(QueueTask).order_by(desc(QueueTask.id)).limit(queue_limit)
                )
            )
            .scalars()
            .all()
        )

        events = (
            (
                await s.execute(
                    select(JobEvent).order_by(desc(JobEvent.id)).limit(events_limit)
                )
            )
            .scalars()
            .all()
        )

        jobs = (
            (
                await s.execute(
                    select(Job).order_by(desc(Job.created_at)).limit(jobs_limit)
                )
            )
            .scalars()
            .all()
        )

        traces = (
            (
                await s.execute(
                    select(AiTrace).order_by(desc(AiTrace.id)).limit(traces_limit)
                )
            )
            .scalars()
            .all()
        )

    return {
        "config": {
            "model_text": settings().model_text,
            "model_image": settings().model_image,
            "model_video": settings().model_video,
            "model_tts": settings().model_tts,
            "model_audio": settings().model_audio,
            "data_dir": str(settings().data_dir),
            "n_workers": settings().n_workers,
            "gemini_key_set": bool(settings().gemini_api_key),
            "test_mode": settings().test_mode,
            "scene_count": settings().scene_count,
            "video_duration_sec": settings().video_duration_sec,
        },
        "queue": {
            "counts": {
                "pending": counts.get("pending", 0),
                "running": counts.get("running", 0),
                "done": counts.get("done", 0),
                "failed": counts.get("failed", 0),
            },
            "recent": [_ser_task(t) for t in recent_tasks],
        },
        "events": [
            {
                "job_id": e.job_id,
                "stage": e.stage,
                "message": e.message,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in events
        ],
        "jobs": [
            {
                "id": j.id,
                "title": j.toc_section_title,
                "section_index": j.toc_section_index,
                "pdf_id": j.pdf_id,
                "stage": j.stage,
                "stage_message": j.stage_message,
                "error": j.error,
                "concept": j.image_concept_slug,
                "output_video_path": j.output_video_path,
                "duration_ms": j.duration_ms,
                "deleted_at": j.deleted_at.isoformat() if j.deleted_at else None,
                "created_at": j.created_at.isoformat() if j.created_at else None,
                "updated_at": j.updated_at.isoformat() if j.updated_at else None,
            }
            for j in jobs
        ],
        "traces": [_ser_trace(t) for t in traces],
    }


# ─────────────────────────── prompts CRUD ───────────────────────────


class UpdatePromptRequest(BaseModel):
    template: str
    description: str | None = None
    variables: list[str] | None = None


@router.get("/prompts")
async def admin_list_prompts() -> dict:
    """현재 DB row + seed 기본값을 함께 반환 — UI 가 'modified vs default' 비교."""
    async with session_factory()() as s:
        rows = (
            (await s.execute(select(Prompt).order_by(Prompt.key))).scalars().all()
        )
    seed_by_key = {p["key"]: p for p in PROMPT_SEED}
    return {
        "prompts": [
            {
                **_ser_prompt(p),
                "default_template": seed_by_key.get(p.key, {}).get("template"),
                "default_description": seed_by_key.get(p.key, {}).get("description"),
                "default_variables": seed_by_key.get(p.key, {}).get("variables") or [],
            }
            for p in rows
        ]
    }


@router.get("/prompts/{key}")
async def admin_get_prompt(key: str) -> dict:
    async with session_factory()() as s:
        row = (
            await s.execute(select(Prompt).where(Prompt.key == key))
        ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "prompt not found")
    seed = next((p for p in PROMPT_SEED if p["key"] == key), None)
    return {
        **_ser_prompt(row),
        "default_template": seed["template"] if seed else None,
        "default_description": (seed.get("description") if seed else None),
        "default_variables": (seed.get("variables") if seed else []) or [],
    }


@router.put("/prompts/{key}")
async def admin_update_prompt(key: str, req: UpdatePromptRequest) -> dict:
    async with session_factory()() as s:
        row = (
            await s.execute(select(Prompt).where(Prompt.key == key))
        ).scalar_one_or_none()
        if row is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "prompt not found")
        row.template = req.template
        if req.description is not None:
            row.description = req.description
        if req.variables is not None:
            row.variables = req.variables or None
        row.updated_at = datetime.now(tz=timezone.utc)
        await s.commit()
        await s.refresh(row)
    return _ser_prompt(row)


@router.post("/prompts/{key}/reset")
async def admin_reset_prompt(key: str) -> dict:
    """Seed 기본값으로 복원. seed 에 없는 key 는 404."""
    seed = next((p for p in PROMPT_SEED if p["key"] == key), None)
    if seed is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "no default for this key")
    async with session_factory()() as s:
        row = (
            await s.execute(select(Prompt).where(Prompt.key == key))
        ).scalar_one_or_none()
        if row is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "prompt row not found")
        row.template = seed["template"]
        row.description = seed.get("description")
        row.variables = seed.get("variables") or None
        row.updated_at = datetime.now(tz=timezone.utc)
        await s.commit()
        await s.refresh(row)
    return _ser_prompt(row)


# ─────────────────────────── per-job detail ───────────────────────────


@router.get("/jobs/{job_id}")
async def admin_job_detail(job_id: str) -> dict:
    """단일 job 의 모든 연결된 row 를 묶어 반환.

    - ``job`` / ``pdf``: 본체
    - ``events``: 이 job 의 stage 전이 (생성순) — 단계 진행 history
    - ``queue_tasks``: 이 job 을 트리거한 워커 태스크들. ``extract_toc`` 는
      PDF 단위라 ``payload.pdf_id`` 로, ``conceptize/generate_video`` 는
      ``payload.job_id`` 로 매칭.
    - ``traces``: 이 job 으로 주입된 AI 호출 (Gemini)
    - ``timeline``: 위 셋을 시간순으로 인터리브한 단일 스트림 (각 단계 연결 뷰)
    """
    async with session_factory()() as s:
        job = (
            await s.execute(select(Job).where(Job.id == job_id))
        ).scalar_one_or_none()
        if job is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "job not found")

        pdf = (
            await s.execute(select(Pdf).where(Pdf.id == job.pdf_id))
        ).scalar_one_or_none()

        events = (
            (
                await s.execute(
                    select(JobEvent)
                    .where(JobEvent.job_id == job_id)
                    .order_by(JobEvent.created_at, JobEvent.id)
                )
            )
            .scalars()
            .all()
        )

        # Portability: payload_json 필터를 SQL JSON 함수 대신 Python 후필터.
        # 한 PDF 에 묶인 task 수는 작아서 비용 무시 가능. PG 이전 시 json_path_ops
        # 인덱스가 필요해지면 그때 SQL 측으로 옮긴다.
        candidate_tasks = (
            (
                await s.execute(
                    select(QueueTask)
                    .where(
                        QueueTask.task_type.in_(
                            ["extract_toc", "conceptize", "generate_video"]
                        )
                    )
                    .order_by(QueueTask.id)
                )
            )
            .scalars()
            .all()
        )
        related_tasks: list[QueueTask] = []
        for t in candidate_tasks:
            payload = t.payload_json or {}
            if t.task_type == "extract_toc":
                if payload.get("pdf_id") == job.pdf_id:
                    related_tasks.append(t)
            else:
                if payload.get("job_id") == job_id:
                    related_tasks.append(t)

        traces = (
            (
                await s.execute(
                    select(AiTrace)
                    .where(AiTrace.job_id == job_id)
                    .order_by(AiTrace.id)
                )
            )
            .scalars()
            .all()
        )

    return {
        "job": _ser_job(job),
        "pdf": _ser_pdf(pdf) if pdf else None,
        "events": [_ser_event(e) for e in events],
        "queue_tasks": [_ser_task(t) for t in related_tasks],
        "traces": [_ser_trace(t) for t in traces],
        "timeline": _build_timeline(events, related_tasks, traces),
    }
