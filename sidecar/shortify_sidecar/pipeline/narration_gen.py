"""TTS — Gemini native audio. 결과는 단일 MP3."""
from __future__ import annotations

from pathlib import Path

from . import _gemini


async def tts(text: str, *, voice: str, speed: float, out_path: Path) -> Path:
    return await _gemini.tts(text, voice=voice, speed=speed, out_path=out_path)
