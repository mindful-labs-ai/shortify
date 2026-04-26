"""4비트 → N씬 분할 (deterministic, AI 호출 없음).

기본 14씬: hook 2 / core 3 / mechanism 5 / recap 2 + 양 끝 padding 2.
각 씬에 visual direction 부여 — image_gen 이 그걸 prompt 머리말에 주입.
"""
from __future__ import annotations

import logging

log = logging.getLogger("shortify.pipeline.scene_splitter")

DEFAULT_DIST = {"hook": 2, "core": 3, "mechanism": 5, "recap": 2}
PADDING = 2  # opening + closing


def _safe_beats(conceptized: dict) -> dict[str, str]:
    """Gemini 가 가끔 null beat / 비표준 모양을 돌려줘도 죽지 않게.

    허용 입력:
      - {"beats": [{"kind":..,"text":..}, ...]}                (정규)
      - {"beats": null} / 누락                                 → {}
      - {"beats": [null, ..., {"kind":..}]}                    → 유효한 것만 채움
      - {"beats": {"hook":"...", "core":"..."}}                → 그대로 반환
    """
    raw = conceptized.get("beats")
    if raw is None:
        return {}
    if isinstance(raw, dict):
        return {str(k): str(v) for k, v in raw.items() if v is not None}
    if not isinstance(raw, list):
        log.warning("beats is %s, expected list/dict", type(raw).__name__)
        return {}
    out: dict[str, str] = {}
    for b in raw:
        if not isinstance(b, dict):
            continue
        kind = b.get("kind")
        text = b.get("text")
        if isinstance(kind, str) and text is not None:
            out[kind] = str(text)
    return out


def _safe_list(value, label: str) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return [v for v in value if v is not None]
    log.warning("%s is %s, expected list", label, type(value).__name__)
    return []


def split(conceptized: dict | None, n: int = 14) -> list[dict]:
    if not isinstance(conceptized, dict):
        log.warning("conceptized is %s, treating as empty", type(conceptized).__name__)
        conceptized = {}

    beats = _safe_beats(conceptized)
    keywords = [str(k) for k in _safe_list(conceptized.get("keywords"), "keywords")]
    title = str(conceptized.get("title") or "")

    scenes: list[dict] = []

    # opening
    scenes.append(_scene(0, "opening", title, "title card style, clean composition"))

    inner = max(1, n - 2 * PADDING + (PADDING * 2))  # not strictly needed; keep simple
    body_n = n - PADDING
    dist = _scaled_distribution(body_n - 1)  # -1 because closing pad
    cursor = 1

    for kind, count in dist.items():
        for k in range(count):
            text = beats.get(kind, "")
            kw = keywords[k % len(keywords)] if keywords else ""
            direction = _direction(kind, k, kw)
            scenes.append(_scene(cursor, kind, text, direction))
            cursor += 1

    # closing
    scenes.append(_scene(cursor, "closing", title, "subtle fade-out, end card"))

    # n 개로 정확히 맞추기
    return scenes[:n] if len(scenes) >= n else scenes + [
        _scene(len(scenes) + i, "filler", title, "neutral concept image")
        for i in range(n - len(scenes))
    ]


def _scaled_distribution(total: int) -> dict[str, int]:
    base_total = sum(DEFAULT_DIST.values())
    out = {k: max(1, round(v / base_total * total)) for k, v in DEFAULT_DIST.items()}
    diff = total - sum(out.values())
    # 가장 큰 슬롯에서 가감
    biggest = max(out, key=lambda k: out[k])
    out[biggest] += diff
    return out


def _scene(idx: int, kind: str, text: str, direction: str) -> dict:
    return {
        "idx": idx,
        "kind": kind,
        "text": text,
        "direction": direction,
    }


def _direction(kind: str, k: int, keyword: str) -> str:
    if kind == "hook":
        return "intriguing visual question, bold central subject" + (f", emphasize '{keyword}'" if keyword else "")
    if kind == "core":
        return f"central diagram showing the main idea" + (f", label '{keyword}'" if keyword else "")
    if kind == "mechanism":
        return f"step {k + 1} of the mechanism" + (f", highlight '{keyword}'" if keyword else "")
    if kind == "recap":
        return "summary visual recapping the concept"
    return "neutral concept image"
