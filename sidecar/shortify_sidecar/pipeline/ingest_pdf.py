"""PDF 목차 추출 + 섹션 텍스트 추출.

목차는 Gemini 에 PDF 를 첨부해 추출. 본문 페이지 텍스트는 pypdf 로 로컬 추출.
Gemini 호출 실패 시 PDF 전체를 단일 섹션으로 폴백.
"""
from __future__ import annotations

import asyncio
import logging
import re
from pathlib import Path

from pypdf import PdfReader

from . import _gemini

log = logging.getLogger("shortify.pipeline.pdf")
_PAGE_NOISE_RE = re.compile(r"^\s*\d+\s*$|^Page\s+\d+", re.IGNORECASE)


async def extract_toc(pdf_path: Path, page_count: int) -> list[dict]:
    try:
        toc = await _gemini_outline(pdf_path, page_count)
    except Exception:
        log.exception("Gemini PDF TOC extraction failed; falling back to single section")
        toc = []
    if toc:
        return toc
    return [
        {
            "idx": 0,
            "title": pdf_path.stem,
            "page_start": 0,
            "page_end": max(0, page_count - 1),
            "depth": 0,
        }
    ]


async def _gemini_outline(pdf_path: Path, page_count: int) -> list[dict]:
    return await _gemini.pdf_toc(pdf_path, page_count)


async def extract_section(pdf_path: Path, section_idx: int, toc: list[dict]) -> str:
    return await asyncio.to_thread(_extract_pages, pdf_path, section_idx, toc)


def _extract_pages(pdf_path: Path, section_idx: int, toc: list[dict]) -> str:
    item = next((t for t in toc if t["idx"] == section_idx), None)
    if item is None:
        raise ValueError(f"section_idx {section_idx} not in toc")
    reader = PdfReader(str(pdf_path))
    parts: list[str] = []
    start = max(0, item["page_start"])
    end = min(len(reader.pages) - 1, item["page_end"])
    for p in range(start, end + 1):
        try:
            parts.append(reader.pages[p].extract_text() or "")
        except Exception:
            continue
    text = "\n".join(parts)
    return _clean(text)


def _clean(text: str) -> str:
    out_lines = []
    for line in text.splitlines():
        if _PAGE_NOISE_RE.match(line):
            continue
        out_lines.append(line.rstrip())
    return "\n".join(l for l in out_lines if l.strip())
