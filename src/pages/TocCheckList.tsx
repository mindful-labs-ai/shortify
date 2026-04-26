import { useState } from "react";
import { api } from "../lib/api";
import { useAppStore } from "../store";

export default function TocCheckList() {
  const pdf = useAppStore((s) => s.pdf);
  const setPendingJobIds = useAppStore((s) => s.setPendingJobIds);
  const setView = useAppStore((s) => s.setView);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  if (!pdf) {
    return (
      <div className="flex min-h-screen items-center justify-center text-neutral-500">
        No PDF loaded. Drop one first.
      </div>
    );
  }

  const toggle = (idx: number) =>
    setPicked((cur) => {
      const next = new Set(cur);
      if (next.has(idx)) next.delete(idx);
      else if (next.size < 5) next.add(idx);
      return next;
    });

  const submit = async () => {
    if (picked.size === 0) return;
    setBusy(true);
    try {
      const { job_ids } = await api.createJobs(pdf.id, [...picked]);
      setPendingJobIds(job_ids);
      setView("image_picker");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{pdf.filename}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {pdf.page_count} pages · pick up to 5 sections to turn into videos
        </p>
      </header>

      <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {pdf.toc.map((t) => {
          const checked = picked.has(t.idx);
          const disabled = !checked && picked.size >= 5;
          return (
            <li key={t.idx}>
              <label
                className={[
                  "flex cursor-pointer items-start gap-3 px-4 py-3 transition",
                  disabled ? "opacity-40" : "hover:bg-neutral-50",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-neutral-900"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(t.idx)}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{t.title}</div>
                  <div className="text-xs text-neutral-500">
                    pages {t.page_start + 1}–{t.page_end + 1}
                  </div>
                </div>
              </label>
            </li>
          );
        })}
      </ul>

      <footer className="sticky bottom-6 mt-8 flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <span className="text-sm text-neutral-600">{picked.size} / 5 selected</span>
        <button
          type="button"
          onClick={submit}
          disabled={busy || picked.size === 0}
          className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition disabled:opacity-40"
        >
          {busy ? "Creating jobs…" : "Continue"}
        </button>
      </footer>
    </div>
  );
}
