# Shortify Admin

Stand-alone Vite + React monitoring dashboard for the Shortify sidecar.
Independent of the main desktop app — runs on its own dev server (port
1421), can be opened in any browser. Polls the sidecar's
`GET /admin/state` every 3 seconds.

## Setup

```bash
cd admin
pnpm install
pnpm dev          # http://localhost:1421
```

Build a static bundle:

```bash
pnpm build
pnpm preview      # serves admin/dist
```

## Usage

1. Make sure the sidecar is running (via the main repo's `pnpm tauri dev`,
   `./scripts/dev.sh`, or `uvicorn ... shortify_sidecar.main:app`).
2. Open `http://localhost:1421`.
3. Fill in:
   - **Base URL**: from the sidecar terminal log line
     `Shortify sidecar at 127.0.0.1:<port>` → `http://127.0.0.1:<port>`
   - **Token**: from `.env` (`SHORTIFY_TOKEN`) or whatever the Tauri shell
     printed when it spawned the sidecar
4. Click **Connect**. Both values are persisted to `localStorage`.

## What you see

| Panel        | Source                  | Notes                                                              |
|--------------|-------------------------|---------------------------------------------------------------------|
| Stat bar     | `queue.counts` + jobs n | Pending / Running / Done / Failed / Total jobs                      |
| Config       | `config`                | Model IDs, data_dir, worker count, Gemini-key indicator (red/green) |
| Jobs (left)  | `jobs[]` (latest 50)    | Stage badge, concept, duration, soft-deleted strikethrough          |
| Queue (RT)   | `queue.recent[]` (30)   | Status, task type, attempts, worker, error                          |
| Events (RB)  | `events[]` (100)        | Stage transition timeline, oldest at bottom                         |

Read-only. Mutations (retry, restore, empty trash) live on the main app.

## Why a separate project

- Independent dev server — keeps running while `tauri dev` rebuilds the
  Rust shell.
- Open in any browser, not coupled to the WKWebView.
- No build dependency on the main `package.json` (own `node_modules`,
  own `pnpm install`).
- Replace freely without touching the consumer-facing app.

## API contract

`GET /admin/state` (Bearer-protected). Response shape:

```ts
{
  config: { model_text, model_image, model_video, model_tts, model_audio,
            data_dir, n_workers, gemini_key_set },
  queue:  { counts: { pending, running, done, failed }, recent: [...] },
  events: [{ job_id, stage, message, created_at }, ...],
  jobs:   [{ id, title, stage, error, concept, output_video_path, ... }, ...],
}
```

Defined in `sidecar/shortify_sidecar/api/admin.py`. If you add fields
there, mirror them in `admin/src/types.ts`.
