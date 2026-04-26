"""PDF 목차 추출 + 섹션 텍스트 추출.

목차: Gemini 에 PDF 를 첨부해 추출.
섹션 텍스트: pypdf 로 먼저 시도 → 너무 짧으면 (스캔본 / 텍스트 레이어 없음)
선택 페이지 범위만 잘라낸 PDF 를 Gemini 에 multimodal 입력으로 보내
정제된 한국어 본문을 받아온다. 마지막으로 그래도 비어있으면
toc title 을 마지막 fallback 으로 사용.
"""
from __future__ import annotations

import asyncio
import io
import logging
import re
from pathlib import Path

from pypdf import PdfReader, PdfWriter

from . import _gemini

log = logging.getLogger("shortify.pipeline.pdf")
_PAGE_NOISE_RE = re.compile(r"^\s*\d+\s*$|^Page\s+\d+", re.IGNORECASE)
# pypdf 결과가 이 글자수 미만이면 "텍스트 레이어 없음" 으로 판정.
_MIN_PYPDF_CHARS = 200


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
    item = next((t for t in toc if t["idx"] == section_idx), None)
    if item is None:
        raise ValueError(f"section_idx {section_idx} not in toc")
    title = str(item.get("title") or "")
    start = max(0, int(item.get("page_start", 0)))
    end_default = max(start, int(item.get("page_end", start)))

    # 1) pypdf 로컬 추출 시도
    text = await asyncio.to_thread(_extract_pages, pdf_path, start, end_default)
    if len(text.strip()) >= _MIN_PYPDF_CHARS:
        log.info("section %d: pypdf produced %d chars", section_idx, len(text))
        return text

    log.warning(
        "section %d (%s): pypdf gave only %d chars — falling back to Gemini multimodal",
        section_idx,
        title,
        len(text.strip()),
    )

    # 2) Gemini multimodal — 페이지 범위만 잘라낸 PDF 첨부
    try:
        sliced = await asyncio.to_thread(_slice_pdf_bytes, pdf_path, start, end_default)
        gem_text = await _gemini.pdf_section_text(sliced, title=title)
        gem_text = (gem_text or "").strip()
        if gem_text:
            log.info(
                "section %d: Gemini multimodal produced %d chars",
                section_idx,
                len(gem_text),
            )
            return gem_text
    except Exception:
        log.exception("Gemini multimodal section text extraction failed")

    # 3) 모두 실패 — title 만이라도 (Gemini conceptize 가 아예 빈 입력 받는 것보단 나음)
    log.warning(
        "section %d: returning title-only fallback (no extractable body text)",
        section_idx,
    )
    return title


def _extract_pages(pdf_path: Path, start: int, end: int) -> str:
    reader = PdfReader(str(pdf_path))
    parts: list[str] = []
    end = min(len(reader.pages) - 1, end)
    for p in range(start, end + 1):
        try:
            parts.append(reader.pages[p].extract_text() or "")
        except Exception:
            continue
    return _clean("\n".join(parts))


def _slice_pdf_bytes(pdf_path: Path, start: int, end: int) -> bytes:
    """선택 페이지 범위 [start, end] 만 담은 새 PDF 의 raw bytes."""
    reader = PdfReader(str(pdf_path))
    end = min(len(reader.pages) - 1, end)
    writer = PdfWriter()
    for p in range(start, end + 1):
        writer.add_page(reader.pages[p])
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def _clean(text: str) -> str:
    out_lines = []
    for line in text.splitlines():
        if _PAGE_NOISE_RE.match(line):
            continue
        out_lines.append(line.rstrip())
    return "\n".join(l for l in out_lines if l.strip())
