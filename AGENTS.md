# AGENTS.md — Shortify

> Machine-readable agent guide. Conventions: terse, command-first, error→fix table.
> Human-friendly version: [`docs/getting-started.md`](./docs/getting-started.md).
> Architecture decisions: [`wiki/prd/IDEA.md`](./wiki/prd/IDEA.md).

---

## What this is

Shortify is a macOS desktop app: drop a PDF → 30-60s vertical learning videos
per chapter. Tauri 2 (Rust shell) + React 19 (Vite + Tailwind) + Python sidecar
(FastAPI + SQLAlchemy + google-genai). Apple Silicon only (arm64). DMG distribution
only (no App Store). All AI calls go to Google Gemini API (single `GEMINI_API_KEY`).

## Layout

```
src/                     # React frontend (TypeScript)
src-tauri/               # Tauri Rust shell + capabilities
sidecar/                 # Python FastAPI + pipeline + DB + queue
prompts/                 # Canonical Gemini prompts
assets/                  # Bundled fonts, BGM, ffmpeg, image concept previews
docs/                    # Human docs
wiki/                    # PRD + architecture + team
scripts/                 # setup.sh, dev.sh, build/codesign/notarize/dmg
```

## Required tools (verify before any work)

```sh
node --version        # 20+
pnpm --version        # 10.16+ (corepack will provision)
python3 --version     # 3.11+
cargo --version       # stable (only if touching src-tauri/)
xcode-select -p       # CLT path
```

If `cargo` missing **and the task touches `src-tauri/`**:
```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
source "$HOME/.cargo/env"
```

## Bootstrap (idempotent)

```sh
./scripts/setup.sh
```

What it does, in order:
1. Verify Node ≥ 20, Python ≥ 3.11
2. `corepack prepare pnpm@10.16.1 --activate`
3. `pnpm install`
4. `cd sidecar && python3 -m venv .venv && .venv/bin/pip install -e ".[dev]"`
5. (if cargo present) `cd src-tauri && cargo fetch`
6. Print next-step instructions

## Run

| Goal                         | Command                                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| Sidecar only (fast, no Rust) | `cd sidecar && SHORTIFY_TOKEN=devtok .venv/bin/uvicorn shortify_sidecar.main:app --port 51234 --reload` |
| Sidecar + Vite (web only)    | `./scripts/dev.sh` then open `http://localhost:1420`                                                    |
| Full stack (Tauri desktop)   | `pnpm tauri dev`                                                                                        |
| Production build             | `pnpm tauri build` (needs codesign config)                                                              |

## Verify

| Check        | Command                                                     | Expected              |
| ------------ | ----------------------------------------------------------- | --------------------- |
| TypeScript   | `pnpm tsc -b --noEmit`                                      | exit 0, no output     |
| ESLint       | `pnpm lint`                                                 | exit 0, no output     |
| Sidecar boot | `curl http://127.0.0.1:51234/health`                        | `{"ok":true}`         |
| Auth gate    | `curl http://127.0.0.1:51234/image-concepts`                | HTTP 401              |
| Auth pass    | `curl -H "Authorization: Bearer devtok" .../image-concepts` | HTTP 200 + 5 concepts |
| Python lint  | `cd sidecar && .venv/bin/ruff check shortify_sidecar`       | exit 0                |

## Edit conventions

- API contract: any change to `sidecar/shortify_sidecar/api/*.py` MUST be mirrored in `src/lib/api.ts` in the same PR.
- Tauri commands: any change to `src-tauri/src/main.rs` `#[tauri::command]` MUST mirror to `src/lib/tauri.ts`.
- DB schema: change `sidecar/shortify_sidecar/db/models.py` then `cd sidecar && .venv/bin/alembic revision --autogenerate -m "..."`. Never hand-edit `versions/`.
- Soft delete only: never write `DELETE FROM jobs`/`pdfs` outside `DELETE /trash`. Use `deleted_at = now()`.
- Tech-agnostic team docs: `wiki/members.md` doesn't name frameworks (per past correction).

## Error → fix table

| Symptom                                                            | Fix                                                                                                                                                                                                                    |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `failed to run 'cargo metadata'`                                   | install rustup (see Required tools)                                                                                                                                                                                    |
| `frontendDist ../dist doesn't exist`                               | run `pnpm build` once before any `cargo check`/`tauri build`                                                                                                                                                           |
| `failed to open icon icons/icon.png`                               | run `setup.sh` (generates placeholder) or `pnpm tauri icon path/to/source.png`                                                                                                                                         |
| `the greenlet library is required`                                 | `cd sidecar && .venv/bin/pip install -e ".[dev]"`                                                                                                                                                                      |
| `coroutine 'run_migrations_online' was never awaited`              | use `asyncio.to_thread` (already done in `main.py`)                                                                                                                                                                    |
| `DEP0169 url.parse()` from pnpm                                    | `corepack prepare pnpm@10.16.1 --activate`                                                                                                                                                                             |
| `GEMINI_API_KEY missing`                                           | Put it in `.env` at repo root (auto-loaded by sidecar via python-dotenv on boot, walks up from cwd). Or Settings UI → Keychain (overrides .env when present).                                                          |
| `Cannot find name 'process'` in `vite.config.ts`                   | already fixed: `@types/node` + tsconfig.node.json                                                                                                                                                                      |
| TS6310 composite/emit                                              | already fixed: removed references in `tsconfig.json`                                                                                                                                                                   |
| ESLint can't find `vite.config.ts`                                 | already fixed: ignored in `eslint.config.js`                                                                                                                                                                           |
| Stale dev DB after schema change                                   | `rm -rf ~/Library/Application\ Support/Shortify/db.sqlite` (alembic re-applies on boot)                                                                                                                                |
| `sidecar exited during boot — port 51234 is likely already in use` | `lsof -nP -iTCP:51234 -sTCP:LISTEN` → `kill -9 <PID>`. Cause: another `uvicorn`, a previous `pnpm tauri dev`, or admin standalone server. Sidecar always binds 51234 (fixed in `src-tauri/src/sidecar.rs::pick_port`). |

## Key decisions (read before refactoring)

- DB: SQLite via SQLAlchemy/sqlmodel. PG ports later (alembic + `[pg]` extra ready). See [`wiki/prd/architecture/04-data-model.md`](./wiki/prd/architecture/04-data-model.md) "Future PG Migration".
- All AI = Google Gemini API. Models in `sidecar/shortify_sidecar/settings.py`.
- UI = English. App Store = no. arm64 only.
- BYOK: user supplies their `GEMINI_API_KEY`. Never proxy through our server.
- Soft delete model: `deleted_at` column on `pdfs`/`jobs`. Files preserved until `DELETE /trash`.

## Branch ownership

| Branch      | Owner  | Domain                                    |
| ----------- | ------ | ----------------------------------------- |
| `sunny`     | 박경선 | AI / video pipeline / domain              |
| `gyeongmin` | 김경민 | Backend infra / Tauri integration / build |
| `sicei`     | 김성곤 | Design + Frontend (Claude Design → code)  |

## When in doubt

1. Read `docs/getting-started.md` (human prose).
2. Search `wiki/prd/architecture/` for the relevant area.
3. Run the smallest verification command from the table above before assuming things are broken.
