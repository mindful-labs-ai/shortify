"""Shortify sidecar 설정 — env 주도, 안전한 기본값."""
from __future__ import annotations

import os
import secrets
from functools import lru_cache
from pathlib import Path

from .storage.paths import app_support_dir


class Settings:
    host: str = os.environ.get("SHORTIFY_HOST", "127.0.0.1")
    port: int = int(os.environ.get("SHORTIFY_PORT", "51234"))
    token: str = os.environ.get("SHORTIFY_TOKEN") or secrets.token_urlsafe(32)
    dev_mode: bool = os.environ.get("SHORTIFY_DEV") == "1"

    gemini_api_key: str = os.environ.get("GEMINI_API_KEY", "")
    ffmpeg_path: str = os.environ.get(
        "SHORTIFY_FFMPEG",
        # 1) 번들 우선, 2) 시스템 폴백
        str(Path(__file__).parent.parent.parent / "assets" / "ffmpeg" / "ffmpeg"),
    )

    data_dir: Path = Path(os.environ.get("SHORTIFY_DATA_DIR") or app_support_dir())
    db_path: Path = data_dir / "db.sqlite"

    database_url: str = os.environ.get(
        "SHORTIFY_DATABASE_URL",
        f"sqlite+aiosqlite:///{db_path}",
    )

    n_workers: int = int(os.environ.get("SHORTIFY_WORKERS", "2"))

    # Gemini model IDs (변경 결정 사항)
    model_text: str = "gemini-3.1-flash-lite-preview"
    model_image: str = "gemini-3.1-flash-image-preview"
    model_video: str = "veo-3.1-generate-preview"
    model_tts: str = "gemini-3.1-flash-tts-preview"
    model_audio: str = "gemini-3.1-flash-preview"


@lru_cache(maxsize=1)
def settings() -> Settings:
    s = Settings()
    s.data_dir.mkdir(parents=True, exist_ok=True)
    return s
