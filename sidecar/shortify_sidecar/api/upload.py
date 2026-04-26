from fastapi import APIRouter, HTTPException, UploadFile, status

router = APIRouter()


@router.post("/upload")
async def upload_pdf(file: UploadFile) -> dict:
    """multipart PDF 업로드 → pdf_id 반환.

    Phase 0 stub. 실 구현은 sunny 브랜치:
      - ~/Library/.../Shortify/pdfs/<ulid>.pdf 저장
      - pdfs row insert
      - extract_toc task enqueue
    """
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "upload not yet implemented")
