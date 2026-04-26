"""Jobs API — 생성·조회·SSE·이미지 선택·재시도·soft delete·restore·trash."""
from __future__ import annotations

import asyncio
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import or_, select, update
from sse_starlette.sse import EventSourceResponse

from .. import notify
from ..db.models import Job, Pdf
from ..db.session import session_factory
from ..queue.sqlite_impl import SqliteTaskQueue
from ..storage.paths import remove_output, remove_pdf

router = APIRouter()


def _new_id() -> str:
    return secrets.token_hex(13)


def _serialize(job: Job) -> dict:
    return {
        "id": job.id,
        "pdf_id": job.pdf_id,
        "toc_section_index": job.toc_section_index,
        "toc_section_title": job.toc_section_title,
        "image_concept_slug": job.image_concept_slug,
        "stage": job.stage,
        "stage_message": job.stage_message,
        "conceptized_json": job.conceptized_json,
        "output_video_path": job.output_video_path,
        "duration_ms": job.duration_ms,
        "error": job.error,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "updated_at": job.updated_at.isoformat() if job.updated_at else None,
        "deleted_at": job.deleted_at.isoformat() if job.deleted_at else None,
    }


class CreateJobsRequest(BaseModel):
    pdf_id: str
    sections: list[int]


class SelectImageRequest(BaseModel):
    image_concept_slug: str


# ─────────────── 생성 ───────────────


@router.post("/jobs")
async def create_jobs(req: CreateJobsRequest) -> dict:
    if not req.sections:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "sections empty")
    if len(req.sections) > 5:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "max 5 sections per upload")

    async with session_factory()() as s:
        pdf = (
            await s.execute(
                select(Pdf).where(Pdf.id == req.pdf_id, Pdf.deleted_at.is_(None))
            )
        ).scalar_one_or_none()
        if pdf is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "pdf not found")
        toc = pdf.toc_json or []
        toc_by_idx = {t["idx"]: t for t in toc}

        ids: list[str] = []
        for idx in req.sections:
            section = toc_by_idx.get(idx)
            if section is None:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST, f"section idx {idx} not in toc"
                )
            jid = _new_id()
            s.add(
                Job(
                    id=jid,
                    pdf_id=req.pdf_id,
                    toc_section_index=idx,
                    toc_section_title=section["title"],
                    stage=0,
                )
            )
            ids.append(jid)
        await s.commit()

    q = SqliteTaskQueue()
    for jid in ids:
        await q.enqueue("conceptize", {"job_id": jid})
    return {"job_ids": ids}


# ─────────────── 목록 / 단건 / 휴지통 ───────────────


@router.get("/jobs")
async def list_jobs(
    include_deleted: bool = Query(default=False),
    only_deleted: bool = Query(default=False),
) -> dict:
    async with session_factory()() as s:
        stmt = select(Job).order_by(Job.created_at.desc())
        if only_deleted:
            stmt = stmt.where(Job.deleted_at.is_not(None))
        elif not include_deleted:
            stmt = stmt.where(Job.deleted_at.is_(None))
        rows = (await s.execute(stmt)).scalars().all()
    return {"jobs": [_serialize(r) for r in rows]}


@router.get("/jobs/{job_id}")
async def get_job(job_id: str) -> dict:
    async with session_factory()() as s:
        row = (await s.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "job not found")
    return _serialize(row)


# ─────────────── SSE 스트림 ───────────────


@router.get("/jobs/{job_id}/stream")
async def stream_job(job_id: str, request: Request):
    async with session_factory()() as s:
        row = (await s.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "job not found")

    async def event_gen():
        # 즉시 현재 stage 한 번 푸시
        yield {
            "data": (
                f'{{"job_id":"{row.id}","stage":{row.stage},'
                f'"message":{("null" if row.stage_message is None else f"\"{row.stage_message}\"")}}}'
            )
        }
        async with notify.subscribe(job_id) as q:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    line = await asyncio.wait_for(q.get(), timeout=15.0)
                except asyncio.TimeoutError:
                    yield {"event": "ping", "data": ""}
                    continue
                # publish() 가 만든 "data: {json}\n\n" 통째 라인을 그대로 담아 보냄
                yield {"data": line.removeprefix("data: ").rstrip("\n").lstrip()}

    return EventSourceResponse(event_gen())


# ─────────────── 이미지 선택 → stage 4 ───────────────


@router.post("/jobs/{job_id}/select-image")
async def select_image(job_id: str, req: SelectImageRequest) -> dict:
    """이미지 컨셉 선택. stage 0~3 어디서든 호출 가능.

    - stage == 3: slug 저장 + stage 4로 advance + generate_video enqueue
    - stage 0/1/2 (conceptize 진행 중): slug 만 저장, 워커가 stage 3 도달 시
      slug 가 있는 걸 보고 자동으로 stage 4 로 진행 + generate_video enqueue
    - stage 4+: 이미 진행 중 → 409
    """
    async with session_factory()() as s:
        row = (await s.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
        if row is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "job not found")
        if row.stage > 3 or row.stage < 0:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"job stage is {row.stage}; image already chosen or job done/failed",
            )

        if row.stage == 3:
            await s.execute(
                update(Job)
                .where(Job.id == job_id)
                .values(
                    image_concept_slug=req.image_concept_slug,
                    stage=4,
                    stage_message="enqueued generate_video",
                    updated_at=datetime.now(tz=timezone.utc),
                )
            )
        else:
            # 미리 선택만 저장 — 워커가 stage 3 도달 시 자동 진행
            await s.execute(
                update(Job)
                .where(Job.id == job_id)
                .values(
                    image_concept_slug=req.image_concept_slug,
                    updated_at=datetime.now(tz=timezone.utc),
                )
            )
        await s.commit()
        updated = (await s.execute(select(Job).where(Job.id == job_id))).scalar_one()

    if updated.stage == 4:
        await SqliteTaskQueue().enqueue("generate_video", {"job_id": job_id})
    return _serialize(updated)


# ─────────────── 재시도 ───────────────


@router.post("/jobs/{job_id}/retry")
async def retry_job(job_id: str) -> dict:
    """Stage-aware retry — 기존 산출물을 재사용해 가장 늦은 안전한 단계에서 재개.

    재개 정책:
      - conceptized_json 없음           → conceptize task (stage 0 부터)
      - conceptized_json 있음 + concept 미선택 → stage 3, conceptize 재실행 안 함
        (UI 가 select-image 호출하면 워커가 generate_video 로 진행)
      - conceptized_json 있음 + concept 선택됨 → generate_video task
        (stage 4~8. 워커가 디스크의 images/*.png · clips/*.mp4 · narration.mp3
        를 보고 단계별 재사용)

    실패한 job (stage=-1) 만 허용. done(9) job 은 ``restore_job`` 로.
    """
    async with session_factory()() as s:
        row = (
            await s.execute(select(Job).where(Job.id == job_id))
        ).scalar_one_or_none()
        if row is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "job not found")
        if row.stage != -1:
            raise HTTPException(status.HTTP_409_CONFLICT, "only failed jobs can retry")

        has_concept_json = bool(row.conceptized_json)
        has_concept_slug = bool(row.image_concept_slug)

        if has_concept_json and has_concept_slug:
            new_stage = 4
            task_type = "generate_video"
            msg = "retry from stage 4 (reusing cached artifacts when present)"
        elif has_concept_json:
            new_stage = 3
            task_type = None  # UI 의 select-image 가 generate_video 를 enqueue
            msg = "retry: awaiting image choice (stage 3)"
        else:
            new_stage = 0
            task_type = "conceptize"
            msg = "retry from stage 0 (re-running conceptize)"

        await s.execute(
            update(Job)
            .where(Job.id == job_id)
            .values(
                stage=new_stage,
                stage_message=msg,
                error=None,
                updated_at=datetime.now(tz=timezone.utc),
            )
        )
        await s.commit()
        updated = (
            await s.execute(select(Job).where(Job.id == job_id))
        ).scalar_one()

    if task_type:
        await SqliteTaskQueue().enqueue(task_type, {"job_id": job_id})
    return _serialize(updated)


# ─────────────── Soft delete / restore / hard purge ───────────────


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(job_id: str):
    async with session_factory()() as s:
        result = await s.execute(
            update(Job).where(Job.id == job_id).values(deleted_at=datetime.now(tz=timezone.utc))
        )
        if result.rowcount == 0:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "job not found")
        await s.commit()
    return None


@router.post("/jobs/{job_id}/restore")
async def restore_job(job_id: str) -> dict:
    async with session_factory()() as s:
        result = await s.execute(
            update(Job).where(Job.id == job_id, Job.deleted_at.is_not(None)).values(deleted_at=None)
        )
        if result.rowcount == 0:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "trashed job not found")
        await s.commit()
        row = (await s.execute(select(Job).where(Job.id == job_id))).scalar_one()
    return _serialize(row)


@router.delete("/trash")
async def empty_trash() -> dict:
    purged_jobs = 0
    purged_pdfs = 0
    freed = 0

    async with session_factory()() as s:
        # job 단위 hard delete (output 폴더도)
        rows = (await s.execute(select(Job).where(Job.deleted_at.is_not(None)))).scalars().all()
        for j in rows:
            freed += remove_output(j.id)
            await s.delete(j)
            purged_jobs += 1

        # pdf 단위 hard delete (파일 + cascade)
        prows = (await s.execute(select(Pdf).where(Pdf.deleted_at.is_not(None)))).scalars().all()
        for p in prows:
            freed += remove_pdf(p.id)
            # 잔여 jobs (활성/삭제 가리지 않고) 모두 정리
            jobs_under = (await s.execute(select(Job).where(Job.pdf_id == p.id))).scalars().all()
            for j in jobs_under:
                freed += remove_output(j.id)
                await s.delete(j)
            await s.delete(p)
            purged_pdfs += 1
        await s.commit()

    return {"purged_jobs": purged_jobs, "purged_pdfs": purged_pdfs, "freed_bytes": freed}
