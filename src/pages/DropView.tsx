/**
 * DropView — placeholder one-page implementation.
 *
 * Functional minimum: drag-drop + click-to-pick PDF, upload, poll until TOC ready,
 * navigate to TocCheckList. Plain HTML/Tailwind so the rest of the app is usable
 * end-to-end while waiting for the real Claude-Design version on the sicei branch.
 *
 * Replace freely — only contract is: on success, call setPdf(...) + setView("toc").
 */
import { useCallback, useRef, useState } from "react";
import { api } from "../lib/api";
import { useAppStore } from "../store";

export default function DropView() {
  const setPdf = useAppStore((s) => s.setPdf);
  const setView = useAppStore((s) => s.setView);
  const inputRef = useRef<HTMLInputElement>(null);

  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setErr("PDF only");
        return;
      }
      setErr(null);
      setBusy(`Uploading ${file.name}…`);
      try {
        const { pdf_id } = await api.uploadPdf(file);

        setBusy("Extracting table of contents…");
        // 워커가 TOC 추출 → toc_json 채워질 때까지 폴링 (최대 60s)
        for (let i = 0; i < 60; i++) {
          const pdf = await api.getToc(pdf_id);
          if (pdf.toc && pdf.toc.length > 0) {
            setPdf(pdf);
            setView("toc");
            return;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
        setErr("TOC extraction timed out. Try again or pick a different PDF.");
      } catch (e) {
        setErr(String(e));
      } finally {
        setBusy(null);
      }
    },
    [setPdf, setView],
  );

  return (
    <div className="flex min-h-[calc(100vh-57px)] items-center justify-center p-12">
      <div className="w-full max-w-xl">
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

        <p className="mt-12 text-center text-[10px] uppercase tracking-wider text-neutral-300">
          placeholder · sicei
        </p>
      </div>
    </div>
  );
}
