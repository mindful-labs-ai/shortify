"""Admin / 모니터링 엔드포인트.

브라우저 어드민 페이지(``/admin/index.html`` — 별도 프로젝트)가 폴링하는
한 방 상태 dump.
"""

from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import desc, func, select

from ..db.models import AiTrace, Job, JobEvent, QueueTask
from ..db.session import session_factory
from ..settings import settings

router = APIRouter(prefix="/admin")


@router.get("/state")
async def admin_state(
    events_limit: int = 100,
    queue_limit: int = 30,
    jobs_limit: int = 50,
    traces_limit: int = 100,
) -> dict:
    async with session_factory()() as s:
        # 큐 status counts
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
        },
        "queue": {
            "counts": {
                "pending": counts.get("pending", 0),
                "running": counts.get("running", 0),
                "done": counts.get("done", 0),
                "failed": counts.get("failed", 0),
            },
            "recent": [
                {
                    "id": t.id,
                    "type": t.task_type,
                    "status": t.status,
                    "attempts": t.attempts,
                    "max_attempts": t.max_attempts,
                    "scheduled_at": (
                        t.scheduled_at.isoformat() if t.scheduled_at else None
                    ),
                    "started_at": t.started_at.isoformat() if t.started_at else None,
                    "finished_at": t.finished_at.isoformat() if t.finished_at else None,
                    "worker_id": t.worker_id,
                    "error": t.error,
                    "payload": t.payload_json,
                }
                for t in recent_tasks
            ],
        },
        "events": [
            {
                "job_id": e.job_id,
                "stage": e.stage,
                "message": e.message,
                "created_at": e.created_at.isoformat(),
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
                "created_at": j.created_at.isoformat(),
                "updated_at": j.updated_at.isoformat(),
            }
            for j in jobs
        ],
        "traces": [
            {
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
            for t in traces
        ],
    }
