"""4비트 → N씬 분할 (deterministic, AI 호출 없음).

기본 14씬: hook 2 / core 3 / mechanism 5 / recap 2 + 양 끝 padding 2.
각 씬에 visual direction 부여 — image_gen 이 그걸 prompt 머리말에 주입.
"""
from __future__ import annotations

DEFAULT_DIST = {"hook": 2, "core": 3, "mechanism": 5, "recap": 2}
PADDING = 2  # opening + closing


def split(conceptized: dict, n: int = 14) -> list[dict]:
    beats = {b["kind"]: b["text"] for b in conceptized.get("beats", [])}
    keywords = conceptized.get("keywords", [])
    title = conceptized.get("title", "")

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
