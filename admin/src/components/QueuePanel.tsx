import type { QueueTaskRow } from "../types";

const STATUS_COLOR: Record<QueueTaskRow["status"], string> = {
  pending: "bg-neutral-100 text-neutral-700",
  running: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
};

type Props = {
  tasks: QueueTaskRow[];
  selectedJobId: string | null;
};

function payloadJobId(p: Record<string, unknown>): string | null {
  const v = p["job_id"];
  return typeof v === "string" ? v : null;
}

export default function QueuePanel({ tasks, selectedJobId }: Props) {
  const filtered = selectedJobId
    ? tasks.filter((t) => payloadJobId(t.payload) === selectedJobId)
    : tasks;
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2">
        <h2 className="text-sm font-medium">
          Queue (latest 30)
          {selectedJobId ? (
            <span className="ml-2 text-[11px] font-normal text-neutral-500">
              · job <code>{selectedJobId.slice(0, 8)}</code>
            </span>
          ) : null}
        </h2>
        <span className="text-xs text-neutral-500">
          {filtered.length}
          {selectedJobId ? `/${tasks.length}` : ""} rows
        </span>
      </div>
      <div className="max-h-[300px] divide-y divide-neutral-100 overflow-auto text-xs">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-neutral-400">
            {selectedJobId ? "no queue tasks for this job" : "empty"}
          </div>
        ) : (
          filtered.map((t) => {
            const jid = payloadJobId(t.payload);
            return (
              <div key={t.id} className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-16 rounded-full ${STATUS_COLOR[t.status]} px-2 py-0.5 text-center text-[10px] font-medium`}
                  >
                    {t.status}
                  </span>
                  <span className="font-medium">{t.type}</span>
                  <span className="text-neutral-400">#{t.id}</span>
                  <span className="text-neutral-400">
                    attempt {t.attempts}/{t.max_attempts}
                  </span>
                  {t.worker_id ? (
                    <span className="text-neutral-400">{t.worker_id}</span>
                  ) : null}
                  {jid && !selectedJobId ? (
                    <span className="ml-auto text-[10px] text-neutral-400">
                      job <code>{jid.slice(0, 6)}</code>
                    </span>
                  ) : null}
                </div>
                {t.error ? (
                  <div className="mt-1 line-clamp-1 text-rose-600">
                    {t.error}
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
