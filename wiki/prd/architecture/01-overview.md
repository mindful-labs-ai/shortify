# 01. Overview

## 시스템 한 줄 요약

교과서 PDF를 드롭하면 목차 단위로 30~60초 학습 숏폼을 자동 생성하는 **macOS 데스크톱 앱**.

## 단일 프로세스 그룹 = Shortify.app

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

## 7-Layer 아키텍처

| Layer | 책임 | 주요 기술 |
|-------|------|-----------|
| **L1 Presentation** | 사용자 인터랙션, 진행 시각화 | React, Vite, Tailwind, shadcn/ui, Zustand |
| **L2 Shell / Native Bridge** | OS API 접근, 사이드카 생애주기, 보안 | Tauri 2, Rust, security-framework |
| **L3 API** | localhost RPC, 인증, SSE 푸시 | FastAPI, uvicorn |
| **L4 Application / Service** | 유즈케이스 오케스트레이션, 큐 | asyncio, persistent SQLite queue |
| **L5 Domain / Pipeline** | 영상 생성 로직 (video-cli 포팅) | pypdf, Pillow, ffmpeg-python, google-genai |
| **L6 Infrastructure** | 영속성, 비밀, 번들 바이너리 | SQLite, 로컬 FS, Keychain, ffmpeg |
| **L7 External** | 외부 AI/미디어 API | Google Gemini API (`gemini-3.1-flash-lite-preview` + `gemini-3.1-flash-image-preview` + `veo-3.1-generate-preview` + `gemini-3.1-flash-tts-preview` + `gemini-3.1-flash-preview`) |

**의존성 방향**: L1 → L2 → L3 → L4 → L5 → L6 → L7. 역방향 의존 금지.

## 통합 다이어그램

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         Shortify.app  (macOS Bundle)                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ L1. PRESENTATION                                    [ React + Vite + Tailwind]│
│  Pages    DropView · TocCheckList · ImageConceptPicker · JobProgressBoard ·  │
│           VideoLibrary · Settings                                            │
│  State    Zustand     Realtime  EventSource (SSE)                            │
└─────────────────────────┬────────────────────────────────────┬───────────────┘
                          │ tauri.invoke()                     │ fetch / SSE
                          ▼                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ L2. SHELL / NATIVE BRIDGE                                  [ Tauri + Rust   ]│
│  Window/Menu/Dock · Sidecar lifecycle · Keychain · Notifications · Sparkle   │
└─────────────────────────┬────────────────────────────────────┬───────────────┘
                          │ child process                      │ localhost
                          ▼                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ L3. API                                                  [ FastAPI + uvicorn]│
│  localhost:<port> + Bearer token                                             │
│  /upload · /pdfs/:id/toc · /jobs · /jobs/:id · /jobs/:id/stream · ...        │
└─────────────────────────┬────────────────────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ L4. APPLICATION / SERVICE                                                    │
│  UploadService · TocService · JobService · ConceptService · NotifyService    │
│  PersistentTaskQueue (SQLite-backed) ◄── asyncio Workers                     │
└─────────────────────────┬────────────────────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ L5. DOMAIN / PIPELINE                              [ video-cli 포팅된 코어   ]│
│  ingest_pdf → conceptizer → scene_splitter → image_gen → video_gen →         │
│  narration_gen → alignment → rhythm_cut → compose → overlays → final.mp4     │
└─────────────────────────┬────────────────────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ L6. INFRASTRUCTURE                                                           │
│  SQLite · Local FS (~/Library/.../Shortify) · Keychain · ffmpeg-full bundle  │
└─────────────────────────┬────────────────────────────────────────────────────┘
                          ▼ HTTPS
┌──────────────────────────────────────────────────────────────────────────────┐
│ L7. EXTERNAL                                                                 │
│  Google Gemini API: gemini-3.1-flash-lite-preview · gemini-3.1-flash-image-  │
│  preview · veo-3.1-generate-preview · gemini-3.1-flash-tts-preview ·         │
│  gemini-3.1-flash-preview (audio align)                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 격리 경계

| 경계 | 형태 | 통신 |
|------|------|------|
| **L1~L2 ↔ L3~L5** | OS 프로세스 경계 (Rust 셸 vs Python 사이드카) | localhost HTTP/SSE + Bearer 토큰 |
| **App ↔ External Services** | 네트워크 경계 | HTTPS + API 키 (Keychain 보관) |
| **App ↔ User Files** | 샌드박스 경계 (NSOpenPanel) | 사용자가 명시적 선택한 파일만 접근 |

## 핵심 결정 (왜 이 구조인가)

1. **Python 사이드카 필수**: video-cli의 영상 파이프라인 의존성 (ffmpeg-python, pyJianYingDraft, google-genai SDK)이 Python 전용. 재구현은 비현실적.
2. **Tauri 셸 선택**: Electron 대비 번들 ~10MB, Rust 안전성, macOS API 풍부.
3. **외부 백엔드 없음**: 모든 데이터는 로컬에. 인프라 비용 0원, 프라이버시 강함.
4. **SQLite + asyncio queue**: Postgres/Redis/Celery 불필요. 단일 사용자 전제로 단순화.
5. **번들 ffmpeg**: 사용자가 brew 설치 안 하도록 universal2 정적 바이너리를 앱에 포함.

## 다음 문서

- 프론트 디테일 → [02-frontend](./02-frontend.md)
- 사이드카 디테일 → [03-sidecar](./03-sidecar.md)
