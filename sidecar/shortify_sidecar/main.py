"""Shortify Sidecar entry point."""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from alembic import command as alembic_command
from alembic.config import Config as AlembicConfig
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path

from .api import admin, concepts, health, jobs, toc, upload
from .db.seed import seed_image_concepts
from .db.session import dispose, session_factory
from .queue.sqlite_impl import SqliteTaskQueue
from .queue.workers import WorkerPool
from .settings import settings

log = logging.getLogger("shortify")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
# Reduce uvicorn noise on access log; keep our own loggers loud.
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def _run_migrations() -> None:
    pkg_root = Path(__file__).parent  # shortify_sidecar/
    cfg = AlembicConfig(str(pkg_root.parent / "alembic.ini"))
    # cwd 와 무관하게 동작하도록 절대경로 주입 (Tauri 가 src-tauri/ 에서 spawn).
    cfg.set_main_option("script_location", str(pkg_root / "db" / "migrations"))
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

# 사이드카는 127.0.0.1 + Bearer 토큰으로 보호된다. CORS 는 브라우저 fetch
# 편의용이라 origin 제한 없이 허용 (보안 경계는 토큰).
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# 보안 경계 = 127.0.0.1 바인딩 only (단일 사용자 데스크톱 가정).
# 같은 머신의 다른 프로세스가 호출하는 시나리오는 위협 모델 밖.
app.include_router(health.router)
app.include_router(upload.router)
app.include_router(toc.router)
app.include_router(jobs.router)
app.include_router(concepts.router)
app.include_router(admin.router)


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
