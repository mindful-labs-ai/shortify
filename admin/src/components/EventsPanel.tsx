import type { AdminEvent } from "../types";
import { STAGE_LABEL, stageColor } from "../types";

export default function EventsPanel({ events }: { events: AdminEvent[] }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2">
        <h2 className="text-sm font-medium">Events (latest 100)</h2>
        <span className="text-xs text-neutral-500">{events.length} rows</span>
      </div>
      <div className="max-h-[400px] divide-y divide-neutral-100 overflow-auto text-xs">
        {events.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-neutral-400">no events</div>
        ) : (
          events.map((e, i) => {
            const t = new Date(e.created_at).toLocaleTimeString();
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-1.5">
                <span className="w-16 shrink-0 text-[10px] tabular-nums text-neutral-400">
                  {t}
                </span>
                <span
                  className={`inline-block w-20 shrink-0 rounded-full ${stageColor(e.stage)} px-1.5 py-0.5 text-center text-[10px] font-medium`}
                >
                  {STAGE_LABEL[e.stage] ?? `stage ${e.stage}`}
                </span>
                <span className="truncate text-neutral-600">
                  <code className="text-[10px] text-neutral-400">{e.job_id.slice(0, 6)}</code>{" "}
                  {e.message ?? ""}
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
