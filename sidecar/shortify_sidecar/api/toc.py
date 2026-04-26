from fastapi import APIRouter, HTTPException, status

router = APIRouter()


@router.get("/pdfs/{pdf_id}/toc")
def get_toc(pdf_id: str) -> dict:
    """PDF 목차 반환. Phase 0 stub."""
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "toc not yet implemented")
