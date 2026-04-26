"""PDF 목차 추출 + 섹션 텍스트 추출.

1차 시도: pypdf outline → flat list. 실패/빈약하면 Gemini fallback.
"""
from __future__ import annotations

import asyncio
import re
from pathlib import Path

from pypdf import PdfReader

from . import _gemini

_PAGE_NOISE_RE = re.compile(r"^\s*\d+\s*$|^Page\s+\d+", re.IGNORECASE)


async def extract_toc(pdf_path: Path, page_count: int) -> list[dict]:
    return await asyncio.to_thread(_pypdf_outline, pdf_path, page_count) or await _gemini_toc_fallback(pdf_path, page_count)


def _pypdf_outline(pdf_path: Path, page_count: int) -> list[dict]:
    try:
        reader = PdfReader(str(pdf_path))
        flat: list[dict] = []
        idx = 0

        def walk(items, depth: int = 0) -> None:
            nonlocal idx
            for it in items:
                if isinstance(it, list):
                    walk(it, depth + 1)
                    continue
                title = getattr(it, "title", None)
                if not title:
                    continue
                page_num = reader.get_destination_page_number(it)
                flat.append(
                    {
                        "idx": idx,
                        "title": title.strip(),
                        "page_start": int(page_num),
                        "page_end": -1,
                        "depth": depth,
                    }
                )
                idx += 1

        walk(reader.outline)
        for i, item in enumerate(flat):
            item["page_end"] = (
                flat[i + 1]["page_start"] - 1 if i + 1 < len(flat) else page_count - 1
            )
        return flat
    except Exception:
        return []


async def _gemini_toc_fallback(pdf_path: Path, page_count: int) -> list[dict]:
    """outline 비어있을 때: 첫 5페이지 텍스트를 Gemini 에 줘서 TOC 추정."""
    sample_text = ""
    reader = PdfReader(str(pdf_path))
    for i in range(min(5, len(reader.pages))):
        sample_text += reader.pages[i].extract_text() or ""
    sample_text = sample_text[:8000]
    if not sample_text.strip():
        return [{"idx": 0, "title": pdf_path.stem, "page_start": 0, "page_end": page_count - 1, "depth": 0}]

    prompt = (
        "From the following table-of-contents-like text, extract a flat list of "
        "sections in JSON form: "
        '[{"title": str, "page_start": int 0-indexed, "page_end": int}]. '
        f"Total page count is {page_count}. If unclear, split into ~5 equal parts.\n\n"
        f"TEXT:\n{sample_text}"
    )
    parsed = await _gemini.text_json(prompt)
    items = parsed if isinstance(parsed, list) else parsed.get("sections", [])
    return [{"idx": i, **it, "depth": 0} for i, it in enumerate(items)]


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
