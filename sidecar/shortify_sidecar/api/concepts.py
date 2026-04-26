"""GET /image-concepts — 활성 컨셉 5종."""
from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select

from ..db.models import ImageConcept
from ..db.session import session_factory

router = APIRouter()


@router.get("/image-concepts")
async def list_concepts() -> dict:
    async with session_factory()() as s:
        rows = (
            await s.execute(
                select(ImageConcept)
                .where(ImageConcept.active.is_(True))
                .order_by(ImageConcept.sort_order)
            )
        ).scalars().all()
    # WKWebView 는 file:// URL 을 http origin 에서 로드하지 못하므로 상대 경로로
    # 사이드카가 직접 스트리밍한다 (아래 /image-concepts/{slug}/preview).
    return {
        "concepts": [
            {
                "slug": r.slug,
                "name": r.name,
                "description": r.description,
                "preview_url": f"/image-concepts/{r.slug}/preview",
            }
            for r in rows
        ]
    }


@router.get("/image-concepts/{slug}/preview")
async def preview_image(slug: str):
    async with session_factory()() as s:
        row = (
            await s.execute(
                select(ImageConcept).where(ImageConcept.slug == slug)
            )
        ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "concept not found")
    p = Path(row.preview_path)
    if not p.exists():
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            f"preview file missing on disk: {p}",
        )
    return FileResponse(p, media_type="image/png")
