/**
 * DropView — placeholder one-page implementation.
 *
 * Functional minimum: drag-drop + click-to-pick PDF, upload (sha-deduped on
 * the server), or pick from recent PDFs. Navigates to TocCheckList once toc
 * is ready. Replace on the sicei branch — only contract is: on success,
 * call setPdf(...) + setView("toc").
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { api, type PdfSummary } from "../lib/api";
import { useAppStore } from "../store";

export default function DropView() {
  const setPdf = useAppStore((s) => s.setPdf);
  const setView = useAppStore((s) => s.setView);
  const inputRef = useRef<HTMLInputElement>(null);

  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [recents, setRecents] = useState<PdfSummary[]>([]);

  const refreshRecents = useCallback(async () => {
    try {
      const r = await api.listPdfs();
      setRecents(r.pdfs);
    } catch {
      // 사이드카가 아직 안 떴을 수도 있음 — 조용히 패스
    }
  }, []);

  useEffect(() => {
    refreshRecents();
  }, [refreshRecents]);

  // 공통: pdf_id 가 toc 가질 때까지 polling (없으면 timeout 메시지)
  const waitForToc = useCallback(
    async (pdfId: string, label: string): Promise<boolean> => {
      setBusy(label);
      for (let i = 0; i < 60; i++) {
        const pdf = await api.getToc(pdfId);
        if (pdf.toc && pdf.toc.length > 0) {
          setPdf(pdf);
          setView("toc");
          return true;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      setErr("TOC extraction timed out. Try again or pick a different PDF.");
      return false;
    },
    [setPdf, setView],
  );

  const openExisting = useCallback(
    async (id: string) => {
      setErr(null);
      try {
        const pdf = await api.getToc(id);
        if (pdf.toc && pdf.toc.length > 0) {
          setPdf(pdf);
          setView("toc");
          return;
        }
        // toc 없는 경우 (이전 추출 실패 등) — 폴링
        await waitForToc(id, "Re-extracting table of contents…");
      } catch (e) {
        setErr(String(e));
      } finally {
        setBusy(null);
      }
    },
    [setPdf, setView, waitForToc],
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setErr("PDF only");
        return;
      }
      setErr(null);
      setBusy(`Uploading ${file.name}…`);
      try {
        const r = await api.uploadPdf(file);

        // 서버가 dedup + toc 를 이미 가지고 있으면 즉시 진행
        if (r.deduped && r.toc_present) {
          await openExisting(r.pdf_id);
          return;
        }
        // 신규 업로드 또는 toc 가 아직 없는 dedup → 폴링
        const ok = await waitForToc(r.pdf_id, "Extracting table of contents…");
        if (ok) refreshRecents();
      } catch (e) {
        setErr(String(e));
      } finally {
        setBusy(null);
      }
    },
    [openExisting, refreshRecents, waitForToc],
  );

  return (
    <div className="flex min-h-[calc(100vh-57px)] items-start justify-center p-12">
      <div className="w-full max-w-xl">
        {/* ───────── Drop zone ───────── */}
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            setHover(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setHover(true);
          }}
          onDragLeave={() => setHover(false)}
          onDrop={(e) => {
            e.preventDefault();
            setHover(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={[
            "flex aspect-[16/10] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed bg-white text-center transition",
            hover
              ? "border-neutral-900 bg-neutral-50"
              : "border-neutral-300 hover:border-neutral-500",
            busy ? "pointer-events-none opacity-70" : "",
          ].join(" ")}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <div className="text-5xl">📄</div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Shortify</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Drop a PDF here, or click to choose
          </p>
          <p className="mt-6 text-xs text-neutral-400">
            Turn knowledge into short-form videos for faster learning
          </p>
        </div>

        {busy ? (
          <p className="mt-6 text-center text-sm text-neutral-600">
            <span className="inline-block animate-pulse">●</span> {busy}
          </p>
        ) : null}
        {err ? (
          <p className="mt-6 text-center text-sm text-rose-600">{err}</p>
        ) : null}

        {/* ───────── Recent PDFs ───────── */}
        {recents.length > 0 ? (
          <section className="mt-10">
            <header className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Recent PDFs
              </h2>
              <button
                type="button"
                onClick={refreshRecents}
                className="text-[11px] text-neutral-400 hover:text-neutral-700"
              >
                Refresh
              </button>
            </header>
            <ul className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              {recents.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => openExisting(p.id)}
                    disabled={!!busy}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-neutral-50 disabled:opacity-50"
                  >
                    <span className="text-lg">📕</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{p.filename}</div>
                      <div className="mt-0.5 text-xs text-neutral-500">
                        {p.page_count ?? "?"} pages ·{" "}
                        {p.has_toc ? `${p.toc_count} sections` : "no TOC yet"}
                      </div>
                    </div>
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        p.has_toc
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700",
                      ].join(" ")}
                    >
                      {p.has_toc ? "Ready" : "Extracting"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-12 text-center text-[10px] uppercase tracking-wider text-neutral-300">
          placeholder · sicei
        </p>
      </div>
    </div>
  );
}
