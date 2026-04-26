import type { AdminState } from "../types";

export async function fetchState(baseUrl: string, token: string): Promise<AdminState> {
  const res = await fetch(`${baseUrl}/admin/state`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return (await res.json()) as AdminState;
}
