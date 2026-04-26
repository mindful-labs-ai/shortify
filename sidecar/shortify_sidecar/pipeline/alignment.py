"""Word-level alignment — Gemini audio understanding.

응답: ``[{"word": str, "start": float seconds, "end": float seconds}, ...]``
"""
from __future__ import annotations

from pathlib import Path

from . import _gemini


async def align(audio: Path, text: str) -> list[dict]:
    words = await _gemini.align_words_audio(audio, text)
    if not isinstance(words, list):
        words = words.get("words", []) if isinstance(words, dict) else []
    # sanitize
    out: list[dict] = []
    for w in words:
        if not isinstance(w, dict):
            continue
        try:
            out.append(
                {"word": str(w["word"]), "start": float(w["start"]), "end": float(w["end"])}
            )
        except (KeyError, TypeError, ValueError):
            continue
    return out
