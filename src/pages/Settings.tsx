import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { tauri } from "../lib/tauri";

const SERVICE = "shortify";
const KEY = "gemini";

export default function SettingsPage() {
  const [keyValue, setKeyValue] = useState("");
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    tauri.keychainGet(SERVICE, KEY).then((v) => setHasKey(Boolean(v)));
  }, []);

  const save = async () => {
    if (!keyValue.trim()) return;
    setBusy(true);
    try {
      await tauri.keychainSet(SERVICE, KEY, keyValue.trim());
      setHasKey(true);
      setKeyValue("");
      setMsg("Saved. Restart the app for the sidecar to pick up the new key.");
    } catch (e) {
      setMsg(`Failed: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await tauri.keychainDelete(SERVICE, KEY);
      setHasKey(false);
      setMsg("API key removed.");
    } finally {
      setBusy(false);
    }
  };

  const wipe = async () => {
    if (!confirm("Soft-delete ALL data and remove the API key? You can restore from Trash before emptying it.")) {
      return;
    }
    setBusy(true);
    try {
      const jobs = await api.listJobs();
      await Promise.all(jobs.jobs.map((j) => api.deleteJob(j.id)));
      await remove();
      setMsg("All data moved to Trash. Empty Trash from the library to free disk.");
    } finally {
      setBusy(false);
    }
  };

  const emptyTrash = async () => {
    setBusy(true);
    try {
      const r = await api.emptyTrash();
      setMsg(`Purged ${r.purged_jobs} jobs, ${r.purged_pdfs} PDFs, freed ${(r.freed_bytes / 1e6).toFixed(1)} MB.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="mb-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Gemini API key
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Stored in macOS Keychain. Used for all AI calls (Gemini text · Imagen · Veo · TTS · Audio).
        </p>
        <div className="mt-4 flex gap-2">
          <input
            type="password"
            value={keyValue}
            onChange={(e) => setKeyValue(e.target.value)}
            placeholder={hasKey ? "•••••••• (replace)" : "Paste your Gemini API key"}
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
          <button
            type="button"
            onClick={save}
            disabled={busy || !keyValue.trim()}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-40"
          >
            Save
          </button>
        </div>
        {hasKey ? (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="mt-3 text-xs text-neutral-500 underline-offset-2 hover:underline"
          >
            Remove API key
          </button>
        ) : null}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
          Data
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={wipe}
            disabled={busy}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm transition hover:border-rose-400 hover:text-rose-600"
          >
            Move all data to Trash
          </button>
          <button
            type="button"
            onClick={emptyTrash}
            disabled={busy}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm transition hover:border-rose-400 hover:text-rose-600"
          >
            Empty Trash (irreversible)
          </button>
        </div>
      </section>

      {msg ? (
        <p className="mt-6 rounded-lg bg-neutral-100 p-3 text-sm text-neutral-700">{msg}</p>
      ) : null}
    </div>
  );
}
