import { useEffect, useState } from "react";
import { fetchJobDetail } from "../lib/api";
import type { AdminJobDetail, TimelineEntry } from "../types";
import { STAGE_LABEL, stageColor } from "../types";

type Props = {
  baseUrl: string;
  jobId: string;
  /** dashboard 폴링 주기(ms) — 끄려면 0 */
  pollMs?: number;
  onClose: () => void;
};

const SOURCE_BADGE: Record<string, string> = {
  event: "bg-sky-100 text-sky-800",
  task: "bg-violet-100 text-violet-800",
  trace: "bg-amber-100 text-amber-800",
};

function describe(e: TimelineEntry): string {
  if (e.source === "event") {
    return `stage ${e.stage}${e.message ? ` — ${e.message}` : ""}`;
  }
  if (e.source === "task") {
    const parts: string[] = [];
    if (e.task_type) parts.push(e.task_type);
    if (e.transition) parts.push(e.transition);
    if (e.worker_id) parts.push(`worker=${e.worker_id}`);
    if (e.error) parts.push(`error=${e.error}`);
    return parts.join(" · ");
  }
  const parts: string[] = [];
  if (e.kind) parts.push(e.kind);
  if (e.model) parts.push(e.model);
  if (e.status) parts.push(e.status);
  if (e.duration_ms != null) parts.push(`${e.duration_ms}ms`);
  if (e.error) parts.push(`error=${e.error}`);
  return parts.join(" · ");
}

export default function JobDetailPanel({
  baseUrl,
  jobId,
  pollMs = 3000,
  onClose,
}: Props) {
  const [data, setData] = useState<AdminJobDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const tick = async () => {
      try {
        const next = await fetchJobDetail(baseUrl, jobId);
        if (!cancelled) {
          setData(next);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    };

    setData(null);
    setErr(null);
    tick();
    if (pollMs > 0) {
      timer = window.setInterval(tick, pollMs);
    }
    return () => {
      cancelled = true;
      if (timer != null) window.clearInterval(timer);
    };
  }, [baseUrl, jobId, pollMs]);

  return (
    <section className="rounded-2xl border border-neutral-300 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2">
        <h2 className="text-sm font-medium">
          Job timeline
          {data ? (
            <code className="ml-2 text-[11px] font-normal text-neutral-500">
              {data.job.id}
            </code>
          ) : null}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-neutral-500 hover:text-neutral-900"
        >
          Close
        </button>
      </div>

      {err ? (
        <div className="p-4 text-sm text-rose-700">Failed: {err}</div>
      ) : !data ? (
        <div className="p-4 text-sm text-neutral-500">Loading…</div>
      ) : (
        <>
          {/* header summary */}
          <div className="grid grid-cols-1 gap-3 border-b border-neutral-200 p-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-neutral-400">
                Section
              </div>
              <div className="truncate font-medium">
                #{data.job.toc_section_index} · {data.job.toc_section_title}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-neutral-400">
                Stage
              </div>
              <span
                className={`inline-block rounded-full ${stageColor(data.job.stage)} px-2 py-0.5 text-[11px] font-medium`}
              >
                {STAGE_LABEL[data.job.stage] ?? `stage ${data.job.stage}`}
              </span>
              {data.job.stage_message ? (
                <span className="ml-2 text-neutral-500">
                  {data.job.stage_message}
                </span>
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-neutral-400">
                PDF
              </div>
              <div className="truncate" title={data.pdf?.filename ?? ""}>
                {data.pdf?.filename ?? "—"}
                {data.pdf?.page_count
                  ? ` · ${data.pdf.page_count}p`
                  : ""}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-neutral-400">
                Linked
              </div>
              <div className="tabular-nums">
                <span className="mr-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-sky-400 align-middle" />{" "}
                  {data.events.length} events
                </span>
                <span className="mr-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-violet-400 align-middle" />{" "}
                  {data.queue_tasks.length} tasks
                </span>
                <span>
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400 align-middle" />{" "}
                  {data.traces.length} traces
                </span>
              </div>
            </div>
          </div>

          {/* concept beats (if present) */}
          {data.job.image_concept_slug ? (
            <div className="border-b border-neutral-100 px-4 py-2 text-xs text-neutral-500">
              concept: <code>{data.job.image_concept_slug}</code>
              {data.job.duration_ms
                ? ` · total ${(data.job.duration_ms / 1000).toFixed(1)}s`
                : ""}
              {data.job.output_video_path ? (
                <>
                  {" · output: "}
                  <code className="break-all text-[11px]">
                    {data.job.output_video_path}
                  </code>
                </>
              ) : null}
            </div>
          ) : null}

          {data.job.error ? (
            <div className="border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-800">
              {data.job.error}
            </div>
          ) : null}

          {/* timeline */}
          <div className="max-h-[560px] overflow-auto">
            <ol className="divide-y divide-neutral-100 text-xs">
              {data.timeline.length === 0 ? (
                <li className="px-4 py-6 text-center text-neutral-400">
                  no timeline entries yet
                </li>
              ) : (
                data.timeline.map((e, i) => (
                  <li
                    key={`${e.source}-${e.ref_id}-${e.transition ?? e.stage ?? i}-${e.ts}`}
                    className="flex items-start gap-3 px-4 py-2"
                  >
                    <time
                      className="w-28 shrink-0 tabular-nums text-neutral-500"
                      title={e.ts}
                    >
                      {new Date(e.ts).toLocaleTimeString()}
                    </time>
                    <span
                      className={`mt-0.5 w-14 shrink-0 rounded-full px-2 py-0.5 text-center text-[10px] font-medium ${SOURCE_BADGE[e.source] ?? "bg-neutral-100"}`}
                    >
                      {e.source}
                    </span>
                    <div className="min-w-0 flex-1 break-words">
                      {describe(e)}
                    </div>
                    <span className="shrink-0 text-[10px] text-neutral-400">
                      #{e.ref_id}
                    </span>
                  </li>
                ))
              )}
            </ol>
          </div>
        </>
      )}
    </section>
  );
}
