"""Shortify sidecar 설정 — env 주도, 안전한 기본값.

부팅 시 프로젝트 루트의 .env 를 자동 로드 (이미 설정된 환경변수는 덮어쓰지 않음).
우선순위: 부모 프로세스 env > Keychain (Tauri 주입) > .env > 기본값.
"""
from __future__ import annotations

import os
import secrets
from functools import lru_cache
from pathlib import Path

from dotenv import find_dotenv, load_dotenv

# .env 자동 탐색 (cwd 부터 위로). override=False → 기존 env 우선.
load_dotenv(find_dotenv(usecwd=True), override=False)

from .storage.paths import app_support_dir  # noqa: E402  (after load_dotenv)


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

    # Veo I2V duration. 모델별 허용 범위 다름 (현 Veo 3.x 류는 4~8 inclusive).
    # 환경변수로 조정 가능: SHORTIFY_VIDEO_DURATION_SEC.
    video_duration_sec: int = int(os.environ.get("SHORTIFY_VIDEO_DURATION_SEC", "6"))

    # Gemini TTS prebuilt voice 이름. 미지정 시 모델 기본 사용.
    # 사용 가능한 prebuilt: Aoede, Charon, Fenrir, Kore, Puck, ... (SDK 문서 참고)
    tts_voice: str = os.environ.get("SHORTIFY_TTS_VOICE", "Kore")

    # 테스트 모드 — Imagen / Veo 호출량을 줄여 dev 사이클을 빠르게.
    #   SHORTIFY_TEST_MODE=1   → test scene count 활성화
    #   SHORTIFY_TEST_SCENE_COUNT=N (기본 2)
    # prod 기본은 14 (scene_splitter 의 default n).
    test_mode: bool = os.environ.get("SHORTIFY_TEST_MODE") == "1"
    test_scene_count: int = max(
        1, int(os.environ.get("SHORTIFY_TEST_SCENE_COUNT", "2"))
    )

    @property
    def scene_count(self) -> int:
        """현재 모드에 맞는 scene 갯수 (test 면 축소, 아니면 14)."""
        return self.test_scene_count if self.test_mode else 14


@lru_cache(maxsize=1)
def settings() -> Settings:
    s = Settings()
    s.data_dir.mkdir(parents=True, exist_ok=True)
    return s
