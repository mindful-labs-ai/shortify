"""PDF 조회: 리스트 + 목차."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import desc, select

from ..db.models import Pdf
from ..db.session import session_factory

router = APIRouter()


@router.get("/pdfs")
async def list_pdfs(
    include_deleted: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=500),
) -> dict:
    """업로드된 PDF 목록 (최신순). DropView 의 'Recent PDFs' 가 사용."""
    async with session_factory()() as s:
        stmt = select(Pdf).order_by(desc(Pdf.created_at)).limit(limit)
        if not include_deleted:
            stmt = stmt.where(Pdf.deleted_at.is_(None))
        rows = (await s.execute(stmt)).scalars().all()
    return {
        "pdfs": [
            {
                "id": r.id,
                "filename": r.filename,
                "page_count": r.page_count,
                "size_bytes": r.size_bytes,
                "toc_count": len(r.toc_json) if isinstance(r.toc_json, list) else 0,
                "has_toc": bool(r.toc_json),
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "deleted_at": r.deleted_at.isoformat() if r.deleted_at else None,
            }
            for r in rows
        ]
    }


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
