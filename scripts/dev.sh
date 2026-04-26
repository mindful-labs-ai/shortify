#!/usr/bin/env bash
# Shortify dev 실행 — 사이드카(uvicorn) + Tauri(vite) 동시 기동.
# 사용: ./scripts/dev.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a; source .env; set +a
fi

export SHORTIFY_HOST="${SHORTIFY_HOST:-127.0.0.1}"
export SHORTIFY_PORT="${SHORTIFY_PORT:-51234}"
export SHORTIFY_TOKEN="${SHORTIFY_TOKEN:-dev-only-token-do-not-use-in-production}"
export SHORTIFY_DEV=1

echo "▶ Sidecar  http://${SHORTIFY_HOST}:${SHORTIFY_PORT}  (token=${SHORTIFY_TOKEN:0:8}…)"
echo "▶ Frontend http://localhost:1420"
echo

if [[ ! -d sidecar/.venv ]]; then
  echo "⚠️  sidecar/.venv 없음. 먼저 'cd sidecar && python -m venv .venv && .venv/bin/pip install -e .[dev]' 실행"
  exit 1
fi

# 사이드카는 백그라운드, Tauri 종료 시 같이 정리
( cd sidecar && .venv/bin/uvicorn shortify_sidecar.main:app \
    --host "$SHORTIFY_HOST" --port "$SHORTIFY_PORT" --reload ) &
SIDECAR_PID=$!
trap 'kill $SIDECAR_PID 2>/dev/null || true' EXIT INT TERM

pnpm tauri dev
