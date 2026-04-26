import { useEffect, useState } from "react";
import ImageConceptCard from "../components/ImageConceptCard";
import { api } from "../lib/api";
import { useAppStore } from "../store";

export default function ImageConceptPicker() {
  const concepts = useAppStore((s) => s.imageConcepts);
  const setConcepts = useAppStore((s) => s.setImageConcepts);
  const pendingJobIds = useAppStore((s) => s.pendingJobIds);
  const setView = useAppStore((s) => s.setView);

  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (concepts.length > 0) return;
    api.imageConcepts().then(({ concepts }) => setConcepts(concepts)).catch(() => undefined);
  }, [concepts.length, setConcepts]);

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
          Applies to all {pendingJobIds.length} selected sections
        </p>
      </header>

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
