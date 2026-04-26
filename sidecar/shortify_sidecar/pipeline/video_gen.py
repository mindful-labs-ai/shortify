"""I2V (image-to-video) — Veo via google-genai.

각 이미지를 5초 클립으로. 동시 요청 ≤ 2 (Veo 비용·rate 고려).
"""
from __future__ import annotations

import asyncio
from pathlib import Path

from .. import notify
from . import _gemini

CONCURRENCY = 2

MOTION_PRESETS = {
    "subtle": "slow gentle pan, minimal motion, breathing room, soft camera drift",
    "medium": "moderate camera dolly, light parallax",
    "static": "no camera motion, only subtle element animation",
}


async def generate(
    images: list[Path],
    motion: str,
    out_dir: Path,
    *,
    job_id: str,
) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    motion_prompt = MOTION_PRESETS.get(motion, MOTION_PRESETS["subtle"])

    async def one(idx: int, img: Path) -> Path:
        out = out_dir / f"scene_{idx:03d}.mp4"
        async with sem:
            await _gemini.i2v(img, motion_prompt, out, duration_sec=5)
        await notify.publish(
            job_id, stage=5, message=f"clip {idx + 1}/{len(images)}",
            progress_pct=(idx + 1) / len(images) * 100,
        )
        return out

    return await asyncio.gather(*(one(i, p) for i, p in enumerate(images)))
