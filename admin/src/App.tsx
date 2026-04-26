import { useCallback, useEffect, useRef, useState } from "react";
import ConfigPanel from "./components/ConfigPanel";
import EventsPanel from "./components/EventsPanel";
import JobsPanel from "./components/JobsPanel";
import QueuePanel from "./components/QueuePanel";
import StatBar from "./components/StatBar";
import { fetchState } from "./lib/api";
import type { AdminState } from "./types";

const LS_BASE = "shortify.admin.baseUrl";
const LS_TOKEN = "shortify.admin.token";

type Status = { kind: "idle" | "ok" | "err"; msg: string };

export default function App() {
  const [baseUrl, setBaseUrl] = useState(() => localStorage.getItem(LS_BASE) ?? "");
  const [token, setToken] = useState(() => localStorage.getItem(LS_TOKEN) ?? "");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [data, setData] = useState<AdminState | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle", msg: "Idle" });
  const timer = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    if (!baseUrl || !token) {
      setStatus({ kind: "err", msg: "Need URL + token" });
      return;
    }
    try {
      const next = await fetchState(baseUrl, token);
      setData(next);
      setStatus({ kind: "ok", msg: `OK ${new Date().toLocaleTimeString()}` });
    } catch (e) {
      setStatus({ kind: "err", msg: `Err: ${(e as Error).message}` });
    }
  }, [baseUrl, token]);

  const connect = () => {
    localStorage.setItem(LS_BASE, baseUrl.trim());
    localStorage.setItem(LS_TOKEN, token.trim());
    refresh();
  };

  useEffect(() => {
    if (timer.current) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
    if (autoRefresh && baseUrl && token) {
      timer.current = window.setInterval(refresh, 3000);
    }
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [autoRefresh, baseUrl, token, refresh]);

  // initial fetch when previously-saved values exist
  useEffect(() => {
    if (baseUrl && token) refresh();
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
          <h1 className="text-sm font-semibold tracking-tight">Shortify · Admin</h1>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="Base URL — http://127.0.0.1:51234"
            className="w-72 rounded-md border border-neutral-300 px-2 py-1 text-xs outline-none focus:border-neutral-900"
          />
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Bearer token"
            className="w-56 rounded-md border border-neutral-300 px-2 py-1 text-xs outline-none focus:border-neutral-900"
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
          <span className={`rounded-full px-2 py-0.5 text-[11px] ${statusColor}`}>
            {status.msg}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {data ? (
          <>
            <StatBar data={data} />
            <ConfigPanel config={data.config} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <JobsPanel jobs={data.jobs} />
              <div className="flex flex-col gap-6">
                <QueuePanel tasks={data.queue.recent} />
                <EventsPanel events={data.events} />
              </div>
            </div>
          </>
        ) : (
          <div className="mt-20 text-center text-sm text-neutral-400">
            Enter the sidecar Base URL + Bearer token, then Connect.
          </div>
        )}
      </div>
    </main>
  );
}
