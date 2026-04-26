import { useCallback, useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import VideoPlayer from "../components/VideoPlayer";
import { api } from "../lib/api";
import { tauri } from "../lib/tauri";
import { useAppStore } from "../store";

function thumbnailFor(videoPath: string): string {
  const dir = videoPath.replace(/\/[^/]+$/, "");
  return convertFileSrc(`${dir}/images/scene_000.png`);
}

export default function VideoLibrary() {
  const jobs = useAppStore((s) => s.jobs);
  const setJobs = useAppStore((s) => s.setJobs);
  const [playing, setPlaying] = useState<string | null>(null);

  const refresh = useCallback(
    () => api.listJobs().then((r) => setJobs(r.jobs)).catch(() => undefined),
    [setJobs],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const done = jobs.filter((j) => j.stage === 9 && j.output_video_path);

  return (
    <div className="mx-auto max-w-5xl p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
          <p className="mt-1 text-sm text-neutral-500">{done.length} videos</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Refresh
        </button>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {done.map((j) => (
          <div
            key={j.id}
            className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => setPlaying(j.output_video_path!)}
              className="relative block aspect-[9/16] w-full overflow-hidden bg-neutral-900 text-white"
            >
              <img
                src={thumbnailFor(j.output_video_path!)}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-3xl opacity-70 transition group-hover:opacity-100">
                ▶
              </span>
            </button>
            <div className="space-y-2 p-3">
              <div className="truncate text-sm font-medium">{j.toc_section_title}</div>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <button
                  type="button"
                  onClick={() => tauri.openInFinder(j.output_video_path!).catch(() => undefined)}
                  className="rounded-full border border-neutral-200 px-2 py-0.5 hover:border-neutral-400"
                >
                  Show in Finder
                </button>
                <button
                  type="button"
                  onClick={() => api.deleteJob(j.id).then(refresh)}
                  className="rounded-full border border-neutral-200 px-2 py-0.5 hover:border-rose-400 hover:text-rose-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {done.length === 0 ? (
          <div className="col-span-full py-20 text-center text-sm text-neutral-500">
            No videos yet. Drop a PDF to start.
          </div>
        ) : null}
      </div>

      {playing ? (
        <VideoPlayer src={convertFileSrc(playing)} onClose={() => setPlaying(null)} />
      ) : null}
    </div>
  );
}
