"""POST /upload — multipart PDF 업로드."""
from __future__ import annotations

import hashlib
import secrets

from fastapi import APIRouter, HTTPException, UploadFile, status
from pypdf import PdfReader
from sqlmodel.ext.asyncio.session import AsyncSession

from ..db.models import Pdf
from ..db.session import session_factory
from ..queue.sqlite_impl import SqliteTaskQueue
from ..storage.paths import pdf_path

router = APIRouter()


def _new_id() -> str:
    # 짧은 ULID 풍 ID (실제 ULID 라이브러리 도입 가능)
    return secrets.token_hex(13)


@router.post("/upload")
async def upload_pdf(file: UploadFile) -> dict:
    if not file.filename:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "filename missing")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "PDF only")

    pdf_id = _new_id()
    dest = pdf_path(pdf_id)
    sha = hashlib.sha256()
    size = 0
    with dest.open("wb") as f:
        while chunk := await file.read(1 << 20):
            f.write(chunk)
            sha.update(chunk)
            size += len(chunk)

    try:
        reader = PdfReader(str(dest))
        page_count = len(reader.pages)
    except Exception:
        dest.unlink(missing_ok=True)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "invalid PDF")

    async with session_factory()() as s:
        s.add(
            Pdf(
                id=pdf_id,
                filename=file.filename,
                local_path=str(dest),
                page_count=page_count,
                size_bytes=size,
                sha256=sha.hexdigest(),
            )
        )
        await s.commit()

    await SqliteTaskQueue().enqueue("extract_toc", {"pdf_id": pdf_id})
    return {"pdf_id": pdf_id, "page_count": page_count}
