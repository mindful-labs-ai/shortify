"""Shortify Sidecar entry point."""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from alembic import command as alembic_command
from alembic.config import Config as AlembicConfig
from fastapi import Depends, FastAPI, HTTPException, Request, status
from pathlib import Path

from .api import concepts, health, jobs, toc, upload
from .db.seed import seed_image_concepts
from .db.session import dispose, session_factory
from .queue.sqlite_impl import SqliteTaskQueue
from .queue.workers import WorkerPool
from .settings import settings

log = logging.getLogger("shortify")
logging.basicConfig(level=logging.INFO)


def _run_migrations() -> None:
    cfg = AlembicConfig(str(Path(__file__).parent.parent / "alembic.ini"))
    cfg.set_main_option("sqlalchemy.url", settings().database_url)
    alembic_command.upgrade(cfg, "head")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("starting Shortify sidecar at %s:%s", settings().host, settings().port)
    # alembic env.py 가 자체 asyncio.run() 을 부르므로 별도 스레드에서 실행
    await asyncio.to_thread(_run_migrations)

    async with session_factory()() as s:
        added = await seed_image_concepts(s)
        if added:
            log.info("seeded %d image concepts", added)

    queue = SqliteTaskQueue()
    pool = WorkerPool(queue, n=settings().n_workers)
    await pool.start()
    app.state.worker_pool = pool

    try:
        yield
    finally:
        log.info("shutting down sidecar")
        await pool.stop()
        await dispose()


app = FastAPI(title="Shortify Sidecar", version="0.0.0", lifespan=lifespan)


def verify_token(request: Request) -> None:
    expected = settings().token
    auth = request.headers.get("authorization", "")
    qtoken = request.query_params.get("token")
    presented = auth.removeprefix("Bearer ").strip() or qtoken
    if presented != expected:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid token")


# /health 는 토큰 없이 (Tauri Shell polling)
app.include_router(health.router)

protected = [Depends(verify_token)]
app.include_router(upload.router, dependencies=protected)
app.include_router(toc.router, dependencies=protected)
app.include_router(jobs.router, dependencies=protected)
app.include_router(concepts.router, dependencies=protected)


def run() -> None:
    import uvicorn

    s = settings()
    uvicorn.run(
        "shortify_sidecar.main:app",
        host=s.host,
        port=s.port,
        log_level="info",
        reload=s.dev_mode,
    )


if __name__ == "__main__":
    run()
