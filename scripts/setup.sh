#!/usr/bin/env bash
# Shortify 자동 셋업 — 한 번 실행으로 의존성 전부 준비.
# 멱등 (idempotent): 여러 번 돌려도 안전.

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

bold() { printf "\033[1m%s\033[0m\n" "$1"; }
info() { printf "  • %s\n" "$1"; }
warn() { printf "\033[33m  ⚠ %s\033[0m\n" "$1"; }
ok()   { printf "\033[32m  ✓ %s\033[0m\n" "$1"; }
fail() { printf "\033[31m  ✗ %s\033[0m\n" "$1"; exit 1; }

# ─────────────── 1. 전제 조건 검증 ───────────────
bold "[1/5] Checking prerequisites…"

if [[ "$(uname -m)" != "arm64" ]]; then
  warn "Not Apple Silicon (uname -m = $(uname -m)). Shortify is arm64-only."
fi

command -v node >/dev/null 2>&1 || fail "node not found. Install Node.js 20+."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$NODE_MAJOR" -ge 20 ]] || fail "Node $NODE_MAJOR detected. Need 20+."
ok "Node $(node --version)"

command -v python3 >/dev/null 2>&1 || fail "python3 not found. Install Python 3.11+."
PY_OK=$(python3 -c 'import sys; print(1 if sys.version_info >= (3,11) else 0)')
[[ "$PY_OK" == "1" ]] || fail "Python $(python3 --version) too old. Need 3.11+."
ok "$(python3 --version)"

if command -v cargo >/dev/null 2>&1; then
  ok "cargo $(cargo --version | awk '{print $2}')"
else
  warn "cargo not found — required for 'pnpm tauri dev/build'. Install:"
  warn "    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"
fi

if ! xcode-select -p >/dev/null 2>&1; then
  warn "Xcode Command Line Tools not installed. Run: xcode-select --install"
fi

# ─────────────── 2. pnpm 활성화 ───────────────
bold "[2/5] Activating pnpm via corepack…"
if command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
  corepack prepare pnpm@10.16.1 --activate >/dev/null 2>&1
  ok "pnpm $(pnpm --version)"
else
  warn "corepack not available; install pnpm globally: npm i -g pnpm@10.16.1"
fi

# ─────────────── 3. 프론트 의존성 ───────────────
bold "[3/5] Installing frontend dependencies (pnpm)…"
pnpm install --silent
ok "pnpm install done"

# ─────────────── 4. Python 사이드카 venv ───────────────
bold "[4/5] Setting up Python sidecar venv…"
if [[ ! -d sidecar/.venv ]]; then
  python3 -m venv sidecar/.venv
  ok "venv created at sidecar/.venv"
else
  info "venv already exists at sidecar/.venv"
fi
sidecar/.venv/bin/pip install --upgrade pip --quiet
sidecar/.venv/bin/pip install -e "sidecar[dev]" --quiet
ok "sidecar deps installed"

# ─────────────── 5. (선택) Cargo fetch ───────────────
bold "[5/5] (Optional) Pre-fetching cargo deps…"
if command -v cargo >/dev/null 2>&1; then
  ( cd src-tauri && cargo fetch --locked 2>/dev/null || cargo fetch ) && ok "cargo fetch done"
else
  info "Skipped (cargo not installed)"
fi

# ─────────────── 마무리 ───────────────
bold ""
bold "✓ Setup complete."
cat <<EOF

  Next:
    1. cp .env.example .env             # GEMINI_API_KEY 채우기
    2. ./scripts/dev.sh                 # 사이드카 + 웹 dev
       또는 pnpm tauri dev              # 풀 데스크톱 셸 (cargo 필요)

  Verify sidecar:
    curl http://127.0.0.1:51234/health
    # {"ok":true}

  Docs:
    docs/getting-started.md             # human guide
    AGENTS.md                           # AI agent reference
EOF
