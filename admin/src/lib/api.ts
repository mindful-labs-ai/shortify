import type { AdminJobDetail, AdminPrompt, AdminState } from "../types";

function normalize(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

async function jsonOrThrow<T>(res: Response, url: string): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${body ? ` — ${body}` : ""}`);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    throw new Error(
      `Expected JSON from ${url} but got '${ct || "unknown"}' — is Base URL pointing at the sidecar (default http://127.0.0.1:51234)?`,
    );
  }
  return (await res.json()) as T;
}

export async function fetchState(baseUrl: string): Promise<AdminState> {
  const url = `${normalize(baseUrl)}/admin/state`;
  return jsonOrThrow<AdminState>(await fetch(url), url);
}

export async function fetchJobDetail(
  baseUrl: string,
  jobId: string,
): Promise<AdminJobDetail> {
  const url = `${normalize(baseUrl)}/admin/jobs/${encodeURIComponent(jobId)}`;
  return jsonOrThrow<AdminJobDetail>(await fetch(url), url);
}

export async function fetchPrompts(baseUrl: string): Promise<AdminPrompt[]> {
  const url = `${normalize(baseUrl)}/admin/prompts`;
  const data = await jsonOrThrow<{ prompts: AdminPrompt[] }>(await fetch(url), url);
  return data.prompts;
}

export async function updatePrompt(
  baseUrl: string,
  key: string,
  body: { template: string; description?: string | null; variables?: string[] | null },
): Promise<AdminPrompt> {
  const url = `${normalize(baseUrl)}/admin/prompts/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow<AdminPrompt>(res, url);
}

export async function resetPrompt(baseUrl: string, key: string): Promise<AdminPrompt> {
  const url = `${normalize(baseUrl)}/admin/prompts/${encodeURIComponent(key)}/reset`;
  const res = await fetch(url, { method: "POST" });
  return jsonOrThrow<AdminPrompt>(res, url);
}
