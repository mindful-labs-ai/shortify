import { useCallback, useEffect, useRef, useState } from "react";
import ConfigPanel from "./components/ConfigPanel";
import EventsPanel from "./components/EventsPanel";
import JobDetailPanel from "./components/JobDetailPanel";
import JobsPanel from "./components/JobsPanel";
import PromptsPanel from "./components/PromptsPanel";
import QueuePanel from "./components/QueuePanel";
import StatBar from "./components/StatBar";
import TracesPanel from "./components/TracesPanel";
import { fetchState } from "./lib/api";
import type { AdminState } from "./types";

const LS_BASE = "shortify.admin.baseUrl";
const LS_TAB = "shortify.admin.tab";

type Tab = "dashboard" | "prompts";
type Status = { kind: "idle" | "ok" | "err"; msg: string };

export default function App() {
  const [baseUrl, setBaseUrl] = useState(
    () => localStorage.getItem(LS_BASE) ?? "",
  );
  const [tab, setTab] = useState<Tab>(
    () => (localStorage.getItem(LS_TAB) as Tab | null) ?? "dashboard",
  );
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [data, setData] = useState<AdminState | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle", msg: "Idle" });
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchState(baseUrl);
      setData(next);
      setStatus({ kind: "ok", msg: `OK ${new Date().toLocaleTimeString()}` });
    } catch (e) {
      setStatus({ kind: "err", msg: `Err: ${(e as Error).message}` });
    }
  }, [baseUrl]);

  const connect = () => {
    localStorage.setItem(LS_BASE, baseUrl.trim());
    refresh();
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    localStorage.setItem(LS_TAB, next);
  };

  useEffect(() => {
    if (timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
    // 폴링은 dashboard 탭에서만 — prompts 편집 중에 깜빡임/네트워크 노이즈 방지
    if (autoRefresh && tab === "dashboard") {
      timer.current = window.setInterval(refresh, 3000);
    }
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [autoRefresh, baseUrl, refresh, tab]);

  // initial fetch when previously-saved values exist
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusColor =
    status.kind === "ok"
      ? "bg-emerald-200"
      : status.kind === "err"
        ? "bg-rose-200"
        : "bg-neutral-200";

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-3">
          <h1 className="text-sm font-semibold tracking-tight">
            Shortify · Admin
          </h1>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="Base URL (leave empty to use Vite proxy → sidecar)"
            className="w-72 rounded-md border border-neutral-300 px-2 py-1 text-xs outline-none focus:border-neutral-900"
          />
          <button
            type="button"
            onClick={connect}
            className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white"
          >
            Connect
          </button>
          <label className="ml-auto flex items-center gap-2 text-xs text-neutral-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto refresh (3s)
          </label>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] ${statusColor}`}
          >
            {status.msg}
          </span>
        </div>
      </header>

      <nav className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl gap-1 px-6">
          {(["dashboard", "prompts"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={[
                "border-b-2 px-3 py-2 text-xs font-medium transition",
                tab === t
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-800",
              ].join(" ")}
            >
              {t === "dashboard" ? "Dashboard" : "Prompts"}
            </button>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {tab === "dashboard" ? (
          data ? (
            <>
              <StatBar data={data} />
              <ConfigPanel config={data.config} />

              {selectedJobId ? (
                <div className="mt-6">
                  <JobDetailPanel
                    baseUrl={baseUrl}
                    jobId={selectedJobId}
                    pollMs={autoRefresh ? 3000 : 0}
                    onClose={() => setSelectedJobId(null)}
                  />
                </div>
              ) : null}

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <JobsPanel
                  jobs={data.jobs}
                  selectedJobId={selectedJobId}
                  onSelect={(id) =>
                    setSelectedJobId((cur) => (cur === id ? null : id))
                  }
                />
                <div className="flex flex-col gap-6">
                  <QueuePanel
                    tasks={data.queue.recent}
                    selectedJobId={selectedJobId}
                  />
                  <EventsPanel
                    events={data.events}
                    selectedJobId={selectedJobId}
                  />
                </div>
              </div>

              <div className="mt-6">
                <TracesPanel
                  traces={data.traces ?? []}
                  selectedJobId={selectedJobId}
                />
              </div>
            </>
          ) : (
            <div className="mt-20 text-center text-sm text-neutral-400">
              Enter the sidecar Base URL, then Connect.
            </div>
          )
        ) : (
          <PromptsPanel baseUrl={baseUrl} />
        )}
      </div>
    </main>
  );
}
