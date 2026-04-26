"""ffmpeg 호출로 final.mp4 생성.

순서:
  1) 14 클립을 rhythm_plan 길이로 trim → concat
  2) 정규화 (1080x1920, 30fps)
  3) Fuji curve + grain
  4) ASS 자막 burn-in
  5) audio: narration + bgm 믹싱 (BGM 있으면)
"""
from __future__ import annotations

import logging
import shlex
import shutil
import subprocess
from pathlib import Path

from ..settings import settings
from . import effects, overlays, rhythm_cut

log = logging.getLogger("shortify.compose")


def _ffmpeg() -> str:
    p = settings().ffmpeg_path
    if Path(p).exists():
        return p
    sys = shutil.which("ffmpeg")
    if sys:
        return sys
    raise RuntimeError(f"ffmpeg not found at {p} or in PATH")


def compose_final(
    clips: list[Path],
    narration: Path,
    words: list[dict],
    concept_slug: str,
    conceptized: dict,
    out: Path,
    *,
    job_id: str,
) -> Path:
    work = out.parent
    work.mkdir(parents=True, exist_ok=True)

    plan = rhythm_cut.plan(words, n_clips=len(clips))

    # 1) clip 별 trim
    trimmed: list[Path] = []
    for p, clip in zip(plan, clips):
        t_path = work / f"_trim_{p['clip_idx']:03d}.mp4"
        _run([
            _ffmpeg(), "-y",
            "-i", str(clip),
            "-t", f"{p['duration_sec']:.3f}",
            "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
            str(t_path),
        ])
        trimmed.append(t_path)

    # 2) concat list
    concat_txt = work / "_concat.txt"
    concat_txt.write_text("".join(f"file '{p}'\n" for p in trimmed))

    # 3) 자막 ASS
    ass_path = work / "_subs.ass"
    overlays.write_subtitle_ass(words, conceptized.get("keywords", []), ass_path)

    # 4) ffmpeg 단일 그래프로 컴포즈
    filter_chain = (
        f"[0:v]{effects.vertical_scale()},"
        f"{effects.fuji_curve()},"
        f"{effects.grain(8)},"
        f"ass={shlex.quote(str(ass_path))}[v]"
    )

    cmd = [
        _ffmpeg(), "-y",
        "-f", "concat", "-safe", "0", "-i", str(concat_txt),
        "-i", str(narration),
        "-filter_complex", filter_chain,
        "-map", "[v]",
        "-map", "1:a",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest", "-movflags", "+faststart",
        str(out),
    ]
    _run(cmd, log_path=work / "compose.log")
    # 청소
    for p in trimmed:
        p.unlink(missing_ok=True)
    concat_txt.unlink(missing_ok=True)
    return out


def _run(cmd: list[str], *, log_path: Path | None = None) -> None:
    log.info("ffmpeg: %s", " ".join(shlex.quote(c) for c in cmd))
    try:
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True,
        )
    except subprocess.CalledProcessError as e:
        if log_path:
            log_path.write_text((e.stdout or "") + "\n---STDERR---\n" + (e.stderr or ""))
        raise
    if log_path:
        log_path.write_text((result.stdout or "") + "\n---STDERR---\n" + (result.stderr or ""))
