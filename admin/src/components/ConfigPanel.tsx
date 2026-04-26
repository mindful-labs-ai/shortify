import type { AdminConfig } from "../types";

export default function ConfigPanel({ config }: { config: AdminConfig }) {
  return (
    <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 text-xs text-neutral-600">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <div>
          <span className="text-neutral-400">data_dir:</span>{" "}
          <code>{config.data_dir}</code>
        </div>
        <div>
          <span className="text-neutral-400">workers:</span> {config.n_workers}
        </div>
        <div>
          <span className="text-neutral-400">scenes/job:</span>{" "}
          <span
            className={config.test_mode ? "font-medium text-amber-700" : ""}
          >
            {config.scene_count}
            {config.test_mode ? " (TEST)" : ""}
          </span>
        </div>
        <div>
          <span className="text-neutral-400">clip duration:</span>{" "}
          {config.video_duration_sec}s
        </div>
        <div>
          <span className="text-neutral-400">gemini key:</span>{" "}
          <span className={config.gemini_key_set ? "text-emerald-700" : "text-rose-700"}>
            {config.gemini_key_set ? "set ✓" : "MISSING"}
          </span>
        </div>
        <div>
          <span className="text-neutral-400">text:</span> {config.model_text}
        </div>
        <div>
          <span className="text-neutral-400">image:</span> {config.model_image}
        </div>
        <div>
          <span className="text-neutral-400">video:</span> {config.model_video}
        </div>
        <div>
          <span className="text-neutral-400">tts:</span> {config.model_tts}
        </div>
        <div>
          <span className="text-neutral-400">audio:</span> {config.model_audio}
        </div>
      </div>
    </section>
  );
}
