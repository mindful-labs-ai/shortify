import type { AdminJob } from "../types";
import { STAGE_LABEL, stageColor } from "../types";

export default function JobsPanel({ jobs }: { jobs: AdminJob[] }) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2">
        <h2 className="text-sm font-medium">Jobs (latest 50)</h2>
        <span className="text-xs text-neutral-500">{jobs.length} rows</span>
      </div>
      <div className="max-h-[640px] divide-y divide-neutral-100 overflow-auto text-sm">
        {jobs.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-neutral-400">No jobs yet</div>
        ) : (
          jobs.map((j) => (
            <div key={j.id} className={`px-4 py-3 ${j.deleted_at ? "opacity-50" : ""}`}>
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-block w-24 shrink-0 rounded-full ${stageColor(j.stage)} px-2 py-0.5 text-center text-[11px] font-medium tabular-nums`}
                >
                  {STAGE_LABEL[j.stage] ?? `stage ${j.stage}`}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{j.title}</div>
                  <div className="mt-0.5 truncate text-xs text-neutral-500">
                    <code className="text-[10px]">{j.id}</code>
                    {j.concept ? ` · ${j.concept}` : ""}
                    {j.duration_ms ? ` · ${(j.duration_ms / 1000).toFixed(1)}s` : ""}
                    {j.deleted_at ? " · 🗑 trashed" : ""}
                  </div>
                  {j.error ? (
                    <div className="mt-1 line-clamp-2 text-xs text-rose-600">{j.error}</div>
                  ) : j.stage_message ? (
                    <div className="mt-1 truncate text-xs text-neutral-600">{j.stage_message}</div>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
