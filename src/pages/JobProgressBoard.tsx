import { useEffect } from "react";
import JobProgressCard from "../components/JobProgressCard";
import { api } from "../lib/api";
import { subscribeJob } from "../lib/sse";
import { useAppStore } from "../store";

export default function JobProgressBoard() {
  const pendingIds = useAppStore((s) => s.pendingJobIds);
  const jobs = useAppStore((s) => s.jobs);
  const upsertJob = useAppStore((s) => s.upsertJob);
  const setView = useAppStore((s) => s.setView);

  useEffect(() => {
    let cancelled = false;
    Promise.all(pendingIds.map((id) => api.getJob(id))).then((rows) => {
      if (!cancelled) rows.forEach(upsertJob);
    });
    return () => {
      cancelled = true;
    };
  }, [pendingIds, upsertJob]);

  useEffect(() => {
    const unsubs = pendingIds.map((id) =>
      subscribeJob(api.jobStreamUrl(id), () => {
        api.getJob(id).then(upsertJob).catch(() => undefined);
      }),
    );
    return () => unsubs.forEach((u) => u());
  }, [pendingIds, upsertJob]);

  const watchedJobs = jobs.filter((j) => pendingIds.includes(j.id));
  const allDone = watchedJobs.length > 0 && watchedJobs.every((j) => j.stage === 9);

  return (
    <div className="mx-auto max-w-3xl p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Generation in progress</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {watchedJobs.length} videos · ~10–12 min each
          </p>
        </div>
        {allDone ? (
          <button
            type="button"
            onClick={() => setView("library")}
            className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white"
          >
            Open library →
          </button>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {watchedJobs.map((j) => (
          <JobProgressCard key={j.id} job={j} />
        ))}
      </div>
    </div>
  );
}
