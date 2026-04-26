"""자막·훅·인용 오버레이 생성 (libass + PIL)."""
from __future__ import annotations

from pathlib import Path
from typing import Iterable


# ─────────────── ASS subtitle ───────────────

ASS_HEADER = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Inter,72,&H00FFFFFF,&H00000000,&H80000000,1,1,4,2,2,40,40,140,1
Style: Highlight,Inter,76,&H0000E0FF,&H00000000,&H80000000,1,1,5,2,2,40,40,140,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def write_subtitle_ass(words: list[dict], keywords: Iterable[str], out: Path) -> Path:
    kw_set = {k.lower() for k in keywords}
    lines = [ASS_HEADER]
    # 5단어씩 그룹 (한 화면에 너무 빽빽하지 않게)
    group_size = 5
    for i in range(0, len(words), group_size):
        group = words[i : i + group_size]
        if not group:
            continue
        start = _ass_time(group[0]["start"])
        end = _ass_time(group[-1]["end"])
        text_parts = []
        for w in group:
            style = "Highlight" if w["word"].lower() in kw_set else "Default"
            color_tag = "{\\rHighlight}" if style == "Highlight" else ""
            text_parts.append(f"{color_tag}{w['word']}")
        text = " ".join(text_parts)
        lines.append(f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}")
    out.write_text("\n".join(lines), encoding="utf-8")
    return out


def _ass_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h}:{m:02d}:{s:05.2f}"


# ─────────────── 훅 / 인용 footer ───────────────


def write_hook_png(text: str, out: Path) -> Path:
    """간단한 훅 PNG — PIL 로 텍스트 렌더링."""
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGBA", (1080, 240), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("Inter-Bold.ttf", 64)
    except OSError:
        font = ImageFont.load_default()
    # bg pill
    pad = 32
    draw.rounded_rectangle((40, 40, 1040, 200), radius=24, fill=(0, 0, 0, 200))
    draw.text((40 + pad, 70), text[:40], fill=(255, 255, 255, 255), font=font)
    img.save(out, "PNG")
    return out


def write_citation_png(citation: dict, out: Path) -> Path:
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new("RGBA", (1080, 80), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("Inter.ttf", 28)
    except OSError:
        font = ImageFont.load_default()
    src = citation.get("source_title") or ""
    page = citation.get("page")
    txt = src + (f", p.{page}" if page else "")
    draw.rectangle((0, 0, 1080, 80), fill=(0, 0, 0, 160))
    draw.text((24, 24), txt[:80], fill=(255, 255, 255, 220), font=font)
    img.save(out, "PNG")
    return out
