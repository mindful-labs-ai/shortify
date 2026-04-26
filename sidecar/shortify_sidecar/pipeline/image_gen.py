"""씬별 이미지 생성 — Imagen via google-genai.

동시 요청 ≤ 4 (rate limit 회피).
"""
from __future__ import annotations

import asyncio
from pathlib import Path

from .. import notify
from ..db.models import ImageConcept
from . import _gemini

CONCURRENCY = 4
NEG = "blurry, watermark, text artifacts, low quality"


def _build_prompt(scene: dict, concept: ImageConcept) -> str:
    base = concept.image_style_preset
    return (
        f"{base}. {scene['direction']}. "
        f"Vertical 9:16 composition. "
        f"Negative: {NEG}."
    )


async def generate(
    scenes: list[dict],
    concept: ImageConcept,
    out_dir: Path,
    *,
    job_id: str,
) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    refs = [Path(p) for p in (concept.reference_image_paths or []) if Path(p).exists()] or None

    async def one(scene: dict) -> Path:
        out = out_dir / f"scene_{scene['idx']:03d}.png"
        async with sem:
            await _gemini.image(_build_prompt(scene, concept), out, ref_images=refs)
        await notify.publish(
            job_id, stage=4, message=f"image {scene['idx'] + 1}/{len(scenes)}",
            progress_pct=(scene["idx"] + 1) / len(scenes) * 100,
        )
        return out

    return await asyncio.gather(*(one(s) for s in scenes))
