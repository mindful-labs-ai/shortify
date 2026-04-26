// 사이드카 localhost API 클라이언트.
// 모든 호출은 Tauri Shell이 부팅 시 발급한 Bearer 토큰을 헤더에 포함.
// Tauri invoke('get_api_config')로 baseUrl/token 받아 초기화한다.

export type ApiConfig = { baseUrl: string; token: string };

let config: ApiConfig | null = null;

export function setApiConfig(c: ApiConfig) {
  config = c;
}

function authHeaders(): HeadersInit {
  if (!config) throw new Error("API config not initialized");
  return { Authorization: `Bearer ${config.token}` };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!config) throw new Error("API config not initialized");
  const res = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ─────────── 도메인 타입 (sidecar 스키마와 동기화) ───────────
export type TocItem = { idx: number; title: string; page_start: number; page_end: number };
export type Pdf = { id: string; filename: string; page_count: number; toc: TocItem[] };
export type ImageConcept = { slug: string; name: string; description: string; preview_url: string };
export type Job = {
  id: string;
  pdf_id: string;
  toc_section_index: number;
  toc_section_title: string;
  image_concept_slug: string | null;
  stage: number; // -1 | 0..9
  stage_message: string | null;
  output_video_path: string | null;
  error: string | null;
};

// ─────────── Endpoints ───────────
export const api = {
  health: () => request<{ ok: true }>("/health"),

  uploadPdf: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ pdf_id: string }>("/upload", { method: "POST", body: fd });
  },

  getToc: (pdfId: string) => request<Pdf>(`/pdfs/${pdfId}/toc`),

  createJobs: (pdfId: string, sections: number[]) =>
    request<{ job_ids: string[] }>("/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdf_id: pdfId, sections }),
    }),

  listJobs: () => request<{ jobs: Job[] }>("/jobs"),
  getJob: (id: string) => request<Job>(`/jobs/${id}`),

  selectImage: (id: string, slug: string) =>
    request<Job>(`/jobs/${id}/select-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_concept_slug: slug }),
    }),

  retryJob: (id: string) => request<Job>(`/jobs/${id}/retry`, { method: "POST" }),

  // Soft delete: 휴지통 이동, 파일 보존. 기본 listJobs 응답에서 제외됨.
  deleteJob: (id: string) =>
    request<{ ok: true }>(`/jobs/${id}`, { method: "DELETE" }),

  // 휴지통에서 복원 (deleted_at = NULL).
  restoreJob: (id: string) =>
    request<Job>(`/jobs/${id}/restore`, { method: "POST" }),

  // 휴지통 비우기 — 비가역 hard delete + 파일 회수.
  emptyTrash: () =>
    request<{ purged_jobs: number; purged_pdfs: number; freed_bytes: number }>(
      "/trash",
      { method: "DELETE" },
    ),

  imageConcepts: async () => {
    const r = await request<{ concepts: ImageConcept[] }>("/image-concepts");
    if (!config) throw new Error("API config not initialized");
    const base = config.baseUrl;
    return {
      concepts: r.concepts.map((c) => ({
        ...c,
        // 사이드카가 상대 경로를 보내주므로 baseUrl 을 붙여 절대 URL 로.
        preview_url: c.preview_url.startsWith("http")
          ? c.preview_url
          : `${base}${c.preview_url}`,
      })),
    };
  },

  // SSE는 sse.ts 사용 (EventSource는 헤더 못 붙이므로 토큰을 쿼리로)
  jobStreamUrl: (id: string) => {
    if (!config) throw new Error("API config not initialized");
    return `${config.baseUrl}/jobs/${id}/stream?token=${encodeURIComponent(config.token)}`;
  },
};
