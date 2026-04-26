"""GET /image-concepts — 활성 컨셉 5종."""
from __future__ import annotations

from fastapi import APIRouter
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
    return {
        "concepts": [
            {
                "slug": r.slug,
                "name": r.name,
                "description": r.description,
                "preview_url": f"file://{r.preview_path}",
            }
            for r in rows
        ]
    }
