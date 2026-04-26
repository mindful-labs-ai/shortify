"""GET /image-concepts — 활성 캐릭터 컨셉.

ORM hydration 우회 (raw column 만 SELECT)
  reference_image_paths 컬럼이 JSON 인데 과거 row 가 raw string (preview.png
  경로 단일값) 으로 들어가 있으면 SQLModel 이 ORM 변환 단계에서 json.loads
  실패로 500 을 던진다. 우리는 endpoint 응답에 그 컬럼을 쓰지 않으므로,
  필요한 컬럼만 명시적으로 SELECT 해서 hydration 을 회피한다.
"""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import select

from ..db.models import ImageConcept
from ..db.session import session_factory

router = APIRouter()
log = logging.getLogger("shortify.api.concepts")


@router.get("/image-concepts")
async def list_concepts() -> dict:
    async with session_factory()() as s:
        result = await s.execute(
            select(
                ImageConcept.slug,
                ImageConcept.name,
                ImageConcept.description,
            )
            .where(ImageConcept.active.is_(True))
            .order_by(ImageConcept.sort_order)
        )
        rows = result.all()
    return {
        "concepts": [
            {
                "slug": slug,
                "name": name,
                "description": description,
                "preview_url": f"/image-concepts/{slug}/preview",
            }
            for slug, name, description in rows
        ]
    }


@router.get("/image-concepts/{slug}/preview")
async def preview_image(slug: str):
    async with session_factory()() as s:
        row = (
            await s.execute(
                select(ImageConcept.preview_path).where(ImageConcept.slug == slug)
            )
        ).first()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "concept not found")
    preview_path = row[0]
    if not preview_path:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"concept '{slug}' has no preview_path"
        )
    p = Path(preview_path)
    if not p.exists():
        log.warning("preview file missing on disk: %s", p)
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"preview file missing on disk: {p}"
        )
    return FileResponse(p, media_type="image/png")
