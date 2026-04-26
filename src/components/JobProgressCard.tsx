import type { Job } from "../lib/api";

const STAGE_LABELS: Record<number, string> = {
  [-1]: "Failed",
  0: "Queued",
  1: "Extracting section",
  2: "Conceptizing",
  3: "Awaiting image choice",
  4: "Generating images",
  5: "Generating clips",
  6: "Generating narration",
  7: "Aligning words",
  8: "Composing",
  9: "Done",
};

const STAGE_TOTAL = 9;

type Props = {
  job: Job;
  onClick?: (job: Job) => void;
};

export default function JobProgressCard({ job, onClick }: Props) {
  const stage = job.stage;
  const failed = stage === -1;
  const done = stage === 9;
  const pct = failed ? 0 : Math.max(2, Math.min(100, (stage / STAGE_TOTAL) * 100));

  return (
    <button
      type="button"
      onClick={() => onClick?.(job)}
      className="block w-full rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm transition hover:border-neutral-400"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{job.toc_section_title}</div>
          <div className="mt-1 truncate text-xs text-neutral-500">
            {STAGE_LABELS[stage] ?? `stage ${stage}`}
            {job.stage_message ? ` — ${job.stage_message}` : ""}
          </div>
        </div>
        <span
          className={[
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            done ? "bg-emerald-100 text-emerald-800" :
            failed ? "bg-rose-100 text-rose-800" :
            "bg-neutral-100 text-neutral-700",
          ].join(" ")}
        >
          {done ? "Done" : failed ? "Failed" : `${stage}/${STAGE_TOTAL}`}
        </span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div
          className={[
            "h-full rounded-full transition-[width] duration-500 ease-out",
            failed ? "bg-rose-500" : done ? "bg-emerald-500" : "bg-neutral-900",
          ].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>

      {failed && job.error ? (
        <div className="mt-3 line-clamp-2 text-xs text-rose-600">{job.error}</div>
      ) : null}
    </button>
  );
}
