"""Async DB engine + session factory."""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from ..settings import settings

_engine = None
_factory: async_sessionmaker[AsyncSession] | None = None


def engine():
    global _engine, _factory
    if _engine is None:
        _engine = create_async_engine(
            settings().database_url,
            echo=False,
            future=True,
            connect_args=(
                {"check_same_thread": False}
                if settings().database_url.startswith("sqlite")
                else {}
            ),
        )
        _factory = async_sessionmaker(_engine, expire_on_commit=False, class_=AsyncSession)
    return _engine


def session_factory() -> async_sessionmaker[AsyncSession]:
    engine()
    assert _factory is not None
    return _factory


@asynccontextmanager
async def get_session() -> AsyncIterator[AsyncSession]:
    async with session_factory()() as s:
        yield s


async def dispose() -> None:
    global _engine, _factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _factory = None
