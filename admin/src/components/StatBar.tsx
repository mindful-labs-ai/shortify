import type { AdminState } from "../types";

type Props = { data: AdminState };

export default function StatBar({ data }: Props) {
  const c = data.queue.counts;
  const cells: [string, number, string][] = [
    ["Pending", c.pending, "bg-neutral-100"],
    ["Running", c.running, "bg-amber-100"],
    ["Done", c.done, "bg-emerald-100"],
    ["Failed", c.failed, "bg-rose-100"],
    ["Total jobs", data.jobs.length, "bg-sky-100"],
  ];
  return (
    <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
      {cells.map(([label, n, cls]) => (
        <div key={label} className={`rounded-2xl ${cls} p-4`}>
          <div className="text-[11px] uppercase tracking-wider text-neutral-500">{label}</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">{n}</div>
        </div>
      ))}
    </section>
  );
}
