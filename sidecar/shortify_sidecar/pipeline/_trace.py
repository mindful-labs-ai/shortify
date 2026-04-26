"""AI 호출 트레이싱 — 모든 외부 모델 요청을 ``ai_traces`` 테이블에 기록.

사용법::

    async with trace(kind="text_json", model="...", request_preview=prompt) as tr:
        out = await asyncio.to_thread(_call)
        tr.response_preview = out

- ``current_job_id`` ContextVar 로 worker 가 job 컨텍스트 주입
- 트레이스 insert/update 실패는 절대 호출자를 깨뜨리지 않는다 (warn 후 continue)
"""

from __future__ import annotations

import contextvars
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, AsyncIterator

from sqlalchemy import update

from ..db.models import AiTrace
from ..db.session import session_factory

log = logging.getLogger("shortify.trace")

current_job_id: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "shortify_current_job_id", default=None
)

PREVIEW_MAX = 2000


def _truncate(v: Any) -> str | None:
    if v is None:
        return None
    s = v if isinstance(v, str) else repr(v)
    if len(s) > PREVIEW_MAX:
        return s[:PREVIEW_MAX] + f"\n…({len(s) - PREVIEW_MAX} more chars truncated)"
    return s


class _TraceCtx:
    __slots__ = ("id", "response_preview", "response_meta")

    def __init__(self, id: int) -> None:
        self.id = id
        self.response_preview: Any | None = None
        self.response_meta: dict | None = None


@asynccontextmanager
async def trace(
    *,
    kind: str,
    model: str,
    request_preview: Any | None = None,
    request_meta: dict | None = None,
) -> AsyncIterator[_TraceCtx]:
    job_id = current_job_id.get()
    started = datetime.now(tz=timezone.utc)
    t0 = time.perf_counter()
    trace_id: int | None = None
    try:
        async with session_factory()() as s:
            row = AiTrace(
                kind=kind,
                model=model,
                job_id=job_id,
                status="running",
                request_preview=_truncate(request_preview),
                request_meta=request_meta or {},
                started_at=started,
            )
            s.add(row)
            await s.commit()
            await s.refresh(row)
            trace_id = row.id
    except Exception as e:  # noqa: BLE001
        log.warning("ai_trace insert failed (kind=%s): %s", kind, e)

    ctx = _TraceCtx(trace_id or -1)
    try:
        yield ctx
    except Exception as e:
        await _finalize(trace_id, "failed", t0, ctx, error=str(e)[:1000])
        raise
    else:
        await _finalize(trace_id, "done", t0, ctx, error=None)


async def _finalize(
    trace_id: int | None,
    status: str,
    t0: float,
    ctx: _TraceCtx,
    *,
    error: str | None,
) -> None:
    if trace_id is None:
        return
    try:
        async with session_factory()() as s:
            await s.execute(
                update(AiTrace)
                .where(AiTrace.id == trace_id)
                .values(
                    status=status,
                    error=error,
                    finished_at=datetime.now(tz=timezone.utc),
                    duration_ms=int((time.perf_counter() - t0) * 1000),
                    response_preview=_truncate(ctx.response_preview),
                    response_meta=ctx.response_meta or {},
                )
            )
            await s.commit()
    except Exception as e:  # noqa: BLE001
        log.warning(
            "ai_trace finalize failed (id=%d, status=%s): %s", trace_id, status, e
        )
