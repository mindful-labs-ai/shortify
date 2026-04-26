import { useCallback, useEffect, useState } from "react";
import ImageConceptCard from "../components/ImageConceptCard";
import { api, type Job } from "../lib/api";
import { useAppStore } from "../store";

const STAGE_LABEL: Record<number, string> = {
  [-1]: "Failed",
  0: "Queued",
  1: "Extracting section",
  2: "Conceptizing",
  3: "Awaiting image choice",
  4: "Generating images",
  5: "Generating clips",
  6: "Generating narration",
  7: "Aligning",
  8: "Composing",
  9: "Done",
};

export default function ImageConceptPicker() {
  const concepts = useAppStore((s) => s.imageConcepts);
  const setConcepts = useAppStore((s) => s.setImageConcepts);
  const pendingJobIds = useAppStore((s) => s.pendingJobIds);
  const setView = useAppStore((s) => s.setView);

  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [jobStates, setJobStates] = useState<Job[]>([]);

  useEffect(() => {
    if (concepts.length > 0) return;
    api.imageConcepts().then(({ concepts }) => setConcepts(concepts)).catch(() => undefined);
  }, [concepts.length, setConcepts]);

  // pendingJobIds 의 실제 상태를 폴링 (3초마다, stage<4 일 때만)
  const refreshStates = useCallback(async () => {
    if (pendingJobIds.length === 0) return;
    const states = await Promise.all(
      pendingJobIds.map((id) => api.getJob(id).catch(() => null)),
    );
    setJobStates(states.filter((s): s is Job => s !== null));
  }, [pendingJobIds]);

  useEffect(() => {
    refreshStates();
    const t = setInterval(refreshStates, 3000);
    return () => clearInterval(t);
  }, [refreshStates]);

  const eligible = jobStates.filter((j) => j.stage >= 0 && j.stage <= 3);
  const failed = jobStates.filter((j) => j.stage === -1);
  const inflight = jobStates.filter((j) => j.stage > 3);

  const retryFailed = async () => {
    setBusy(true);
    try {
      await Promise.allSettled(failed.map((j) => api.retryJob(j.id)));
      await refreshStates();
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!selected || pendingJobIds.length === 0) return;
    setBusy(true);
    setErr(null);
    const results = await Promise.allSettled(
      pendingJobIds.map((id) => api.selectImage(id, selected)),
    );
    const failed = results
      .map((r, i) => ({ r, id: pendingJobIds[i] }))
      .filter((x) => x.r.status === "rejected");
    setBusy(false);

    if (failed.length === 0) {
      setView("progress");
      return;
    }
    if (failed.length < pendingJobIds.length) {
      // 일부 성공 — 진행 화면으로 이동, 실패한 것만 표시
      setErr(`${failed.length} of ${pendingJobIds.length} jobs already past selection (likely already done or failed). Continuing with the rest.`);
      setView("progress");
      return;
    }
    setErr(
      `All ${failed.length} jobs are no longer eligible for image choice. ` +
      `They may already be processing or have failed (check Library / Settings → Trash).`,
    );
  };

  return (
    <div className="mx-auto max-w-5xl p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Pick a visual style</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Applies to {eligible.length} of {pendingJobIds.length} selected sections
          {inflight.length > 0 ? ` · ${inflight.length} already in progress` : ""}
          {failed.length > 0 ? ` · ${failed.length} failed` : ""}
        </p>
      </header>

      {jobStates.length > 0 ? (
        <ul className="mb-6 divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white text-sm">
          {jobStates.map((j) => (
            <li key={j.id} className="flex items-start gap-3 px-4 py-3">
              <span
                className={[
                  "mt-0.5 inline-block w-32 shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-medium",
                  j.stage === -1 ? "bg-rose-100 text-rose-700" :
                  j.stage === 9 ? "bg-emerald-100 text-emerald-700" :
                  j.stage > 3 ? "bg-sky-100 text-sky-700" :
                  "bg-neutral-100 text-neutral-700",
                ].join(" ")}
              >
                {STAGE_LABEL[j.stage] ?? `stage ${j.stage}`}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{j.toc_section_title}</div>
                {j.error ? (
                  <div className="mt-1 line-clamp-2 text-xs text-rose-600">{j.error}</div>
                ) : j.stage_message ? (
                  <div className="mt-1 truncate text-xs text-neutral-500">{j.stage_message}</div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {failed.length > 0 ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-medium">{failed.length} job(s) failed.</p>
          <p className="mt-1 text-xs">
            Common cause: <code className="rounded bg-white/60 px-1">GEMINI_API_KEY</code> not set.
            Add it via <button type="button" onClick={() => setView("settings")} className="underline">Settings</button>{" "}
            then retry.
          </p>
          <button
            type="button"
            onClick={retryFailed}
            disabled={busy}
            className="mt-3 rounded-full border border-rose-300 px-3 py-1 text-xs hover:bg-rose-100"
          >
            Retry failed
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {concepts.map((c) => (
          <ImageConceptCard
            key={c.slug}
            concept={c}
            selected={selected === c.slug}
            onSelect={setSelected}
          />
        ))}
      </div>

      {err ? <p className="mt-4 text-sm text-rose-600">{err}</p> : null}

      <footer className="sticky bottom-6 mt-8 flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setView("toc")}
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={apply}
          disabled={!selected || busy}
          className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white transition disabled:opacity-40"
        >
          {busy ? "Starting…" : "Generate videos"}
        </button>
      </footer>
    </div>
  );
}
