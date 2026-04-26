# Getting Started

> Shortify를 처음 클론한 사람을 위한 셋업 가이드. AI 에이전트용 요약은 [`/AGENTS.md`](../AGENTS.md), 자동 스크립트는 [`/scripts/setup.sh`](../scripts/setup.sh).

---

## 0. 전제 조건 (Apple Silicon Mac 전용)

Shortify는 결정사항 #8에 따라 **Apple Silicon (arm64) 전용**이다. Intel Mac은 지원하지 않는다.

| 도구         | 최소 버전       | 검증                                         |
| ------------ | --------------- | -------------------------------------------- |
| macOS        | 13.0+ (Ventura) | `sw_vers -productVersion`                    |
| Node.js      | 20+             | `node --version`                             |
| pnpm         | 10.16+          | `pnpm --version` (corepack로 자동 설치 가능) |
| Python       | 3.11+           | `python3 --version`                          |
| Rust + cargo | stable          | `cargo --version`                            |
| Xcode CLT    | 최신            | `xcode-select -p`                            |

### 누락된 도구 설치

```bash
# Xcode Command Line Tools
xcode-select --install

# Node.js (Homebrew)
brew install node@20

# pnpm은 Node에 번들된 corepack로 활성화 (시스템 글로벌 설치 안 해도 됨)
corepack enable
corepack prepare pnpm@10.16.1 --activate

# Python 3.11+
brew install python@3.11

# Rust + cargo (공식 rustup, 약 500MB)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
source "$HOME/.cargo/env"
```

---

## 1. 클론 + 키 셋업

```bash
git clone <repo> shortify
cd shortify
cp .env.example .env
# .env 의 GEMINI_API_KEY 값을 본인 키로 채운다
```

`GEMINI_API_KEY`는 [Google AI Studio](https://aistudio.google.com/app/apikey)에서 발급. 단일 키 하나로 텍스트·이미지·영상·TTS·오디오 정렬 모두 호출.

> 키 우선순위: 부모 프로세스 환경변수 > Keychain (Settings UI 입력) > `.env`. `.env` 가 가장 단순한 dev 경로라 권장.

---

## 2. 의존성 설치

### 자동 (한 번에)

```bash
./scripts/setup.sh
```

### 수동 (단계별)

```bash
# 프론트엔드
pnpm install

# Python 사이드카 (venv + editable install)
cd sidecar
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -e ".[dev]"
cd ..

# Rust (선택 — Tauri 데스크톱 앱 빌드할 때만 필요)
cargo --version || ( curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y )
```

---

## 3. 첫 실행 시나리오

### 사이드카만 띄워서 API 검증

```bash
cd sidecar
SHORTIFY_TOKEN=devtok .venv/bin/uvicorn shortify_sidecar.main:app --port 51234 --reload
```

다른 터미널에서:
```bash
curl http://127.0.0.1:51234/health
# {"ok":true}

curl -H "Authorization: Bearer devtok" http://127.0.0.1:51234/image-concepts
# {"concepts":[{"slug":"diagram_whiteboard", ...}, ...]}  (5개)
```

### 풀 스택 dev (사이드카 + Vite + Tauri 셸)

```bash
pnpm tauri dev
```

처음 실행 시 cargo가 의존성 컴파일에 5~10분. 이후 캐시.

### 가벼운 dev (사이드카 + 웹 only, Tauri 빌드 회피)

```bash
./scripts/dev.sh
# 별도 터미널: 브라우저로 http://localhost:1420 접속
```

---

## 4. 일상 작업 흐름

| 작업              | 명령                                                                              |
| ----------------- | --------------------------------------------------------------------------------- |
| 사이드카만 reload | `cd sidecar && .venv/bin/uvicorn shortify_sidecar.main:app --port 51234 --reload` |
| 프론트만 dev      | `pnpm dev`                                                                        |
| 풀 스택 dev       | `pnpm tauri dev`                                                                  |
| 타입 체크         | `pnpm tsc -b --noEmit`                                                            |
| 린트              | `pnpm lint`                                                                       |
| 린트 자동수정     | `pnpm lint:fix`                                                                   |
| Python 린트       | `cd sidecar && .venv/bin/ruff check shortify_sidecar`                             |
| Python 테스트     | `cd sidecar && .venv/bin/pytest`                                                  |
| 새 마이그레이션   | `cd sidecar && .venv/bin/alembic revision --autogenerate -m "msg"`                |

---

## 5. 데이터 위치

| 항목   | 경로                                                               |
| ------ | ------------------------------------------------------------------ |
| DB     | `~/Library/Application Support/Shortify/db.sqlite`                 |
| PDF    | `~/Library/Application Support/Shortify/pdfs/`                     |
| 영상   | `~/Library/Application Support/Shortify/output/<job_id>/final.mp4` |
| 로그   | `~/Library/Application Support/Shortify/logs/`                     |
| API 키 | macOS Keychain (`shortify` 서비스의 `gemini` 항목)                 |

dev 환경에서 격리하려면 `SHORTIFY_DATA_DIR=/tmp/shortify-dev` env 로 오버라이드.

전체 데이터 초기화 (dev 셋업 망가졌을 때):
```bash
rm -rf ~/Library/Application\ Support/Shortify
# 다음 부팅 시 alembic이 새로 마이그레이션 + image_concepts 시드
```

---

## 6. 자주 만나는 오류

### `failed to run 'cargo metadata' command`
Rust 미설치. 위 0번에서 rustup 설치.

### `the greenlet library is required`
사이드카 venv에 누락. `cd sidecar && .venv/bin/pip install -e ".[dev]"` 다시.

### `coroutine 'run_migrations_online' was never awaited`
`main.py` 에서 alembic을 직접 호출. `asyncio.to_thread` 로 감싸야 한다 (이미 적용됨).

### `DEP0169 url.parse()`
pnpm 9.x + Node 25 조합. `corepack prepare pnpm@10.16.1 --activate` 로 해결.

### `GEMINI_API_KEY missing`
Settings UI에서 입력하거나 dev 모드면 `.env`의 `GEMINI_API_KEY=` 채우기.

### `sidecar exited during boot — port 51234 is likely already in use`
사이드카는 항상 **51234 포트에 고정 바인딩**한다 (랜덤 포트 사용 안 함).
누가 잡고 있는지 확인하고 종료:

```bash
lsof -nP -iTCP:51234 -sTCP:LISTEN
# COMMAND   PID  USER ...
kill -9 <PID>
```

자주 일어나는 원인:
- 이전 `pnpm tauri dev` 인스턴스가 좀비로 남음 → 위 `kill -9`
- 별도 터미널에서 standalone uvicorn 을 띄워둠 → 그 터미널 `Ctrl-C`
- macOS 가 잠깐 `TIME_WAIT` 로 잡고 있음 → 30~60초 대기 후 재시도

위치: 변경하려면 [`src-tauri/src/sidecar.rs`](../src-tauri/src/sidecar.rs) 의 `pick_port()`.

### `cargo` 첫 빌드가 너무 오래 걸림
정상. Tauri + Rust 의존성 200+개 컴파일에 5~10분. 커피 한 잔.

---

## 7. 배포 (참고)

- 결정사항 #7에 따라 **App Store 미배포** (영구). DMG 직배포만.
- `git tag v1.2.3 && git push origin v1.2.3` → GitHub Actions가 codesign + notarize + DMG 생성
- 자세한 빌드 토폴로지는 [`/wiki/prd/architecture/07-build-deploy.md`](../wiki/prd/architecture/07-build-deploy.md)

---

## 8. 더 읽기

- 아키텍처 인덱스: [`/wiki/prd/architecture/README.md`](../wiki/prd/architecture/README.md)
- 기획 의도: [`/wiki/prd/IDEA.md`](../wiki/prd/IDEA.md)
- Phase 0 산출물: [`/wiki/PHASE0.md`](../wiki/PHASE0.md)
- 팀원: [`/wiki/members.md`](../wiki/members.md)
