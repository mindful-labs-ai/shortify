export type AdminConfig = {
  model_text: string;
  model_image: string;
  model_video: string;
  model_tts: string;
  model_audio: string;
  data_dir: string;
  n_workers: number;
  gemini_key_set: boolean;
};

export type QueueTaskRow = {
  id: number;
  type: string;
  status: "pending" | "running" | "done" | "failed";
  attempts: number;
  max_attempts: number;
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  worker_id: string | null;
  error: string | null;
  payload: Record<string, unknown>;
};

export type AdminEvent = {
  job_id: string;
  stage: number;
  message: string | null;
  created_at: string;
};

export type AdminJob = {
  id: string;
  title: string;
  section_index: number;
  pdf_id: string;
  stage: number;
  stage_message: string | null;
  error: string | null;
  concept: string | null;
  output_video_path: string | null;
  duration_ms: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminState = {
  config: AdminConfig;
  queue: {
    counts: { pending: number; running: number; done: number; failed: number };
    recent: QueueTaskRow[];
  };
  events: AdminEvent[];
  jobs: AdminJob[];
};

export const STAGE_LABEL: Record<number, string> = {
  [-1]: "Failed",
  0: "Queued",
  1: "Extracting",
  2: "Conceptizing",
  3: "Awaiting img",
  4: "Imaging",
  5: "Clipping",
  6: "Narrating",
  7: "Aligning",
  8: "Composing",
  9: "Done",
};

export function stageColor(s: number): string {
  if (s === -1) return "bg-rose-100 text-rose-700";
  if (s === 9) return "bg-emerald-100 text-emerald-700";
  if (s >= 1 && s <= 3) return "bg-amber-100 text-amber-700";
  if (s >= 4) return "bg-sky-100 text-sky-700";
  return "bg-neutral-100 text-neutral-700";
}
