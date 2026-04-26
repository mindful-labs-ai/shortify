"""ffmpeg filter chain 조각."""
from __future__ import annotations


def fuji_curve() -> str:
    """Fuji 풍 curve + 채도/대비 미세 조정."""
    return (
        "curves=r='0/0 0.5/0.55 1/1':g='0/0 0.5/0.5 1/1':b='0/0.05 0.5/0.5 1/0.95',"
        "eq=saturation=1.05:contrast=1.04:gamma=1.0"
    )


def grain(strength: int = 8) -> str:
    return f"noise=alls={strength}:allf=t"


def vertical_scale() -> str:
    """1080x1920로 정규화."""
    return "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30"
