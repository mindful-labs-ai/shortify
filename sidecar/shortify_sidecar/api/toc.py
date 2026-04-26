"""GET /pdfs/{id}/toc — 추출된 목차 반환."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from ..db.models import Pdf
from ..db.session import session_factory

router = APIRouter()


@router.get("/pdfs/{pdf_id}/toc")
async def get_toc(pdf_id: str) -> dict:
    async with session_factory()() as s:
        pdf = (
            await s.execute(
                select(Pdf).where(Pdf.id == pdf_id, Pdf.deleted_at.is_(None))
            )
        ).scalar_one_or_none()
    if pdf is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "pdf not found")
    return {
        "id": pdf.id,
        "filename": pdf.filename,
        "page_count": pdf.page_count,
        "toc": pdf.toc_json or [],
    }
