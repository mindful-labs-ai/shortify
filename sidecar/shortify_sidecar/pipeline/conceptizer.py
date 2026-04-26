"""섹션 텍스트 → 4비트 학습 구조 JSON."""
from __future__ import annotations

from pathlib import Path

from . import _gemini


def _system_prompt(lang: str) -> str:
    return (
        "You are a learning-design assistant. Given a passage from a textbook, "
        "extract one core concept and structure it for a 30-60s short-form video.\n"
        "Output STRICT JSON matching this schema:\n"
        "{\n"
        '  "title": str (English, <40 chars),\n'
        '  "topic": str (one-line context),\n'
        '  "beats": [\n'
        '    {"kind":"hook",      "text": str (15-25 words, opens with a question or surprise)},\n'
        '    {"kind":"core",      "text": str (one sentence, the central claim)},\n'
        '    {"kind":"mechanism", "text": str (1-2 sentences, how/why it works)},\n'
        '    {"kind":"recap",     "text": str (one short sentence, restates the gist)}\n'
        "  ],\n"
        '  "keywords": [str, ...] (3-6 terms to highlight),\n'
        '  "citation": {"source_title": str|null, "page": int|null}\n'
        "}\n"
        f"Output language: {lang}."
    )


async def conceptize(text: str, *, lang: str = "en") -> dict:
    text = text.strip()[:12000]  # 입력 cap
    return await _gemini.text_json(
        f"Passage:\n\n{text}",
        system=_system_prompt(lang),
    )
