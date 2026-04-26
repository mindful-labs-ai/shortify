"""씬별 이미지 생성 — Imagen via google-genai.

동시 요청 ≤ 4 (rate limit 회피).
"""
from __future__ import annotations

import asyncio
from pathlib import Path

from .. import notify, prompts as _prompts
from ..db.models import ImageConcept
from . import _gemini

CONCURRENCY = 4
NEG = "blurry, watermark, text artifacts, low quality"


async def _build_prompt(scene: dict, concept: ImageConcept) -> str:
    base = (concept.image_style_preset or "clean educational illustration").strip()
    direction = (scene.get("direction") if isinstance(scene, dict) else None) or "neutral concept image"
    return await _prompts.get(
        "image_gen_scene",
        STYLE_PRESET=base,
        DIRECTION=direction,
        NEGATIVE=NEG,
    )


def _safe_refs(concept: ImageConcept) -> list[Path] | None:
    raw = concept.reference_image_paths
    if not isinstance(raw, list):
        return None
    paths: list[Path] = []
    for item in raw:
        if not isinstance(item, str):
            continue
        p = Path(item)
        if p.exists():
            paths.append(p)
    return paths or None


async def generate(
    scenes: list[dict],
    concept: ImageConcept,
    out_dir: Path,
    *,
    job_id: str,
) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    refs = _safe_refs(concept)
    valid_scenes = [s for s in scenes if isinstance(s, dict) and isinstance(s.get("idx"), int)]
    if not valid_scenes:
        raise RuntimeError("image_gen.generate: no valid scenes (scene_splitter returned empty)")

    async def one(scene: dict) -> Path:
        idx = scene["idx"]
        out = out_dir / f"scene_{idx:03d}.png"
        prompt_text = await _build_prompt(scene, concept)
        async with sem:
            await _gemini.image(prompt_text, out, ref_images=refs)
        await notify.publish(
            job_id, stage=4, message=f"image {idx + 1}/{len(valid_scenes)}",
            progress_pct=(idx + 1) / len(valid_scenes) * 100,
        )
        return out

    return await asyncio.gather(*(one(s) for s in valid_scenes))
