# Shortify

> **Turn knowledge into short-form videos for faster learning**
>
> 교과서 PDF를 드롭하면 목차 단위로 30~60초 학습 숏폼을 자동 생성해주는 macOS 데스크톱 앱.

---

## 개요

Shortify는 PDF 한 권을 드롭하면, 사용자가 선택한 목차 단위마다 한 편씩 1080×1920 세로 학습 영상을 만들어 라이브러리에 채워주는 macOS 앱이다. 영상 1편은 **Hook → Core Idea → Mechanism → Example → Recap** 4비트 학습 구조를 따른다.

- **입력**: PDF (v0)
- **출력**: 1080×1920, 30fps, 30~60초 MP4
- **타겟**: 하루 한 개념씩 마이크로러닝하고 싶은 학습자
- **차별점**: 출처 자동 인용, 핵심 용어 하이라이트, 다이어그램 중심 비주얼
- **영상 파이프라인 출처**: [mindful-labs-ai/video-cli](https://github.com/mindful-labs-ai/video-cli)에서 검증된 Seedream → Seedance → ElevenLabs → Whisper → 리듬 컷 → 9:16 컴포즈 스택을 Python 사이드카로 포팅

---

## 아키텍처 (요약)

```
┌──────────────────────────────────────────────────────┐
│ Shortify.app                                         │
│  ├─ Tauri Shell (Rust)         ← UI 호스트, OS 브리지 │
│  ├─ React UI (WKWebView)       ← 사용자 인터페이스    │
│  └─ Python Sidecar (FastAPI)   ← 영상 생성 코어       │
└──────────────────────────────────────────────────────┘
        │                    │
   localhost HTTP        외부 HTTPS
        │                    │
        ▼                    ▼
  ~/Library/.../Shortify   외부 AI APIs
```

### 7-Layer 구조

| Layer | 책임 | 주요 기술 |
|-------|------|-----------|
| L1 Presentation | 사용자 인터랙션, 진행 시각화 | React, Vite, Tailwind, shadcn/ui, Zustand |
| L2 Shell / Native Bridge | OS API, 사이드카 생애주기, 보안 | Tauri 2, Rust, security-framework |
| L3 API | localhost RPC, 인증, SSE 푸시 | FastAPI, uvicorn |
| L4 Application / Service | 유즈케이스 오케스트레이션, 큐 | asyncio, persistent SQLite queue |
| L5 Domain / Pipeline | 영상 생성 로직 | pypdf, Pillow, ffmpeg-python, faster-whisper |
| L6 Infrastructure | 영속성, 비밀, 번들 바이너리 | SQLite, 로컬 FS, Keychain, ffmpeg |
| L7 External | 외부 AI/미디어 API | Claude, BytePlus Ark (Seedream/Seedance), ElevenLabs |

**의존성 방향**: L1 → L2 → L3 → L4 → L5 → L6 → L7 (역방향 금지).

상세는 [`wiki/prd/architecture/`](./wiki/prd/architecture/) 참고.

---

## 사용자 플로우

```
[1] 앱 실행 → Drop View
        ▼
[2] PDF 드롭 → 자동으로 목차 추출
        ▼
[3] 목차 체크리스트 (최대 5개 소단위 선택)
        ▼
[4] 백그라운드: 섹션 텍스트 추출 + Claude 4비트 추출
    UI: 5종 이미지 컨셉 카드 노출 → 사용자 선택
        ▼
[5] Seedream(이미지) → Seedance(I2V) → ElevenLabs(TTS)
    → Whisper 정렬 → 리듬 컷 → ffmpeg 컴포즈
        ▼
[6] 라이브러리에 final.mp4 추가 → 인앱 AVPlayer 재생
```

---

## 처리 단계 (Stage)

| stage | 이름 | 작업 | ETA |
|-------|------|------|-----|
| 0 | `queued` | 큐 등록 | 즉시 |
| 1 | `extracting_section` | PDF 섹션 텍스트 추출 (pypdf) | ~5s |
| 2 | `conceptizing` | Claude로 제목/주제/4비트 추출 | ~15s |
| 3 | `awaiting_image_choice` | 사용자 이미지 컨셉 선택 대기 | (사용자) |
| 4 | `generating_images` | Seedream으로 14장 이미지 | ~60s |
| 5 | `generating_clips` | Seedance I2V로 14 클립 | ~5~7m |
| 6 | `generating_narration` | ElevenLabs TTS | ~30s |
| 7 | `aligning` | faster-whisper word-level (로컬) | ~30s |
| 8 | `composing` | ffmpeg 리듬 컷 + 자막 + 훅 + BGM | ~2m |
| 9 | `done` | final.mp4 저장 완료 | — |
| -1 | `failed` | 에러 (재시도 옵션) | — |

영상 1편 ETA: **~10~12분** (이미지 선택 대기 시간 제외).

---

## 레포 구조

```
shortify/
├── src-tauri/                     # Rust shell (Tauri 2)
│   └── src/
│       ├── main.rs · sidecar.rs · keychain.rs · menu.rs · updater.rs
├── src/                           # React + Vite 프론트엔드
│   ├── pages/                     # DropView · TocCheckList · ImageConceptPicker · JobProgressBoard · VideoLibrary · Settings
│   ├── components/                # DropZone · ImageConceptCard · JobProgressCard · VideoPlayer
│   ├── lib/                       # api.ts · sse.ts · tauri.ts
│   └── store/                     # Zustand
├── sidecar/                       # Python 백엔드 (FastAPI)
│   └── shortify_sidecar/
│       ├── main.py
│       ├── api/                   # upload · toc · jobs · concepts · health
│       ├── db/                    # schema.sql · repo.py
│       ├── queue/                 # persistent.py · workers.py
│       ├── pipeline/              # ingest_pdf · conceptizer · scene_splitter · image_gen · video_gen · narration_gen · alignment · rhythm_cut · compose · overlays · effects · make_mask
│       └── storage/
├── assets/
│   ├── image_concepts/            # 5종 비주얼 프리셋
│   ├── fonts/                     # Pretendard, Black Han Sans
│   ├── bgm/                       # 라이선스 클리어 BGM
│   └── ffmpeg/                    # universal2 정적 ffmpeg
├── prompts/                       # toc_extractor · conceptizer · scene_director
├── scripts/                       # build_sidecar · codesign · notarize · make_dmg
├── tests/                         # pytest (sidecar) · vitest (ui)
└── .github/workflows/release.yml  # macOS runner: build → sign → notarize → release
```

---

## 기술 스택

| 영역 | 선택 |
|------|------|
| 앱 셸 | Tauri 2.x (Rust) |
| UI | React 19 + Vite + Tailwind + shadcn/ui + Zustand |
| 사이드카 | Python 3.11 + FastAPI + uvicorn |
| DB | SQLite (sqlmodel) |
| 작업 큐 | asyncio + SQLite-backed persistent queue |
| PDF 파싱 | pypdf + pdfplumber |
| LLM | Anthropic Claude |
| 영상 생성 | Seedream + Seedance + ElevenLabs |
| 음성 정렬 | faster-whisper (로컬, CoreML 가속) |
| ffmpeg | universal2 정적 바이너리 (앱 번들 포함) |
| 사이드카 패키징 | PyInstaller (--onefile, universal2) |
| Keychain | `security-framework` crate |
| 자동 업데이트 | Sparkle (EdDSA 서명) |
| 배포 | DMG + GitHub Releases + Sparkle appcast |

---

## 로컬 개발

```bash
# 1. 사이드카 dev (PyInstaller 없이 hot reload)
cd sidecar && uvicorn shortify_sidecar.main:app --port 51234 --reload

# 2. Tauri dev (위 사이드카에 연결)
SHORTIFY_DEV=1 pnpm tauri dev
```

API 키는 앱 실행 후 Settings에서 입력 → macOS Keychain에 저장된다.

### 필요한 API 키

| 키 | 용도 |
|----|------|
| `ANTHROPIC_API_KEY` | 목차 폴백, 4비트 컨셉 추출 |
| `ARK_API_KEY` | BytePlus Seedream (이미지) + Seedance (I2V) |
| `ELEVENLABS_API_KEY` | 한국어 TTS |

Whisper는 로컬 모델 — 외부 키 불필요.

---

## 빌드 & 릴리즈

GitHub Actions (macOS runner)에서 `v*` 태그 푸시로 트리거:

1. `pnpm vite build` (frontend → `dist/`)
2. `pyinstaller PyInstaller.spec --target-arch universal2` (사이드카 단일 실행파일)
3. `cargo tauri build --target universal-apple-darwin` (Rust + 사이드카 + ffmpeg + assets)
4. `codesign --deep --options=runtime --entitlements ...`
5. `xcrun notarytool submit --wait`
6. `xcrun stapler staple`
7. `create-dmg → Shortify-x.y.z.dmg`
8. Sparkle EdDSA 서명 + `appcast.xml`
9. `gh release create`

```bash
git tag v1.2.3 && git push origin v1.2.3
```

상세는 [`wiki/prd/architecture/07-build-deploy.md`](./wiki/prd/architecture/07-build-deploy.md).

---

## 데이터 위치

| 항목 | 경로 |
|------|------|
| DB | `~/Library/Application Support/Shortify/db.sqlite` |
| 원본 PDF | `~/Library/Application Support/Shortify/pdfs/` |
| 영상 출력 | `~/Library/Application Support/Shortify/output/<job_id>/final.mp4` |
| 로그 | `~/Library/Application Support/Shortify/logs/sidecar.log` |
| API 키 | macOS Keychain (`shortify` service) |

---

## 보안 핵심

- **사이드카 = 127.0.0.1 바인딩 + 부팅 시 발급 Bearer 토큰** (다른 로컬 프로세스 차단)
- **API 키 = macOS Keychain 전용**. 평문 파일/SQLite/로그 절대 저장 금지
- **Tauri Shell만 Keychain 직접 접근**, 사이드카에는 환경변수로 주입 (권한 분리)
- **외부 호출 HTTPS only**, 인증서 검증 활성
- **Sparkle 업데이트 EdDSA 서명 검증** + Apple notarization
- **Hardened runtime** (`entitlements.plist`): `network.server` false, `network.client` true

상세는 [`wiki/prd/architecture/08-security.md`](./wiki/prd/architecture/08-security.md).

---

## 비용 (영상 1편, BYOK 기준)

Seedream $0.45 + Seedance $2.10 + ElevenLabs $0.15 + Claude $0.05~$0.20 = **~$2.75~$2.90/편**

개발사 인프라 비용은 거의 0원 (외부 백엔드 없음). GitHub Actions ~$10/월 + Apple Developer Program $99/년.

---

## 문서 인덱스

- 기획안: [`wiki/prd/IDEA.md`](./wiki/prd/IDEA.md)
- 단계별 로드맵: [`wiki/prd/plan.md`](./wiki/prd/plan.md)
- 아키텍처:
  - [01 Overview](./wiki/prd/architecture/01-overview.md)
  - [02 Frontend](./wiki/prd/architecture/02-frontend.md)
  - [03 Sidecar](./wiki/prd/architecture/03-sidecar.md)
  - [04 Data Model](./wiki/prd/architecture/04-data-model.md)
  - [05 API Spec](./wiki/prd/architecture/05-api-spec.md)
  - [06 Pipeline](./wiki/prd/architecture/06-pipeline.md)
  - [07 Build & Deploy](./wiki/prd/architecture/07-build-deploy.md)
  - [08 Security](./wiki/prd/architecture/08-security.md)
