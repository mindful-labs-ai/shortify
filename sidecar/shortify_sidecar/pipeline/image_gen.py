"""씬별 이미지 생성 — Imagen via google-genai.

동시 요청 ≤ 4 (rate limit 회피).
"""
from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from .. import notify, prompts as _prompts
from ..db.models import ImageConcept
from . import _gemini

log = logging.getLogger("shortify.pipeline.image_gen")

CONCURRENCY = 4
# 자막은 ffmpeg 컴포즈 단계에서 burn-in 되므로 이미지 자체에는 글자가
# 들어가면 안 된다. 캐릭터 일관성도 글자 노이즈로 방해받음.
NEG = (
    "no text, no letters, no words, no captions, no labels, no signs, "
    "no logos, no watermarks, no numbers, no typography of any kind, "
    "no UI overlays, no speech bubbles, "
    "blurry, low quality"
)


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
        "image_gen_scene_v3",
        STYLE_PRESET=base,
        DIRECTION=direction,
        NEGATIVE=NEG,
        SUBJECT=subject,
        KEYWORDS=keywords_str or "(none)",
        TITLE=title or "(untitled)",
    )


def _safe_refs(concept: ImageConcept) -> list[Path] | None:
    """concept.reference_image_paths 를 안전하게 list[Path] 로 변환.

    각 항목은 다음 중 하나로 해석된다 (우선순위):
      1) 로컬 절대/상대 경로  — 그대로 Path 사용
      2) http(s):// URL       — _ref_cache_dir 에 1회 다운로드 후 그 Path 사용
                                (파일명 = sha256 prefix + 원본 확장자)

    JSON 컬럼이 list 가 아니라 단일 string 으로 저장된 적이 있어서
    string · list · JSON 인코딩된 string 모두 허용한다.
    """
    raw = concept.reference_image_paths

    if isinstance(raw, str):
        s = raw.strip()
        if s.startswith("["):
            try:
                import json as _json

                decoded = _json.loads(s)
                raw = decoded if isinstance(decoded, list) else [s]
            except Exception:
                raw = [s]
        else:
            raw = [s]

    if not isinstance(raw, list):
        log.warning(
            "concept %s: reference_image_paths is %s, expected list — ignoring",
            concept.slug,
            type(raw).__name__,
        )
        return None

    paths: list[Path] = []
    missing: list[str] = []
    for item in raw:
        if not isinstance(item, str) or not item.strip():
            continue
        item = item.strip()
        if item.startswith(("http://", "https://")):
            cached = _fetch_remote_ref(item)
            if cached is not None:
                paths.append(cached)
            else:
                missing.append(item)
            continue
        p = Path(item)
        if p.exists():
            paths.append(p)
        else:
            missing.append(item)
    if missing:
        log.warning(
            "concept %s: %d ref(s) unavailable: %s",
            concept.slug,
            len(missing),
            missing,
        )
    return paths or None


# ─────────────────────── remote ref fetch / cache ───────────────────────


def _ref_cache_dir() -> Path:
    """원격 ref 다운로드 캐시. ~/Library/Application Support/Shortify/ref_cache/."""
    from ..storage.paths import app_support_dir

    d = app_support_dir() / "ref_cache"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _fetch_remote_ref(url: str) -> Path | None:
    """url → 로컬 캐시 Path. 실패시 None."""
    import hashlib
    import urllib.request
    import urllib.error

    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
    suffix = ".png"
    for ext in (".png", ".jpg", ".jpeg", ".webp"):
        if url.lower().endswith(ext):
            suffix = ".jpg" if ext == ".jpeg" else ext
            break
    cached = _ref_cache_dir() / f"{digest}{suffix}"
    if cached.exists() and cached.stat().st_size > 0:
        return cached
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Shortify/0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
        if not data:
            return None
        cached.write_bytes(data)
        log.info("fetched remote ref %s -> %s (%d bytes)", url, cached.name, len(data))
        return cached
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        log.warning("failed to fetch remote ref %s: %s", url, e)
        return None


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
