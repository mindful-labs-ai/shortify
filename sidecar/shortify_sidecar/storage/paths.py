"""파일시스템 경로 helper.

모든 데이터는 ``~/Library/Application Support/Shortify`` 아래에 둔다 (macOS 표준).
``SHORTIFY_DATA_DIR`` env 로 dev/test 시 오버라이드 가능.
"""
from __future__ import annotations

import os
import shutil
from pathlib import Path


def app_support_dir() -> Path:
    override = os.environ.get("SHORTIFY_DATA_DIR")
    if override:
        return Path(override).expanduser()
    return Path.home() / "Library" / "Application Support" / "Shortify"


def pdfs_dir() -> Path:
    p = app_support_dir() / "pdfs"
    p.mkdir(parents=True, exist_ok=True)
    return p


def output_dir(job_id: str) -> Path:
    p = app_support_dir() / "output" / job_id
    p.mkdir(parents=True, exist_ok=True)
    return p


def logs_dir() -> Path:
    p = app_support_dir() / "logs"
    p.mkdir(parents=True, exist_ok=True)
    return p


def tmp_dir() -> Path:
    p = app_support_dir() / "tmp"
    p.mkdir(parents=True, exist_ok=True)
    return p


def pdf_path(pdf_id: str) -> Path:
    return pdfs_dir() / f"{pdf_id}.pdf"


def remove_pdf(pdf_id: str) -> int:
    """PDF 1개 hard delete. 회수된 byte 반환."""
    p = pdf_path(pdf_id)
    if not p.exists():
        return 0
    size = p.stat().st_size
    p.unlink()
    return size


def remove_output(job_id: str) -> int:
    """job 출력 폴더 hard delete. 회수된 byte 반환."""
    p = app_support_dir() / "output" / job_id
    if not p.exists():
        return 0
    size = sum(f.stat().st_size for f in p.rglob("*") if f.is_file())
    shutil.rmtree(p)
    return size
