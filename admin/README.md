# Shortify Admin

Single-page browser dashboard for monitoring the sidecar in real time.
Polls `GET /admin/state` every 3 seconds and shows:

- Queue counts (pending / running / done / failed)
- Sidecar config (data_dir, worker count, Gemini key presence, model IDs)
- Latest 50 jobs with stage badge and error/message
- Latest 30 queue tasks (per-worker, with retry attempts and error)
- Latest 100 stage transition events as a live timeline

## Run

The sidecar must be running already (via `pnpm tauri dev`, `./scripts/dev.sh`,
or `uvicorn ... shortify_sidecar.main:app`).

```bash
open admin/index.html
# or, if `open` doesn't work, double-click the file in Finder
```

The page asks for two values (saved to `localStorage`):

| Field    | Where to get it                                                                           |
|----------|-------------------------------------------------------------------------------------------|
| Base URL | sidecar terminal log: `Shortify sidecar at 127.0.0.1:<port>` → `http://127.0.0.1:<port>` |
| Token    | `.env` `SHORTIFY_TOKEN` (dev), or whatever Tauri Shell printed when it spawned the sidecar |

Click **Connect** once. After that the page auto-refreshes (toggle in the
top-right header).

## What it talks to

`GET /admin/state` (Bearer-protected, same token guard as the rest of
the API). Returns:

```json
{
  "config": { "model_text": "...", "gemini_key_set": true, ... },
  "queue":  { "counts": { "pending": 3, "running": 1, ... }, "recent": [ ... ] },
  "events": [ { "job_id": "...", "stage": 4, "message": "...", "created_at": "..." } ],
  "jobs":   [ { "id": "...", "stage": 4, "title": "...", "error": null, ... } ]
}
```

Everything is read-only here. Mutations (retry, delete, restore, empty
trash) live on the main UI. This is just an inspector.

## Why a separate page

- Keeps the consumer-facing app uncluttered (no debug tabs to ship).
- Works while `tauri dev` is restarting the Rust shell — pure HTML loads
  instantly in any browser.
- Single file, no build step. Replace `index.html` with a fancier React
  build later if needed; the API contract (`/admin/state`) stays.
