import type { AdminState } from "../types";

function normalize(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

export async function fetchState(baseUrl: string): Promise<AdminState> {
  const url = `${normalize(baseUrl)}/admin/state`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    throw new Error(
      `Expected JSON from ${url} but got '${ct || "unknown"}' — is Base URL pointing at the sidecar (default http://127.0.0.1:51234)?`,
    );
  }
  return (await res.json()) as AdminState;
}
