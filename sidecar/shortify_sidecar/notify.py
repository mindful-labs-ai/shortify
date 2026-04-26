"""SSE 이벤트 publisher (in-process pub/sub).

Worker 가 stage 진행을 publish 하면 ``/jobs/{id}/stream`` 엔드포인트에서 구독한
모든 SSE 클라이언트로 즉시 전달된다. asyncio Queue 를 클라이언트당 1개씩.
"""
from __future__ import annotations

import asyncio
import json
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncIterator, Optional

_subs: dict[str, list[asyncio.Queue]] = defaultdict(list)
_lock = asyncio.Lock()


async def publish(
    job_id: str,
    *,
    stage: int,
    message: Optional[str] = None,
    progress_pct: Optional[float] = None,
    extra: Optional[dict] = None,
) -> None:
    payload = {
        "job_id": job_id,
        "stage": stage,
        "message": message,
        "progress_pct": progress_pct,
        "ts": datetime.now(tz=timezone.utc).isoformat(),
        **(extra or {}),
    }
    line = f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
    async with _lock:
        queues = list(_subs.get(job_id, ()))
    for q in queues:
        try:
            q.put_nowait(line)
        except asyncio.QueueFull:
            pass


@asynccontextmanager
async def subscribe(job_id: str) -> AsyncIterator[asyncio.Queue]:
    q: asyncio.Queue = asyncio.Queue(maxsize=128)
    async with _lock:
        _subs[job_id].append(q)
    try:
        yield q
    finally:
        async with _lock:
            if q in _subs.get(job_id, []):
                _subs[job_id].remove(q)
            if not _subs[job_id]:
                _subs.pop(job_id, None)
