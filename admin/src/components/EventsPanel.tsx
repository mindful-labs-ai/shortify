import type { AdminEvent } from "../types";
import { STAGE_LABEL, stageColor } from "../types";

type Props = {
  events: AdminEvent[];
  selectedJobId: string | null;
};

export default function EventsPanel({ events, selectedJobId }: Props) {
  // events come newest-first from server. For the per-job timeline view we
  // reverse to oldest-first so the stage progression reads top-down.
  const filtered = selectedJobId
    ? [...events].filter((e) => e.job_id === selectedJobId).reverse()
    : events;
  const showTimeline = !!selectedJobId;

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2">
        <h2 className="text-sm font-medium">
          {showTimeline ? "Stage timeline" : "Events (latest 100)"}
          {selectedJobId ? (
            <span className="ml-2 text-[11px] font-normal text-neutral-500">
              · job <code>{selectedJobId.slice(0, 8)}</code>
            </span>
          ) : null}
        </h2>
        <span className="text-xs text-neutral-500">
          {filtered.length}
          {selectedJobId ? `/${events.length}` : ""} rows
        </span>
      </div>
      <div className="max-h-[400px] divide-y divide-neutral-100 overflow-auto text-xs">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-neutral-400">
            {selectedJobId ? "no events for this job" : "no events"}
          </div>
        ) : (
          filtered.map((e, i) => {
            const t = new Date(e.created_at);
            const time = t.toLocaleTimeString();
            const delta =
              showTimeline && i > 0
                ? (t.getTime() -
                    new Date(filtered[i - 1].created_at).getTime()) /
                  1000
                : null;
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-1.5">
                <span className="w-16 shrink-0 text-[10px] tabular-nums text-neutral-400">
                  {time}
                </span>
                <span
                  className={`inline-block w-20 shrink-0 rounded-full ${stageColor(e.stage)} px-1.5 py-0.5 text-center text-[10px] font-medium`}
                >
                  {STAGE_LABEL[e.stage] ?? `stage ${e.stage}`}
                </span>
                <span className="min-w-0 flex-1 truncate text-neutral-600">
                  {!showTimeline ? (
                    <code className="text-[10px] text-neutral-400">
                      {e.job_id.slice(0, 6)}
                    </code>
                  ) : null}
                  {!showTimeline ? " " : ""}
                  {e.message ?? ""}
                </span>
                {delta !== null ? (
                  <span className="shrink-0 text-[10px] tabular-nums text-neutral-400">
                    +{delta.toFixed(1)}s
                  </span>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
