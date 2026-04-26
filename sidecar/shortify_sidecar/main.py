"""Shortify Sidecar entry point.

Phase 0: 11개 엔드포인트가 모두 등록되어 있으나 대부분 stub (501).
프론트엔드는 이 contract 기반으로 작업 시작.
"""
from __future__ import annotations

import os

from fastapi import Depends, FastAPI, HTTPException, Request, status

from .api import concepts, health, jobs, toc, upload

app = FastAPI(title="Shortify Sidecar", version="0.0.0")


def verify_token(request: Request) -> None:
    expected = os.environ.get("SHORTIFY_TOKEN", "dev")
    auth = request.headers.get("authorization", "")
    qtoken = request.query_params.get("token")
    presented = auth.removeprefix("Bearer ").strip() or qtoken
    if presented != expected:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid token")


# /health 는 토큰 없이 (Tauri Shell 부팅 polling 용)
app.include_router(health.router)

# 그 외 라우터는 모두 토큰 필수
protected = [Depends(verify_token)]
app.include_router(upload.router, dependencies=protected)
app.include_router(toc.router, dependencies=protected)
app.include_router(jobs.router, dependencies=protected)
app.include_router(concepts.router, dependencies=protected)


def run() -> None:
    """PyInstaller / dev 양쪽에서 진입."""
    import uvicorn

    host = os.environ.get("SHORTIFY_HOST", "127.0.0.1")
    port = int(os.environ.get("SHORTIFY_PORT", "51234"))
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    run()
