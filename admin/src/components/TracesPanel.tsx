import { useState } from "react";
import type { AiTrace } from "../types";

const KIND_COLOR: Record<string, string> = {
  text_json: "bg-violet-100 text-violet-700",
  pdf_toc: "bg-indigo-100 text-indigo-700",
  text: "bg-violet-100 text-violet-700",
  image: "bg-pink-100 text-pink-700",
  i2v: "bg-sky-100 text-sky-700",
  tts: "bg-amber-100 text-amber-700",
  align: "bg-teal-100 text-teal-700",
};

const STATUS_COLOR: Record<AiTrace["status"], string> = {
  running: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
};

type Props = {
  traces: AiTrace[];
  selectedJobId: string | null;
};

export default function TracesPanel({ traces, selectedJobId }: Props) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [kindFilter, setKindFilter] = useState<string | "all">("all");

  const filtered = traces
    .filter((t) => (selectedJobId ? t.job_id === selectedJobId : true))
    .filter((t) => (kindFilter === "all" ? true : t.kind === kindFilter));

  const allKinds = Array.from(new Set(traces.map((t) => t.kind)));

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 px-4 py-2">
        <h2 className="text-sm font-medium">
          AI traces (latest 100)
          {selectedJobId ? (
            <span className="ml-2 text-[11px] font-normal text-neutral-500">
              · job <code>{selectedJobId.slice(0, 8)}</code>
            </span>
          ) : null}
        </h2>
        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="ml-2 rounded-md border border-neutral-300 px-1.5 py-0.5 text-[11px] outline-none focus:border-neutral-900"
        >
          <option value="all">all kinds</option>
          {allKinds.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-neutral-500">
          {filtered.length}
          {selectedJobId || kindFilter !== "all"
            ? `/${traces.length}`
            : ""}{" "}
          rows
        </span>
      </div>
      <div className="max-h-[500px] divide-y divide-neutral-100 overflow-auto text-xs">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-neutral-400">
            no traces
          </div>
        ) : (
          filtered.map((t) => {
            const open = openId === t.id;
            const time = t.started_at
              ? new Date(t.started_at).toLocaleTimeString()
              : "";
            return (
              <div key={t.id} className="px-4 py-1.5">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : t.id)}
                  className="flex w-full items-center gap-2 text-left"
                >
                  <span className="w-16 shrink-0 text-[10px] tabular-nums text-neutral-400">
                    {time}
                  </span>
                  <span
                    className={`inline-block w-20 shrink-0 rounded-full ${KIND_COLOR[t.kind] ?? "bg-neutral-100 text-neutral-700"} px-1.5 py-0.5 text-center text-[10px] font-medium`}
                  >
                    {t.kind}
                  </span>
                  <span
                    className={`inline-block w-16 shrink-0 rounded-full ${STATUS_COLOR[t.status]} px-1.5 py-0.5 text-center text-[10px] font-medium`}
                  >
                    {t.status}
                  </span>
                  <span className="truncate text-neutral-600">{t.model}</span>
                  {t.job_id && !selectedJobId ? (
                    <span className="ml-1 text-[10px] text-neutral-400">
                      job <code>{t.job_id.slice(0, 6)}</code>
                    </span>
                  ) : null}
                  <span className="ml-auto text-[10px] tabular-nums text-neutral-400">
                    {t.duration_ms !== null
                      ? `${(t.duration_ms / 1000).toFixed(2)}s`
                      : "…"}
                  </span>
                  <span className="text-neutral-400">{open ? "▾" : "▸"}</span>
                </button>
                {open ? (
                  <div className="mt-2 space-y-2 rounded-lg bg-neutral-50 p-3 text-[11px]">
                    {t.error ? (
                      <div className="text-rose-600">
                        <div className="font-semibold">error</div>
                        <pre className="whitespace-pre-wrap break-words">
                          {t.error}
                        </pre>
                      </div>
                    ) : null}
                    <details open>
                      <summary className="cursor-pointer font-semibold text-neutral-700">
                        request
                      </summary>
                      <div className="mt-1 space-y-1">
                        {Object.keys(t.request_meta).length > 0 ? (
                          <pre className="whitespace-pre-wrap break-words text-neutral-500">
                            {JSON.stringify(t.request_meta, null, 2)}
                          </pre>
                        ) : null}
                        {t.request_preview ? (
                          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-white p-2 text-neutral-700 ring-1 ring-neutral-200">
                            {t.request_preview}
                          </pre>
                        ) : (
                          <span className="text-neutral-400">(empty)</span>
                        )}
                      </div>
                    </details>
                    <details open={t.status === "done"}>
                      <summary className="cursor-pointer font-semibold text-neutral-700">
                        response
                      </summary>
                      <div className="mt-1 space-y-1">
                        {Object.keys(t.response_meta).length > 0 ? (
                          <pre className="whitespace-pre-wrap break-words text-neutral-500">
                            {JSON.stringify(t.response_meta, null, 2)}
                          </pre>
                        ) : null}
                        {t.response_preview ? (
                          <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded bg-white p-2 text-neutral-700 ring-1 ring-neutral-200">
                            {t.response_preview}
                          </pre>
                        ) : (
                          <span className="text-neutral-400">(pending)</span>
                        )}
                      </div>
                    </details>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
