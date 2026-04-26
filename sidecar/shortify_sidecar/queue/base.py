"""TaskQueue 인터페이스 — 구현은 SQLite/PG 분리.

워커 코드는 이 Protocol 에만 의존하므로, PG 전환 시에도 워커 무수정.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Protocol


@dataclass
class Task:
    id: int
    task_type: str
    payload: dict
    attempts: int
    max_attempts: int
    scheduled_at: datetime


class TaskQueue(Protocol):
    async def enqueue(
        self,
        task_type: str,
        payload: dict,
        *,
        max_attempts: int = 3,
    ) -> int: ...

    async def dequeue_one(self, worker_id: str) -> Optional[Task]: ...

    async def mark_done(self, task_id: int) -> None: ...

    async def mark_failed(
        self,
        task_id: int,
        *,
        error: str,
        retry: bool = True,
    ) -> None: ...

    async def recover_orphans(self) -> int:
        """사이드카 재시작 시 ``running`` → ``pending``. 반환: 복구된 개수."""
        ...
