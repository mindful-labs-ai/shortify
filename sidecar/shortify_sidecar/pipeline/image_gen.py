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


async def _build_prompt(
    scene: dict,
    concept: ImageConcept,
    *,
    title: str,
    keywords_str: str,
) -> str:
    """v2 prompt — PDF 본문(SUBJECT) 을 함께 주입해서 Imagen 이 엉뚱한 그림을 그리지 않도록."""
    base = (concept.image_style_preset or "clean educational illustration").strip()
    direction = (
        scene.get("direction") if isinstance(scene, dict) else None
    ) or "neutral concept image"
    # scene["text"] 가 해당 비트의 실제 PDF 발췌 — 비어있으면 title 폴백.
    subject = (scene.get("text") if isinstance(scene, dict) else None) or title or "the concept"
    # 너무 길면 Imagen 프롬프트 토큰을 모두 먹어버림.
    subject = str(subject)[:600]
    return await _prompts.get(
        "image_gen_scene_v2",
        STYLE_PRESET=base,
        DIRECTION=direction,
        NEGATIVE=NEG,
        SUBJECT=subject,
        KEYWORDS=keywords_str or "(none)",
        TITLE=title or "(untitled)",
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


def _extract_grounding(conceptized: dict | None) -> tuple[str, str]:
    """conceptized_json 에서 (title, keywords_str) 안전 추출."""
    if not isinstance(conceptized, dict):
        return ("", "")
    title = str(conceptized.get("title") or "").strip()
    raw_kw = conceptized.get("keywords")
    if isinstance(raw_kw, list):
        kws = [str(k).strip() for k in raw_kw if k]
        keywords_str = ", ".join(kws[:8])
    else:
        keywords_str = ""
    return (title, keywords_str)


async def generate(
    scenes: list[dict],
    concept: ImageConcept,
    out_dir: Path,
    *,
    job_id: str,
    conceptized: dict | None = None,
) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(CONCURRENCY)
    refs = _safe_refs(concept)
    valid_scenes = [s for s in scenes if isinstance(s, dict) and isinstance(s.get("idx"), int)]
    if not valid_scenes:
        raise RuntimeError("image_gen.generate: no valid scenes (scene_splitter returned empty)")

    title, keywords_str = _extract_grounding(conceptized)

    async def one(scene: dict) -> Path:
        idx = scene["idx"]
        out = out_dir / f"scene_{idx:03d}.png"
        prompt_text = await _build_prompt(
            scene, concept, title=title, keywords_str=keywords_str
        )
        async with sem:
            await _gemini.image(prompt_text, out, ref_images=refs)
        await notify.publish(
            job_id, stage=4, message=f"image {idx + 1}/{len(valid_scenes)}",
            progress_pct=(idx + 1) / len(valid_scenes) * 100,
        )
        return out

    return await asyncio.gather(*(one(s) for s in valid_scenes))
