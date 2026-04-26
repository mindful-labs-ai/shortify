"""I2V (image-to-video) — Veo via google-genai.

각 이미지의 클립 길이는 settings.video_duration_sec (기본 6, env 로 조정 가능).
동시 요청 ≤ 2 (Veo 비용·rate 고려).

motion 프롬프트는 DB ``prompts`` 테이블의 ``motion_<motion>`` key 에서 로드.
지원 모션: subtle / medium / static. 알 수 없는 값은 subtle 로 폴백.
"""
from __future__ import annotations

import asyncio
from pathlib import Path

from .. import notify, prompts as _prompts
from . import _gemini

CONCURRENCY = 2
VALID_MOTIONS = {"subtle", "medium", "static"}


async def generate(
    images: list[Path],
    motion: str,
    out_dir: Path,
    *,
    job_id: str,
) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    motion_key = f"motion_{motion if motion in VALID_MOTIONS else 'subtle'}"
    motion_prompt = await _prompts.get(motion_key)

    async def one(idx: int, img: Path) -> Path:
        out = out_dir / f"scene_{idx:03d}.mp4"
        async with sem:
            await _gemini.i2v(img, motion_prompt, out)
        await notify.publish(
            job_id, stage=5, message=f"clip {idx + 1}/{len(images)}",
            progress_pct=(idx + 1) / len(images) * 100,
        )
        return out

    return await asyncio.gather(*(one(i, p) for i, p in enumerate(images)))
