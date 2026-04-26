"""SqliteTaskQueue — DB-backed persistent queue.

알고리즘:
  - enqueue: ``INSERT`` 1행
  - dequeue: ``UPDATE ... SET status='running' WHERE id=(SELECT ... LIMIT 1) RETURNING *``
  - mark_done / mark_failed: ``UPDATE``
  - recover_orphans: 부팅 시 ``running`` → ``pending``

PG 이전 시 ``PostgresTaskQueue`` 가 ``FOR UPDATE SKIP LOCKED`` 로 같은 인터페이스 구현.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, update
from sqlmodel.ext.asyncio.session import AsyncSession

from ..db.models import QueueTask
from ..db.session import session_factory
from .base import Task


class SqliteTaskQueue:
    async def enqueue(
        self,
        task_type: str,
        payload: dict,
        *,
        max_attempts: int = 3,
    ) -> int:
        async with session_factory()() as s:
            row = QueueTask(
                task_type=task_type,
                payload_json=payload,
                status="pending",
                max_attempts=max_attempts,
            )
            s.add(row)
            await s.commit()
            await s.refresh(row)
            assert row.id is not None
            return row.id

    async def dequeue_one(self, worker_id: str) -> Optional[Task]:
        async with session_factory()() as s:
            # SQLite: BEGIN IMMEDIATE 로 직렬화. 단일 사이드카 환경에서 race 거의 없음.
            result = await s.execute(
                select(QueueTask)
                .where(QueueTask.status == "pending")
                .order_by(QueueTask.scheduled_at)
                .limit(1)
                .with_for_update(skip_locked=False)
            )
            t = result.scalar_one_or_none()
            if t is None:
                return None
            t.status = "running"
            t.attempts = (t.attempts or 0) + 1
            t.started_at = datetime.now(tz=timezone.utc)
            t.worker_id = worker_id
            await s.commit()
            return Task(
                id=t.id,  # type: ignore[arg-type]
                task_type=t.task_type,
                payload=t.payload_json,
                attempts=t.attempts,
                max_attempts=t.max_attempts,
                scheduled_at=t.scheduled_at,
            )

    async def mark_done(self, task_id: int) -> None:
        async with session_factory()() as s:
            await s.execute(
                update(QueueTask)
                .where(QueueTask.id == task_id)
                .values(status="done", finished_at=datetime.now(tz=timezone.utc))
            )
            await s.commit()

    async def mark_failed(
        self,
        task_id: int,
        *,
        error: str,
        retry: bool = True,
    ) -> None:
        async with session_factory()() as s:
            row = (
                await s.execute(select(QueueTask).where(QueueTask.id == task_id))
            ).scalar_one_or_none()
            if row is None:
                return
            now = datetime.now(tz=timezone.utc)
            if retry and row.attempts < row.max_attempts:
                row.status = "pending"
                row.error = error
                row.started_at = None
                row.scheduled_at = now
            else:
                row.status = "failed"
                row.error = error
                row.finished_at = now
            await s.commit()

    async def recover_orphans(self) -> int:
        async with session_factory()() as s:
            result = await s.execute(
                update(QueueTask)
                .where(QueueTask.status == "running")
                .values(status="pending", worker_id=None, started_at=None)
            )
            await s.commit()
            return result.rowcount or 0
