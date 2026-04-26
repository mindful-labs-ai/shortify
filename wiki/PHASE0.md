# Phase 0 — 부트스트랩 완료 보고

> main 브랜치에 레포 골격이 올라가 있다. 각자 자기 브랜치로 분기해 바이브 코딩 시작 가능.

---

## 완료된 것

### 레포 스캐폴드
- `package.json` (pnpm 9, React 19, Tauri 2)
- `vite.config.ts` · `tsconfig*.json` · `tailwind.config.js` · `postcss.config.js` · `index.html`
- `src-tauri/Cargo.toml` · `tauri.conf.json` · `build.rs` · `entitlements.plist`
- `sidecar/pyproject.toml` (FastAPI, sqlmodel, pypdf, ffmpeg-python, faster-whisper, google-genai)

### 디렉토리 골격
```
src/{pages,components,lib,store}      # 프론트
src-tauri/src                          # Tauri Rust
sidecar/shortify_sidecar/{api}         # FastAPI (db,queue,pipeline,storage 는 sunny 브랜치에서 추가)
assets/{image_concepts/<5종>,fonts,bgm,ffmpeg}
prompts · scripts · tests/{sidecar,ui} · .github/workflows
```

### 빈 API 인터페이스 (11개 엔드포인트)
- `GET  /health` (토큰 없음)
- `POST /upload`
- `GET  /pdfs/{id}/toc`
- `POST /jobs` · `GET /jobs` · `GET /jobs/{id}` · `GET /jobs/{id}/stream`
- `POST /jobs/{id}/select-image` · `POST /jobs/{id}/retry` · `DELETE /jobs/{id}`
- `GET  /image-concepts`
- 모두 `501 Not Implemented` 반환. Bearer 토큰 검증은 미들웨어에서 동작 중.

### 프론트엔드 contract
- `src/lib/api.ts` — 11개 엔드포인트 모두에 대한 타입드 클라이언트
- `src/lib/sse.ts` — `/jobs/{id}/stream` 구독 헬퍼
- `src/lib/tauri.ts` — Rust ↔ JS invoke 래퍼 (Keychain, sidecar status 등)
- `src/store/index.ts` — Zustand 글로벌 스토어 (pdf · jobs · imageConcepts)
- `src/pages/DropView.tsx` — 1개 placeholder 페이지

### Tauri 셸
- `src-tauri/src/main.rs` — `get_api_config` 단일 invoke 명령만 등록
- 사이드카 spawn / Keychain / 메뉴 / Sparkle 은 sunny 브랜치에서 단계 추가

### 실행 스크립트
- `scripts/dev.sh` — 사이드카(uvicorn --reload) + Tauri(vite) 동시 기동, Ctrl+C로 정리

### 환경
- `.env.example` — `GEMINI_API_KEY`, `SHORTIFY_HOST/PORT/TOKEN`
- `.gitignore` — Tauri/Node/Python/macOS 전체 커버

---

## 처음 한 번만 셋업

```bash
cp .env.example .env             # GEMINI_API_KEY 채우기
pnpm install
cd sidecar && python -m venv .venv && .venv/bin/pip install -e ".[dev]" && cd ..
./scripts/dev.sh                 # 앱 실행
curl -H "Authorization: Bearer dev-only-token-do-not-use-in-production" \
     http://127.0.0.1:51234/health   # {"ok":true}
```

---

## 브랜치별 다음 작업

### `sunny` (박경선) — Backend / AI / Build
1. SQLite 스키마 + persistent queue (`sidecar/shortify_sidecar/db`, `queue`)
2. `pipeline/ingest_pdf.py` — pypdf outline + 폴백
3. `pipeline/conceptizer.py` — `gemini-3.1-flash-lite-preview` 호출 + `prompts/conceptizer.md`
4. `pipeline/{image_gen,video_gen,narration_gen,alignment}.py` — Gemini API 연동
5. `pipeline/{rhythm_cut,compose,overlays,effects,make_mask}.py`
6. `src-tauri/src/{sidecar,keychain}.rs` — 사이드카 spawn + Keychain 명령
7. `scripts/{build_sidecar,codesign,notarize,make_dmg}.sh` + `.github/workflows/release.yml`

### `gyeongmin` (김경민) — Frontend
1. 6개 페이지 살 붙이기 (DropView 제외 5개 신규):
   `TocCheckList` · `ImageConceptPicker` · `JobProgressBoard` · `VideoLibrary` · `Settings`
2. 4개 컴포넌트:
   `DropZone` · `ImageConceptCard` · `JobProgressCard` · `VideoPlayer`
3. shadcn/ui 셋업
4. SSE 구독 + Zustand 연결로 실시간 진행 시각화

### `sicei` (김성곤) — Design
1. 5종 이미지 컨셉 비주얼 가이드 (`assets/image_concepts/<slug>/preview.png` + 레퍼런스)
2. 앱 아이콘 (`src-tauri/icons/`)
3. 폰트·BGM 큐레이션 (`assets/{fonts,bgm}/`)
4. 6개 화면 디자인 시안 → 김경민과 핸드오프

---

## 인터페이스 동기화 규칙

- API 시그니처는 `sidecar/shortify_sidecar/api/*.py`와 `src/lib/api.ts`가 진실의 원천. **양쪽을 함께 PR로 묶을 것.**
- DB 스키마는 `wiki/prd/architecture/04-data-model.md` 우선 갱신 후 `sidecar/.../db/schema.sql` 반영.
- 새 Tauri 명령은 `src-tauri/src/main.rs` 등록 + `src/lib/tauri.ts` 래퍼 추가를 같은 PR에서.
