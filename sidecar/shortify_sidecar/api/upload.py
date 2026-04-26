"""POST /upload — multipart PDF 업로드.

sha256 으로 dedup. 같은 파일이 이미 활성 상태로 있으면 새 row 안 만들고
기존 ``pdf_id`` 를 돌려준다. 그 PDF 에 toc 가 이미 있으면 ``extract_toc``
도 enqueue 하지 않는다.
"""
from __future__ import annotations

import hashlib
import logging
import secrets

from fastapi import APIRouter, HTTPException, UploadFile, status
from pypdf import PdfReader
from sqlalchemy import select

from ..db.models import Pdf
from ..db.session import session_factory
from ..queue.sqlite_impl import SqliteTaskQueue
from ..storage.paths import pdf_path

router = APIRouter()
log = logging.getLogger("shortify.upload")


def _new_id() -> str:
    # 짧은 ULID 풍 ID (실제 ULID 라이브러리 도입 가능)
    return secrets.token_hex(13)


@router.post("/upload")
async def upload_pdf(file: UploadFile) -> dict:
    if not file.filename:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "filename missing")
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "PDF only")

    # 1) 임시 경로에 받기 + sha256 계산 (dedup 키)
    tmp_id = _new_id()
    tmp_path = pdf_path(tmp_id)
    sha = hashlib.sha256()
    size = 0
    with tmp_path.open("wb") as f:
        while chunk := await file.read(1 << 20):
            f.write(chunk)
            sha.update(chunk)
            size += len(chunk)
    digest = sha.hexdigest()

    # 2) 활성(soft-delete 아닌) 같은 sha 가 이미 있으면 재사용
    async with session_factory()() as s:
        existing = (
            await s.execute(
                select(Pdf).where(
                    Pdf.sha256 == digest, Pdf.deleted_at.is_(None)
                )
            )
        ).scalar_one_or_none()

    if existing is not None:
        tmp_path.unlink(missing_ok=True)  # 중복 파일 회수
        log.info(
            "upload dedup hit: %s sha=%s reused=%s toc_present=%s",
            file.filename, digest[:8], existing.id, bool(existing.toc_json),
        )
        # toc 가 비어있으면 추출만 다시 enqueue (이전 시도 실패 등)
        if not existing.toc_json:
            await SqliteTaskQueue().enqueue("extract_toc", {"pdf_id": existing.id})
        return {
            "pdf_id": existing.id,
            "page_count": existing.page_count,
            "deduped": True,
            "toc_present": bool(existing.toc_json),
        }

    # 3) 신규: PDF 유효성 + row insert
    try:
        reader = PdfReader(str(tmp_path))
        page_count = len(reader.pages)
    except Exception:
        tmp_path.unlink(missing_ok=True)
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "invalid PDF")

    async with session_factory()() as s:
        s.add(
            Pdf(
                id=tmp_id,
                filename=file.filename,
                local_path=str(tmp_path),
                page_count=page_count,
                size_bytes=size,
                sha256=digest,
            )
        )
        await s.commit()

    await SqliteTaskQueue().enqueue("extract_toc", {"pdf_id": tmp_id})
    return {
        "pdf_id": tmp_id,
        "page_count": page_count,
        "deduped": False,
        "toc_present": False,
    }
