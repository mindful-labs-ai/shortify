"""둥근 모서리 / 비네트 마스크 PNG 생성."""
from __future__ import annotations

from pathlib import Path


def round_corner_mask(out: Path, radius: int = 32, w: int = 1080, h: int = 1920) -> Path:
    from PIL import Image, ImageDraw

    img = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle((0, 0, w, h), radius=radius, fill=255)
    img.save(out, "PNG")
    return out


def vignette_mask(out: Path, w: int = 1080, h: int = 1920, strength: float = 0.35) -> Path:
    from PIL import Image, ImageDraw, ImageFilter

    img = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(img)
    draw.ellipse(
        (-int(w * 0.2), -int(h * 0.1), int(w * 1.2), int(h * 1.1)), fill=int(255 * (1 - strength))
    )
    img = img.filter(ImageFilter.GaussianBlur(120))
    img.save(out, "PNG")
    return out
