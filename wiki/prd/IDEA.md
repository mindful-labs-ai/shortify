# Shortify 기획안 (macOS App)

> **슬로건**: Turn knowledge into short-form videos for faster learning
> **한 줄 요약**: 교과서 PDF를 드롭하면 목차 단위로 30~60초 학습 숏폼을 자동 생성해주는 macOS 데스크톱 앱.

---

## 핵심 추천

**`shortify`를 신규 독립 레포로 생성**하고, **macOS 네이티브 앱 셸 + Python 사이드카 프로세스** 구조로 빌드한다. video-cli의 검증된 영상 생성 파이프라인은 Python 사이드카에 그대로 포팅한다.

### 아키텍처 선택: Tauri + Python 사이드카 (추천)

| 옵션                                                | 장점                                                                                       | 단점                                                               | 판단         |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------ |
| **A. Tauri (Rust shell + Web UI) + Python sidecar** | 작은 번들(~10MB shell), 웹 UI 개발 속도, Python 파이프라인 그대로 사용, 크로스 플랫폼 여지 | Rust + Python 두 언어 빌드 파이프라인                              | **추천 v0**  |
| B. SwiftUI 네이티브 + Python sidecar (PyOxidizer)   | 최고의 macOS 통합감, Apple HIG                                                             | Swift↔Python IPC 복잡, App Store 샌드박스에서 Python 실행 까다로움 | v1 이후 검토 |
| C. Electron + Python sidecar                        | 자료 풍부, 빠른 시작                                                                       | 번들 크기 ~150MB+, 메모리 무거움, "Mac스럽지 않음"                 | 비추         |
| D. SwiftUI + 파이프라인 Swift 재구현                | 단일 언어, 가장 빠른 런타임                                                                | google-genai SDK 재구현에 수개월                                   | 비현실적     |

**결정 기준**: video-cli의 모든 영상 파이프라인이 Python 의존성 (ffmpeg-python, pyJianYingDraft, google-genai SDK)이라 **재작성은 비현실적**. 따라서 Python을 사이드카로 번들링하는 것이 필수. 그 위에 어떤 셸을 올리느냐의 선택만 남음.

### 왜 별도 레포인가
- **제품 형태가 완전히 다르다**: video-cli는 내부 CLI. shortify는 외부 사용자가 다운로드해서 쓰는 앱.
- **빌드 파이프라인이 다르다**: 코드 사이닝, notarization, DMG/pkg 패키징, Sparkle 자동 업데이트 등 macOS 앱 인프라 필요.
- **저작권·라이선스 경계**: 외부 배포 → BGM·레퍼런스 자산 라이선스 분리 필수.

---

## 전체 시스템 아키텍처

### 0) 통합 개발 아키텍처 (Layered View)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         Shortify.app  (macOS Bundle)                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ L1. PRESENTATION LAYER                              [ React + Vite + Tailwind]│
│ ─────────────────────────────────────────────────────────────────────────────│
│  Pages       DropView · TocCheckList · ImageConceptPicker                    │
│              JobProgressBoard · VideoLibrary · Settings                      │
│  Components  DropZone · ImageConceptCard · JobProgressCard · VideoPlayer     │
│  State       Zustand store      Realtime  EventSource (SSE)                  │
└─────────────────────────┬────────────────────────────────────┬───────────────┘
                          │ tauri.invoke()                     │ fetch / SSE
                          ▼                                    │ (localhost)
┌──────────────────────────────────────────────────────────────┼───────────────┐
│ L2. SHELL / NATIVE BRIDGE LAYER                              │  [ Tauri + Rust]
│ ─────────────────────────────────────────────────────────────┼───────────────│
│  Window/Menu/Dock   ·   Sidecar lifecycle (spawn/health/kill)│               │
│  Keychain (security-framework)   ·   Notifications (UNUserNot)               │
│  File pickers · Open in Finder · Sparkle auto-update                         │
└─────────────────────────┬────────────────────────────────────┼───────────────┘
                          │ stdout/stderr                      │
                          │ + child process control            │
                          ▼                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ L3. API LAYER                                            [ FastAPI + uvicorn]│
│ ─────────────────────────────────────────────────────────────────────────────│
│   localhost:<random_port>  +  Bearer token (앱 부팅 시 발급)                  │
│                                                                              │
│   /upload  · /pdfs/:id/toc  · /jobs  · /jobs/:id  · /jobs/:id/stream(SSE)    │
│   /jobs/:id/select-image  · /jobs/:id/retry  · /image-concepts  · /health    │
└─────────────────────────┬───────────────────────────────────┬────────────────┘
                          │                                   │ SSE publish
                          ▼                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ L4. APPLICATION / SERVICE LAYER                                              │
│ ─────────────────────────────────────────────────────────────────────────────│
│   UploadService   TocService   JobService   ConceptService   NotifyService   │
│        │              │            │             │              │            │
│        └──────┬───────┴────────────┴─────────────┴──────────────┘            │
│               ▼                                                              │
│      PersistentTaskQueue  ◄──poll──  asyncio Workers (n=N_CONCURRENCY)       │
│      (SQLite-backed)                  ├─ extract_toc                         │
│                                       ├─ conceptize                          │
│                                       └─ generate_video (오케스트레이터)      │
└─────────────────────────┬───────────────────────────────────┬────────────────┘
                          │ orchestrates                      │ status / events
                          ▼                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ L5. DOMAIN / PIPELINE LAYER                          [ video-cli 포팅된 코어 ]│
│ ─────────────────────────────────────────────────────────────────────────────│
│                                                                              │
│   ingest_pdf ──► conceptizer ──► scene_splitter ──► image_gen                │
│                  (gemini-3.1-flash-                  (gemini-3.1-flash-      │
│                   lite-preview)                       image-preview)         │
│                                                          │                   │
│                                          video_gen (veo-3.1-generate-preview)│
│                                                          │                   │
│                                          narration_gen                       │
│                                                          (gemini-3.1-flash-  │
│                                                           tts-preview)       │
│                                                          │                   │
│                                          alignment                           │
│                                                          (gemini-3.1-flash-  │
│                                                           preview)           │
│                                                          │                   │
│                                          rhythm_cut ──► compose ──► overlays │
│                                                          │           │       │
│                                                          ▼           │       │
│                                                       effects ──► make_mask  │
│                                                          │                   │
│                                                          ▼                   │
│                                                     final.mp4 (1080×1920)    │
└─────────────────────────┬─────────────────────────────────┬──────────────────┘
                          │ persistence                     │ tools
                          ▼                                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ L6. INFRASTRUCTURE LAYER                                                     │
│ ─────────────────────────────────────────────────────────────────────────────│
│  Storage (Local FS)              Database              Bundled Binaries      │
│  ~/Library/.../Shortify/         SQLite               ffmpeg-full (arm64)     │
│   ├─ db.sqlite                   ├─ pdfs              fonts/                 │
│   ├─ pdfs/                       ├─ jobs              bgm/                   │
│   ├─ output/<jobId>/             ├─ job_events        image_concepts/        │
│   │   ├─ images/                 ├─ image_concepts                           │
│   │   ├─ clips/                  └─ queue_tasks       Secrets                │
│   │   ├─ narration.mp3                                macOS Keychain         │
│   │   └─ final.mp4                                     · GEMINI_API_KEY      │
│   └─ logs/                                              (단일 키로 텍스트·    │
│                                                          이미지·영상·TTS·    │
│                                                          오디오 정렬 전체)    │
└─────────────────────────┬────────────────────────────────────────────────────┘
                          │ HTTPS
                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ L7. EXTERNAL SERVICES                                                        │
│ ─────────────────────────────────────────────────────────────────────────────│
│                           Google Gemini API                                  │
│  · gemini-3.1-flash-lite-preview   (TOC fallback / Conceptizer / Scene dir)  │
│  · gemini-3.1-flash-image-preview  (image generation)                        │
│  · veo-3.1-generate-preview        (image-to-video)                          │
│  · gemini-3.1-flash-tts-preview    (Korean TTS)                              │
│  · gemini-3.1-flash-preview        (audio alignment / word-level timestamps) │
└──────────────────────────────────────────────────────────────────────────────┘


────────────────────────────  RUNTIME / BUILD FLOW  ────────────────────────────

  Source repo (mindful-labs/shortify)
    ├─ src-tauri/   (Rust)         ──┐
    ├─ src/         (React)        ──┤
    ├─ sidecar/     (Python)         │
    └─ assets/      (ffmpeg/fonts)   │
                                     ▼
                        GitHub Actions (macOS runner)
                        ─────────────────────────────
                        1. pnpm install + vite build  (frontend → dist/)
                        2. PyInstaller --onefile      (sidecar → bin/shortify-sidecar)
                        3. cargo tauri build          (Rust + bundle frontend + sidecar)
                        4. codesign --deep --options=runtime --entitlements
                        5. notarytool submit --wait   (Apple notarization)
                        6. xcrun stapler staple
                        7. create-dmg                 (Shortify-x.y.z.dmg)
                        8. Sparkle appcast.xml 생성
                        9. GitHub Release 업로드
                                     │
                                     ▼
                           사용자 Mac (다운로드 + 실행)
                           ──────────────────────────
                            · 첫 실행 → Gatekeeper 통과
                            · ~/Library/.../Shortify 초기화 (DB seed, concept seed)
                            · Settings에서 API 키 입력 → Keychain 저장
                            · 이후 Sparkle이 appcast 폴링 → 자동 업데이트
```

**계층 책임 요약**:

| Layer                  | 책임                                   | 주요 기술                                                                                                                                                                         |
| ---------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1 Presentation        | 사용자 인터랙션, 진행 상황 시각화      | React, Vite, Tailwind, shadcn/ui, Zustand                                                                                                                                         |
| L2 Shell/Native Bridge | OS API 접근, 사이드카 생애주기, 보안   | Tauri, Rust, security-framework                                                                                                                                                   |
| L3 API                 | localhost RPC, 인증, SSE 푸시          | FastAPI, uvicorn                                                                                                                                                                  |
| L4 Application/Service | 유즈케이스 오케스트레이션, 큐          | asyncio, persistent SQLite queue                                                                                                                                                  |
| L5 Domain/Pipeline     | 영상 생성 도메인 로직 (video-cli 포팅) | pypdf, Pillow, ffmpeg-python, google-genai                                                                                                                                        |
| L6 Infrastructure      | 영속성, 비밀, 번들 바이너리            | SQLite, 로컬 FS, Keychain, ffmpeg                                                                                                                                                 |
| L7 External            | 외부 AI/미디어 API                     | Google Gemini API (`gemini-3.1-flash-lite-preview` + `gemini-3.1-flash-image-preview` + `veo-3.1-generate-preview` + `gemini-3.1-flash-tts-preview` + `gemini-3.1-flash-preview`) |

**의존성 방향**: L1 → L2 → L3 → L4 → L5 → L6 → L7. 역방향 의존 금지 (L5가 L3를 알면 안 됨). L4는 L5/L6에 의존, L3는 L4를 호출.

**격리 경계**:
- **프로세스 경계 1**: L1~L2 (Tauri/Rust) vs. L3~L5 (Python sidecar) — IPC는 localhost HTTP/SSE
- **프로세스 경계 2**: 앱 vs. 외부 서비스 (L7) — HTTPS + API 키
- **샌드박스 경계**: 앱 외부의 사용자 파일은 L1의 NSOpenPanel을 통해서만 접근

---

### 1) 앱 내부 구조 (단일 macOS 프로세스 그룹)

```
┌────────────────────────────────────────────────────────────────────┐
│                       Shortify.app (macOS Bundle)                  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  Tauri Shell (Rust)                          │  │
│  │  · 메인 윈도우 / 메뉴바 / Dock 아이콘                         │  │
│  │  · WKWebView 호스팅                                          │  │
│  │  · Keychain 접근 (API 키 저장)                                │  │
│  │  · 파일시스템 권한, 알림, Sparkle 자동 업데이트               │  │
│  │  · Python 사이드카 spawn / 헬스체크 / 재시작                  │  │
│  └──────────┬─────────────────────────────────────┬──────────────┘  │
│             │ IPC (invoke / event)                │ HTTP localhost  │
│             ▼                                     ▼                 │
│  ┌──────────────────────────────┐   ┌────────────────────────────┐  │
│  │   Frontend (React + Vite)    │   │  Python Sidecar (FastAPI)  │  │
│  │   WKWebView 안에서 동작      │◄──┤  127.0.0.1:<random_port>   │  │
│  │                              │   │                            │  │
│  │  Pages                       │   │  Routes                    │  │
│  │   · DropView (랜딩)          │   │   POST /upload             │  │
│  │   · TocCheckList             │   │   GET  /pdfs/:id/toc       │  │
│  │   · ImageConceptPicker       │   │   POST /jobs               │  │
│  │   · JobProgressBoard         │   │   GET  /jobs/:id           │  │
│  │   · VideoLibrary             │   │   GET  /jobs/:id/stream    │  │
│  │   · Settings (API keys)      │   │   POST /jobs/:id/select-image │
│  │                              │   │   GET  /image-concepts     │  │
│  │  State: Zustand              │   │                            │  │
│  │  SSE: EventSource            │   │  Workers (asyncio queue)   │  │
│  │                              │   │   · extract_toc            │  │
│  │                              │   │   · conceptize             │  │
│  │                              │   │   · generate_video         │  │
│  └──────────────────────────────┘   └──────────┬─────────────────┘  │
│                                                │                    │
└────────────────────────────────────────────────┼────────────────────┘
                                                 │
                ┌────────────────────────────────┼────────────────────┐
                ▼                                ▼                    ▼
   ~/Library/Application Support/Shortify/   macOS Keychain    External APIs
   ┌────────────────────────────────┐       ┌──────────────┐   ┌────────────────────┐
   │ db.sqlite       (jobs, concepts)│      │ GEMINI_API_  │   │ Google Gemini API  │
   │ pdfs/           (원본 PDF)      │      │   KEY        │   │  · flash-lite      │
   │ output/<jobId>/ (이미지/클립/mp4)│      │ (단일 키로   │   │  · flash-image     │
   │ assets/                         │      │  텍스트·     │   │  · veo-3.1-generate│
   │   image_concepts/  (앱 번들 복사)│      │  이미지·영상│   │  · flash-tts       │
   │   bgm/                          │      │  ·TTS·정렬) │   │  · flash (audio)   │
   │   fonts/                        │      └──────────────┘   └────────────────────┘
   └────────────────────────────────┘
```

**핵심 결정**:
- **Python 사이드카는 localhost HTTP**로 노출. Tauri의 `command` invoke보다 표준적이고 디버깅 쉬움. 포트는 충돌 회피 위해 런타임 랜덤 할당 후 프론트에 주입.
- **데이터베이스 = SQLite 단일 파일**. 멀티유저 없음 → Postgres 불필요.
- **작업 큐 = asyncio + SQLite-backed persistent queue**. Celery/Redis 불필요. 앱 종료 후 재시작에도 큐 복구.
- **API 키 = macOS Keychain**에만 저장. SQLite/평문 파일에 절대 두지 않음.
- **ffmpeg-full**은 앱 번들에 정적 바이너리로 포함 (사용자가 brew 설치할 필요 없음).

---

### 2) 프로세스 / 데이터 흐름 (사용자 1회 시나리오)

```
User    Tauri Shell    Webview UI    Python Sidecar    asyncio Queue    External APIs    Local FS
 │           │             │                │                │                │              │
 │ 앱 실행  │             │                │                │                │              │
 ├──────────►│ spawn       │                │                │                │              │
 │           ├─────────────┼───────────────►│ uvicorn start  │                │              │
 │           │ load UI     │                │                │                │              │
 │           ├────────────►│                │                │                │              │
 │ drop PDF  │             │                │                │                │              │
 ├──────────►│             │ POST /upload (multipart)        │                │              │
 │           │             ├───────────────►│ save to ~/Library/.../pdfs/    │──────────────►│
 │           │             │                │ insert pdf row                  │──────────────►│
 │           │             │                │ enqueue extract_toc             │              │
 │           │             │                ├───────────────►│                │              │
 │           │             │ {pdf_id}       │                │                │              │
 │           │             │◄───────────────┤                │                │              │
 │           │             │                │                │ pop, run pypdf outline +      │
 │           │             │                │                │ gemini-3.1-flash-lite-preview │
 │           │             │                │                │ fallback                      │
 │           │             │                │                ├───────────────►│              │
 │           │             │ GET /pdfs/{id}/toc              │                │              │
 │           │             ├───────────────►│ return toc_json│                │              │
 │ shows TOC │             │                │                │                │              │
 │◄──────────┤             │                │                │                │              │
 │ check 5   │             │                │                │                │              │
 ├──────────►│             │ POST /jobs (sections)           │                │              │
 │           │             ├───────────────►│ insert 5 jobs (stage=0)         │              │
 │           │             │                │ enqueue conceptize × 5          │              │
 │           │             │ {job_ids[]}    │                │                │              │
 │           │             │◄───────────────┤                │                │              │
 │           │             │ open SSE /jobs/{id}/stream × 5  │                │              │
 │           │             ├───────────────►│                │                │              │
 │           │             │                │                │ extract section text          │
 │           │             │                │                ├──────────────────────────────►│
 │           │             │                │                │ gemini-3.1-flash-lite-preview │
 │           │             │                │                │  → conceptized JSON           │
 │           │             │                │                ├───────────────►│              │
 │           │             │                │                │ stage 1→2→3 (await image)     │
 │           │             │ SSE: stage updates              │                │              │
 │           │             │◄───────────────┤                │                │              │
 │ concept cards 노출 (5종 이미지 컨셉, 앱 번들에 포함)       │                │              │
 │◄──────────┤             │                │                │                │              │
 │ select img│             │                │                │                │              │
 ├──────────►│             │ POST /jobs/{id}/select-image    │                │              │
 │           │             ├───────────────►│ update job, enqueue generate_video             │
 │           │             │                │                ├───────────────►│              │
 │           │             │                │                │ gemini-3.1-flash-image-preview│
 │           │             │                │                │  → 14 images                  │
 │           │             │                │                ├───────────────►│──────────────►│
 │           │             │                │                │ veo-3.1-generate-preview      │
 │           │             │                │                │  → 14 clips                   │
 │           │             │                │                │ gemini-3.1-flash-tts-preview  │
 │           │             │                │                │  → narration.mp3              │
 │           │             │                │                │ gemini-3.1-flash-preview      │
 │           │             │                │                │  → word-level timestamps      │
 │           │             │                │                │ rhythm cut + ffmpeg compose   │
 │           │             │                │                │ → final.mp4                   │
 │           │             │                │                ├──────────────────────────────►│
 │           │             │ SSE: stage 9 + file:// URL      │                │              │
 │           │             │◄───────────────┤                │                │              │
 │ AVPlayer로 재생         │                │                │                │              │
 │◄──────────┤             │                │                │                │              │
```

---

### 3) 빌드 / 배포 토폴로지

```
                    ┌────────────────────────────────────────────────┐
                    │           GitHub Actions (macOS runner)         │
                    │                                                 │
                    │  1. cargo tauri build --target aarch64-apple-  │
                    │     darwin (Apple Silicon only)                │
                    │  2. Python sidecar bundle (PyInstaller →       │
                    │     단일 실행 파일, arm64)                      │
                    │  3. ffmpeg-full 정적 바이너리 임베드            │
                    │  4. codesign --deep --options=runtime          │
                    │  5. notarize (notarytool submit --wait)        │
                    │  6. staple                                      │
                    │  7. create-dmg → Shortify-x.y.z.dmg            │
                    │  8. appcast.xml 업데이트                        │
                    └─────────────────────┬───────────────────────────┘
                                          │
                                          ▼
                    ┌────────────────────────────────────────────────┐
                    │  GitHub Releases (또는 자체 CDN)                │
                    │   · Shortify-1.0.0.dmg                          │
                    │   · appcast.xml (Sparkle 피드)                  │
                    └─────────────────────┬───────────────────────────┘
                                          │
                                          ▼
                    ┌────────────────────────────────────────────────┐
                    │  사용자 Mac                                     │
                    │   · 다운로드 → DMG → Applications에 드래그       │
                    │   · 첫 실행 시 Gatekeeper 통과 (notarized)       │
                    │   · 이후 Sparkle 자동 업데이트                   │
                    └────────────────────────────────────────────────┘
```

**배포 결정**:
- **App Store 미배포** (영구). 샌드박스가 Python 사이드카 spawn + ffmpeg 외부 바이너리 실행을 막아 호환 부담이 큼. 향후에도 검토하지 않음.
- **DMG 직접 배포 ✅**: Developer ID 인증서로 sign + notarize → Gatekeeper 통과. Sparkle로 자동 업데이트.
- **Apple Silicon 전용 (arm64)**: Intel Mac 미지원. 번들 크기·빌드 시간 절반 이득.

---

## 사용자 플로우

```
[1] 앱 실행 → Drop View (메인 윈도우)
        │
        ▼
[2] PDF 드롭 → 로컬 ~/Library/.../pdfs/ 저장
        │ (자동으로 stage 1: 목차 추출 시작)
        ▼
[3] 목차 체크리스트 (최대 5개 소단위 선택)
        │ (선택 즉시 각 단위를 Job으로 큐에 enqueue, stage=0)
        ▼
[4-1] (백그라운드) 각 Job: PDF 섹션 텍스트 추출 → `gemini-3.1-flash-lite-preview`로 제목·주제·4비트 학습 구조 생성
[4-2] (UI) 사용자에게 5개 이미지 컨셉 카드 노출 → 클릭 선택
        │
        ▼
[5] 이미지 컨셉 선택 → 4-1 결과와 매칭 → `gemini-3.1-flash-image-preview` → `veo-3.1-generate-preview` → `gemini-3.1-flash-tts-preview` → 컴포즈
        │
        ▼
[6] 완성 영상이 라이브러리에 추가 → 인앱 AVPlayer 재생, Finder에서 보기, 공유
```

**진행 상황 UX**:
- 5개 영상이 동시 진행 → 카드 그리드로 각 영상 stage 시각화
- 이미지 선택 대기 시간 동안 컨셉 카드 미리보기로 이탈감 최소화
- 알림 센터 (NSUserNotification): "5편 중 3편 완성" 등

---

## 처리 단계 (Stage) 정의

| stage | 이름                    | 작업                                                   | 예상 시간     |
| ----- | ----------------------- | ------------------------------------------------------ | ------------- |
| 0     | `queued`                | 큐에 등록됨                                            | ~즉시         |
| 1     | `extracting_section`    | PDF에서 섹션 텍스트 추출                               | ~5초          |
| 2     | `conceptizing`          | `gemini-3.1-flash-lite-preview`가 제목/주제/4비트 추출 | ~15초         |
| 3     | `awaiting_image_choice` | 사용자가 이미지 컨셉 선택 대기                         | (사용자 입력) |
| 4     | `generating_images`     | `gemini-3.1-flash-image-preview`로 14장 이미지         | ~60초         |
| 5     | `generating_clips`      | `veo-3.1-generate-preview` I2V로 클립                  | ~5~7분        |
| 6     | `generating_narration`  | `gemini-3.1-flash-tts-preview`                         | ~30초         |
| 7     | `aligning`              | `gemini-3.1-flash-preview` word-level                  | ~30초         |
| 8     | `composing`             | ffmpeg 리듬 컷 + 필터 + 자막 + 훅 + BGM                | ~2분          |
| 9     | `done`                  | final.mp4 저장 완료                                    | —             |
| -1    | `failed`                | 에러 발생 (사용자에게 재시도 옵션)                     | —             |

영상 1편 ETA: **~10~12분** (이미지 선택 대기 시간 제외).

---

## 신규 레포 구조 (`shortify/`)

```
shortify/
├── README.md
├── LICENSE
├── package.json                   # Tauri 메타 + UI 빌드 스크립트
├── src-tauri/                     # Rust shell
│   ├── Cargo.toml
│   ├── tauri.conf.json            # 앱 ID, 권한, 번들 옵션
│   ├── build.rs
│   ├── icons/
│   ├── entitlements.plist         # codesign hardened runtime
│   └── src/
│       ├── main.rs
│       ├── sidecar.rs             # Python 프로세스 spawn / health
│       ├── keychain.rs            # API 키 저장 / 조회 (security-framework)
│       ├── menu.rs                # macOS 메뉴바
│       └── updater.rs             # Sparkle / Tauri updater
│
├── src/                           # React + Vite 프론트엔드
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── DropView.tsx
│   │   ├── TocCheckList.tsx
│   │   ├── ImageConceptPicker.tsx
│   │   ├── JobProgressBoard.tsx
│   │   ├── VideoLibrary.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── DropZone.tsx
│   │   ├── ImageConceptCard.tsx
│   │   ├── JobProgressCard.tsx
│   │   └── VideoPlayer.tsx
│   ├── lib/
│   │   ├── api.ts                 # localhost FastAPI 클라이언트
│   │   ├── sse.ts                 # EventSource 래퍼
│   │   └── tauri.ts               # invoke('keychain_set', ...) 등
│   └── store/                     # Zustand
│
├── sidecar/                       # Python 백엔드
│   ├── pyproject.toml
│   ├── shortify_sidecar/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI app + uvicorn 부팅
│   │   ├── api/
│   │   │   ├── upload.py
│   │   │   ├── toc.py
│   │   │   ├── jobs.py
│   │   │   ├── concepts.py
│   │   │   └── health.py
│   │   ├── db/
│   │   │   ├── schema.sql
│   │   │   └── repo.py            # SQLite + sqlmodel
│   │   ├── queue/
│   │   │   ├── persistent.py      # SQLite-backed asyncio queue
│   │   │   └── workers.py
│   │   ├── pipeline/              # video-cli에서 포팅
│   │   │   ├── ingest_pdf.py
│   │   │   ├── conceptizer.py
│   │   │   ├── image_gen.py
│   │   │   ├── video_gen.py
│   │   │   ├── narration_gen.py
│   │   │   ├── alignment.py
│   │   │   ├── rhythm_cut.py
│   │   │   ├── compose.py
│   │   │   ├── overlays.py
│   │   │   ├── scene_splitter.py
│   │   │   ├── effects.py
│   │   │   └── make_mask.py
│   │   ├── storage/
│   │   │   └── paths.py           # ~/Library/Application Support/Shortify
│   │   └── notify.py              # SSE 이벤트 푸시
│   └── PyInstaller.spec           # 단일 실행파일 빌드 설정
│
├── assets/
│   ├── image_concepts/            # 앱 번들에 포함 (5종 컨셉)
│   │   ├── diagram_whiteboard/
│   │   ├── illustrated_textbook/
│   │   ├── minimalist_3d/
│   │   ├── photorealistic/
│   │   └── retro_paper/
│   ├── fonts/                     # Pretendard, Black Han Sans
│   ├── bgm/                       # 라이선스 클리어 BGM
│   └── ffmpeg/                    # 정적 ffmpeg-full 바이너리 (arm64, Apple Silicon)
│
├── prompts/
│   ├── toc_extractor.md
│   ├── conceptizer.md
│   └── scene_director.md
│
├── tests/
│   ├── sidecar/                   # pytest
│   └── ui/                        # vitest
│
├── scripts/
│   ├── build_sidecar.sh           # PyInstaller → arm64 binary
│   ├── codesign.sh
│   ├── notarize.sh
│   └── make_dmg.sh
│
└── .github/workflows/
    └── release.yml                # macOS runner: build → sign → notarize → release
```

---

## 기술 스택

| 영역                | 선택                                                                                           | 이유                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **앱 셸**           | Tauri 2.x                                                                                      | 작은 번들, Rust 안정성, macOS API 풍부, Sparkle 통합 |
| **UI**              | React 19 + Vite + Tailwind + shadcn/ui                                                         | 검증된 스택, 빠른 개발                               |
| **상태 관리**       | Zustand                                                                                        | 가볍고 SSE 이벤트 핸들링 깔끔                        |
| **사이드카**        | Python 3.11 + FastAPI + uvicorn                                                                | 영상 파이프라인 의존성 그대로, 비동기 IO             |
| **DB**              | SQLite (with `sqlmodel`)                                                                       | 단일 파일, 멀티유저 없음                             |
| **작업 큐**         | asyncio + SQLite-backed persistent queue                                                       | 외부 의존성 없이 앱 종료 후 재시작 복구              |
| **PDF 파싱**        | pypdf + pdfplumber                                                                             | 목차 + 페이지별 텍스트                               |
| **LLM**             | `gemini-3.1-flash-lite-preview` (Google Gemini API)                                            | 한글·구조화 추출 강함, 단일 키 통합                  |
| **영상 생성**       | `gemini-3.1-flash-image-preview` + `veo-3.1-generate-preview` + `gemini-3.1-flash-tts-preview` | 단일 Google 스택, BYOK 1키                           |
| **음성 정렬**       | `gemini-3.1-flash-preview` (audio understanding, word-level timestamps)                        | 추가 로컬 모델 불필요                                |
| **ffmpeg**          | ffmpeg-full 정적 바이너리 (arm64) 번들                                                         | 사용자가 brew 설치 불필요, Apple Silicon 전용        |
| **사이드카 패키징** | PyInstaller (--onefile, --target-arch arm64)                                                   | 단일 실행파일, Tauri sidecar로 등록                  |
| **Keychain**        | `security-framework` crate                                                                     | API 키 안전 저장                                     |
| **알림**            | macOS UserNotifications                                                                        | 작업 완료 알림                                       |
| **자동 업데이트**   | Sparkle (또는 Tauri updater + Sparkle bridge)                                                  | 표준 macOS 패턴                                      |
| **코드 사이닝**     | Apple Developer ID Application 인증서                                                          | Gatekeeper 통과                                      |
| **공증**            | `notarytool`                                                                                   | Apple 공증                                           |
| **배포**            | DMG (create-dmg) + GitHub Releases + Sparkle appcast                                           | App Store 미배포, 직접 호스팅                        |

---

## 데이터 모델 (SQLite)

```sql
pdfs (
  id TEXT PRIMARY KEY,                 -- ulid
  filename TEXT NOT NULL,
  local_path TEXT NOT NULL,            -- ~/Library/.../pdfs/<id>.pdf
  page_count INTEGER,
  toc_json TEXT,                       -- [{idx, title, page_start, page_end}]
  created_at TEXT NOT NULL
)

image_concepts (                       -- 앱 번들에 포함, 첫 실행 시 seed
  slug TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  preview_path TEXT,                   -- assets/image_concepts/<slug>/preview.png
  image_style_preset TEXT,             -- gemini-3.1-flash-image-preview prompt prefix
  reference_image_paths TEXT,          -- JSON array
  active INTEGER DEFAULT 1,
  sort_order INTEGER
)

jobs (
  id TEXT PRIMARY KEY,
  pdf_id TEXT REFERENCES pdfs(id),
  toc_section_index INTEGER,
  toc_section_title TEXT,
  image_concept_slug TEXT REFERENCES image_concepts(slug),  -- nullable
  stage INTEGER NOT NULL,              -- 0~9, -1
  stage_message TEXT,
  conceptized_json TEXT,
  output_video_path TEXT,              -- ~/Library/.../output/<job_id>/final.mp4
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)

job_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT REFERENCES jobs(id),
  stage INTEGER,
  message TEXT,
  created_at TEXT NOT NULL
)

queue_tasks (                          -- persistent queue
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_type TEXT,                      -- extract_toc | conceptize | generate_video
  payload_json TEXT,
  status TEXT,                         -- pending | running | done | failed
  attempts INTEGER DEFAULT 0,
  scheduled_at TEXT,
  started_at TEXT,
  finished_at TEXT
)
```

---

## API 설계 (사이드카 localhost)

| Method   | Path                      | 설명                                      |
| -------- | ------------------------- | ----------------------------------------- |
| `GET`    | `/health`                 | 사이드카 헬스체크 (Tauri shell이 polling) |
| `POST`   | `/upload`                 | multipart PDF 업로드 → `pdf_id`           |
| `GET`    | `/pdfs/{id}/toc`          | 목차 리스트                               |
| `POST`   | `/jobs`                   | `{pdf_id, sections:[idx]}` → Job N개      |
| `GET`    | `/jobs/{id}`              | Job 단건 상태                             |
| `GET`    | `/jobs`                   | 라이브러리용 전체 Job 목록                |
| `GET`    | `/jobs/{id}/stream`       | SSE 진행 상황                             |
| `POST`   | `/jobs/{id}/select-image` | `{image_concept_slug}` → stage 4 진입     |
| `POST`   | `/jobs/{id}/retry`        | failed Job 재시도                         |
| `DELETE` | `/jobs/{id}`              | Job soft delete (휴지통 이동, 파일 보존)  |
| `POST`   | `/jobs/{id}/restore`      | 휴지통에서 복원                           |
| `DELETE` | `/trash`                  | 휴지통 비우기 (hard purge, 비가역)        |
| `GET`    | `/image-concepts`         | 활성 컨셉 카드                            |

**주의**: 이 API는 외부에 노출되지 않음. localhost(127.0.0.1) 바인딩 + 앱 부팅 시 랜덤 토큰 → 프론트가 헤더에 포함 → 사이드카에서 검증 (다른 로컬 프로세스의 호출 차단).

---

## Tauri 명령 (Rust ↔ JS)

```rust
#[tauri::command]
async fn keychain_set(service: &str, key: &str, value: &str) -> Result<(), String> {...}

#[tauri::command]
async fn keychain_get(service: &str, key: &str) -> Result<String, String> {...}

#[tauri::command]
async fn sidecar_status() -> SidecarStatus {...}

#[tauri::command]
async fn sidecar_restart() -> Result<(), String> {...}

#[tauri::command]
async fn open_in_finder(path: &str) -> Result<(), String> {...}

#[tauri::command]
async fn pick_directory() -> Option<String> {...}

#[tauri::command]
async fn check_for_updates() -> Result<UpdateInfo, String> {...}
```

---

## video-cli 자산 포팅 매핑

| video-cli 원본                     | shortify 위치                            | 변경 사항                                          |
| ---------------------------------- | ---------------------------------------- | -------------------------------------------------- |
| `d0po_video_cli/image_gen.py`      | `sidecar/.../pipeline/image_gen.py`      | 프롬프트는 `image_concept` 프리셋이 주입           |
| `d0po_video_cli/video_gen.py`      | `sidecar/.../pipeline/video_gen.py`      | 그대로                                             |
| `d0po_video_cli/narration_gen.py`  | `sidecar/.../pipeline/narration_gen.py`  | voice·speed 학습형 기본값                          |
| `d0po_video_cli/alignment.py`      | `sidecar/.../pipeline/alignment.py`      | `gemini-3.1-flash-preview` 오디오 이해 호출로 교체 |
| `d0po_video_cli/rhythm_cut.py`     | `sidecar/.../pipeline/rhythm_cut.py`     | 그대로                                             |
| `d0po_video_cli/compose_v3.py`     | `sidecar/.../pipeline/compose.py`        | overlay slot 확장, 번들 ffmpeg 경로 사용           |
| `d0po_video_cli/overlays.py`       | `sidecar/.../pipeline/overlays.py`       | `term_highlight()` + `citation_footer()` 추가      |
| `d0po_video_cli/scene_splitter.py` | `sidecar/.../pipeline/scene_splitter.py` | 교육 톤 system prompt                              |
| `d0po_video_cli/effects.py`        | `sidecar/.../pipeline/effects.py`        | 톤 뉴트럴                                          |
| `d0po_video_cli/make_mask.py`      | `sidecar/.../pipeline/make_mask.py`      | 그대로                                             |

**포팅 시 주의**:
- 모듈명 `d0po_video_cli` → `shortify_sidecar.pipeline`
- d0po 전용 하드코딩 (보라 토끼, 핫핑크 네온) 제거
- ffmpeg 경로는 `os.environ["SHORTIFY_FFMPEG"]` 또는 사이드카 부팅 시 주입 (`/Applications/Shortify.app/Contents/Resources/ffmpeg`)
- CLI 진입점 제거, 함수 호출 형태로 워커가 직접 사용
- 모든 출력 경로는 `storage/paths.py`의 `app_support_dir()` 경유

---

## 단계별 로드맵

### Phase 0 — 레포 부트스트랩 (1일)
- 신규 GitHub 레포 (`mindful-labs/shortify`)
- Tauri 2 + React + Vite 스캐폴드
- Python 사이드카 빈 FastAPI 앱
- video-cli 파이프라인 코드 포팅 (위 매핑표대로)

### Phase 1 — 사이드카 통합 (2~3일)
- Tauri ↔ Python 사이드카 spawn / health / 종료 흐름
- 랜덤 포트 + 인증 토큰 메커니즘
- localhost API 클라이언트 (`src/lib/api.ts`)
- ffmpeg 정적 바이너리 임베드 + 경로 주입

### Phase 2 — 데이터 + 큐 (2일)
- SQLite 스키마 + 마이그레이션
- SQLite-backed persistent queue
- stage 진행 추적 + SSE 푸시
- Keychain API 키 저장 / 조회

### Phase 3 — 백엔드 코어 로직 (3~4일)
- PDF 업로드 + 목차 추출 (pypdf outline + `gemini-3.1-flash-lite-preview` 폴백)
- Conceptizer (`gemini-3.1-flash-lite-preview` → 4비트 JSON)
- 영상 파이프라인 직렬 실행 (stage 4~8)
- 이미지 컨셉 프리셋 → `gemini-3.1-flash-image-preview` 프롬프트 어댑터

### Phase 4 — UI (4~5일)
- DropView (랜딩)
- 목차 체크리스트 (최대 5개)
- 이미지 컨셉 카드 선택
- JobProgressBoard (SSE 구독, 5개 카드)
- VideoLibrary + AVPlayer
- Settings (API 키 입력 → Keychain)

### Phase 5 — macOS 네이티브 통합 (2일)
- 메뉴바, About, 환경설정 패널
- UserNotifications (작업 완료)
- "Finder에서 보기" / 공유 시트
- Dark mode 대응

### Phase 6 — 빌드 / 사이닝 / 배포 (2~3일)
- PyInstaller로 사이드카 arm64 단일 실행파일
- `cargo tauri build`
- codesign + notarize 스크립트
- create-dmg
- Sparkle appcast.xml + GitHub Releases 자동화 (Actions)

### Phase 7 — 품질 게이트 + 폴리싱 (이후)
- 캡션 커버리지, 인용 정확도 자동 체크
- LLM-graded 학습 효과 평가
- 충돌 보고 (Sentry)
- 벤치마크 / 성능 튜닝

---

## 결정 필요 사항

1. **앱 셸**: Tauri 추천이 ok? (대안: Electron / SwiftUI 네이티브)
2. **레포 호스팅**: `mindful-labs/shortify`로 가도 되나?
3. **언어**: UI 한국어 우선? 영어 우선? 둘 다?
4. **API 키 정책**: 사용자가 자기 키 입력 (BYOK) vs. 우리가 프록시 (구독 과금)?
   - BYOK는 v0에 단순. 프록시는 백엔드 + 결제 시스템 추가 필요 → macOS 앱 단독 컨셉과 충돌.
5. **이미지 컨셉 5종**: 어떤 톤? (예: 화이트보드 / 교과서 일러스트 / 미니멀 3D / 사진 합성 / 레트로 종이)
6. **PDF 외 입력 v0 포함?**: v0는 PDF only vs. URL·유튜브도 같이?
7. **App Store 타겟 시점**: v0 DMG 직배포 → v1.5에서 App Store 검토 ok?
8. **자동 업데이트**: Sparkle ok? (Tauri 내장 updater + Apple Sparkle bridge)
9. **요금 모델**: 완전 무료 (BYOK) / 유료 앱 (단발 결제) / 구독?
10. **Apple Silicon only vs. universal2**: Intel Mac도 지원? (universal2 빌드 = 번들 크기 2배)

결정:
1. **앱 셸**: Tauri
2. **레포 호스팅**: `mindful-labs/shortify`
3. **언어**: UI는 영어.
4. **API 키 정책**: 사용자가 키 입력 (BYOK)
5. **이미지 컨셉 5종**: 이미지 Asset 폴더에 5종 컨셉 프리셋
6. **PDF 외 입력 v0 포함?**: PDF only
7. **App Store 타겟 시점**: 배포 안함
8.  **Apple Silicon only vs. universal2**: Intel Mac 지원 안함

---

## 비용 추정

### 영상 1편 생산 (사용자가 BYOK일 때, 사용자 부담)
- `gemini-3.1-flash-image-preview` $0.56 + `veo-3.1-generate-preview` $10.50 + `gemini-3.1-flash-tts-preview` $0.01 + `gemini-3.1-flash-lite-preview` $0.04 + `gemini-3.1-flash-preview` (정렬) $0.01 = **~$11/영상** (자세한 산식은 README의 비용표 참조)

### 우리 (개발사) 인프라 비용
- 외부 백엔드 없음 → **거의 0원**
- GitHub Actions macOS runner: ~$0.08/min × 빌드 ~30min × 릴리즈 ~월 4회 = **~$10/월**
- Apple Developer Program: $99/년
- 코드 사이닝 인증서: Developer Program 포함

### 가격 정책 가이드 (BYOK 가정)
- **무료** (오픈소스, BYOK): 사용자 직접 API 키 발급 → 진입 장벽 있지만 우리 비용 0
- **단발 유료** ($29~$49 일회 구매, BYOK): 셋업 가이드·프리셋·업데이트 제공 가치
- **구독** ($9/월, BYOK + 우리 프록시 일부): API 키 발급 귀찮음 해소, 마진 추출
