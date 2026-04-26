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
    try {
      await Promise.all(pendingJobIds.map((id) => api.selectImage(id, selected)));
      setView("progress");
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
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
