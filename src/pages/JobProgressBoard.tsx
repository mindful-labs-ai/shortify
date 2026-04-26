import React, { useEffect, useMemo, useState } from "react";
import Shori from "@/components/brand/Shori";
import ShortifyMark from "@/components/brand/ShortifyMark";
import SpeechBubble from "@/components/brand/SpeechBubble";
import Btn from "@/components/ui/Btn";
import StepIndicator from "@/components/ui/StepIndicator";
import { api } from "../lib/api";
import { subscribeJob, type JobEvent } from "../lib/sse";
import { useAppStore } from "../store";

// ─────────────────────────────────────────────────────────────
// Stage / Phase mappings
// ─────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<number, string> = {
  [-1]: "Failed",
  0: "Waiting",
  1: "Analyzing PDF",
  2: "Extracting key concepts",
  3: "Pick an image concept",
  4: "Generating images",
  5: "Generating video clips",
  6: "Generating narration",
  7: "Aligning audio",
  8: "Composing video",
  9: "Done",
};

// Group API stages (−1..9) into 5 design phases (1..5).
// Phase 0 is a sentinel for "not yet started / failed".
const STAGE_TO_PHASE: Record<number, number> = {
  [-1]: 0,
  0: 0,
  1: 1,
  2: 1,
  3: 1,
  4: 2,
  5: 2,
  6: 3,
  7: 3,
  8: 4,
  9: 5,
};

// Each pipeline stage's [start, end) on the global 0–100 progress axis.
// Sidecar emits per-stage progress_pct only for image_gen (stage 4) and
// video_gen (stage 5); other stages have no per-stage progress signal.
// Subdividing the design phase ranges among their stages makes the global
// progress monotonic across stage transitions.
const STAGE_RANGES: Record<number, [number, number]> = {
  [-1]: [0, 0],
  0: [0, 0],
  1: [0, 6],
  2: [6, 12],
  3: [12, 18],
  4: [18, 30],
  5: [30, 42],
  6: [42, 55],
  7: [55, 68],
  8: [68, 94],
  9: [94, 100],
};

function progressForJob(stage: number, stagePct: number | undefined): number {
  if (stage === 9) return 100;
  if (stage === -1) return 0;
  const [a, b] = STAGE_RANGES[stage] ?? [0, 0];
  const pct =
    typeof stagePct === "number"
      ? Math.max(0, Math.min(100, stagePct))
      : 0;
  return a + (b - a) * (pct / 100);
}

// Design phases exactly as shown in the GeneratingView phase list.
// range is the [min, max) progress_pct range that this phase covers.
interface Phase {
  id: string;
  label: string;
  phaseNum: number; // 1..5
  range: [number, number];
}

const PHASES: Phase[] = [
  { id: "read", label: "Reading PDF", phaseNum: 1, range: [0, 18] },
  { id: "outline", label: "Writing script", phaseNum: 2, range: [18, 42] },
  { id: "voice", label: "Recording voice", phaseNum: 3, range: [42, 68] },
  { id: "render", label: "Composing video", phaseNum: 4, range: [68, 94] },
  { id: "finish", label: "Finishing up", phaseNum: 5, range: [94, 100] },
];

const PHASE_SPEECH: Record<string, string> = {
  read: "Reading the PDF page by page…",
  outline: "Slicing it into bite-sized chunks!",
  voice: "Mic check — one, two!",
  render: "Layering visuals and captions.",
  finish: "Almost there, hang tight!",
};

// ─────────────────────────────────────────────────────────────
// File-local sub-component: PhaseList
// ─────────────────────────────────────────────────────────────

function PhaseList({ progress }: { progress: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {PHASES.map((p) => {
        const done = progress >= p.range[1];
        const active = progress >= p.range[0] && progress < p.range[1];
        const pending = !done && !active;
        return (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              background: active ? "var(--coral-50)" : "var(--cream)",
              border: active
                ? "1.5px solid var(--coral-500)"
                : "1.5px solid var(--hairline-strong)",
              borderRadius: 12,
              boxShadow: active ? "3px 4px 0 var(--coral-700)" : "2px 3px 0 var(--stamp-soft)",
              opacity: pending ? 0.55 : 1,
              transition: "all 220ms",
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: done ? "var(--mint-500)" : active ? "var(--coral-500)" : "var(--cloud)",
                color: done || active ? "var(--cream)" : "var(--ink-mute)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
                fontSize: 11,
                border: "1.5px solid",
                borderColor: done
                  ? "var(--mint-900)"
                  : active
                  ? "var(--coral-700)"
                  : "var(--hairline-strong)",
                flexShrink: 0,
              }}
            >
              {done ? (
                "✓"
              ) : active ? (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--cream)",
                    animation: "pulse-dot 1s ease-in-out infinite",
                  }}
                />
              ) : (
                "·"
              )}
            </span>
            <div
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: 700,
                color: pending ? "var(--ink-mute)" : "var(--ink)",
                letterSpacing: -0.1,
              }}
            >
              {p.label}
            </div>
            {active && (
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "var(--coral-700)",
                }}
              >
                In progress
              </div>
            )}
            {done && (
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: 800,
                  color: "var(--mint-900)",
                }}
              >
                Done
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// File-local sub-component: ProgressDisplay (bar + %)
// ─────────────────────────────────────────────────────────────

function ProgressDisplay({
  progress,
  currentPhaseLabel,
}: {
  progress: number;
  currentPhaseLabel: string;
}) {
  return (
    <div
      style={{
        background: "var(--cream)",
        border: "1.5px solid var(--hairline-strong)",
        borderRadius: 16,
        padding: "16px 18px",
        boxShadow: "3px 4px 0 var(--stamp-soft)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 32,
            fontWeight: 900,
            color: "var(--coral-500)",
            letterSpacing: -0.6,
            lineHeight: 1,
          }}
        >
          {Math.round(progress)}
          <span style={{ fontSize: 18, color: "var(--coral-700)" }}>%</span>
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 800,
            color: "var(--ink-mute)",
          }}
        >
          {currentPhaseLabel}
        </div>
      </div>
      {/* Inline progress bar matching design (striped, coral) */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 18,
          borderRadius: 999,
          background: "var(--cream)",
          border: "1.5px solid var(--hairline-strong)",
          overflow: "hidden",
          boxShadow: "inset 2px 2px 0 rgba(26,22,20,0.04)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 2,
            width: `calc(${Math.round(progress)}% - 4px)`,
            minWidth: 0,
            background: "var(--coral-500)",
            borderRadius: 999,
            transition: "width 600ms cubic-bezier(.45,0,.55,1)",
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 8px, transparent 8px 18px)",
            backgroundSize: "30px 100%",
            animation: "progress-stripes 1.2s linear infinite",
            boxShadow: "0 1px 0 var(--coral-700)",
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────

export default function JobProgressBoard() {
  const pendingIds = useAppStore((s) => s.pendingJobIds);
  const jobs = useAppStore((s) => s.jobs);
  const setJobs = useAppStore((s) => s.setJobs);
  const upsertJob = useAppStore((s) => s.upsertJob);
  const setView = useAppStore((s) => s.setView);

  // Per-job stage progress_pct from SSE. We pin the stage at write time so a
  // stale value from a previous stage is never reused after the worker advances.
  const [progressMap, setProgressMap] = useState<
    Record<string, { stage: number; pct: number }>
  >({});

  // Always pull a fresh job list so the fallback (most-recent-job) works
  // when the user opens this tab without a freshly-created batch.
  useEffect(() => {
    api.listJobs().then((r) => setJobs(r.jobs)).catch(() => undefined);
  }, [setJobs]);

  // pendingIds is the user's just-created batch; if absent (direct nav from
  // the sidebar), fall back to the most recent in-progress job, then the
  // most recent job overall. listJobs is ordered created_at desc, so the
  // first match is the freshest.
  const effectiveIds = useMemo(() => {
    if (pendingIds.length > 0) return pendingIds;
    const inProgress = jobs.filter((j) => j.stage !== 9 && j.stage !== -1);
    if (inProgress.length > 0) return [inProgress[0].id];
    if (jobs.length > 0) return [jobs[0].id];
    return [];
  }, [pendingIds, jobs]);

  // Initial fetch of job state.
  useEffect(() => {
    let cancelled = false;
    Promise.all(effectiveIds.map((id) => api.getJob(id))).then((rows) => {
      if (!cancelled) rows.forEach(upsertJob);
    });
    return () => {
      cancelled = true;
    };
  }, [effectiveIds, upsertJob]);

  // SSE subscriptions — preserve progress_pct from events, refresh job state.
  useEffect(() => {
    const unsubs = effectiveIds.map((id) =>
      subscribeJob(
        api.jobStreamUrl(id),
        (e: JobEvent) => {
          // Capture progress_pct if present, pinned to the stage it belongs to.
          if (typeof e.progress_pct === "number") {
            setProgressMap((prev) => ({
              ...prev,
              [id]: { stage: e.stage, pct: e.progress_pct as number },
            }));
          }
          // Refresh full job state from REST.
          api.getJob(id).then(upsertJob).catch(() => undefined);
        },
      ),
    );
    return () => unsubs.forEach((u) => u());
  }, [effectiveIds, upsertJob]);

  const watchedJobs = jobs.filter((j) => effectiveIds.includes(j.id));
  const allDone = watchedJobs.length > 0 && watchedJobs.every((j) => j.stage === 9);

  // Aggregate global progress for display. Each job's progress is anchored to
  // its current stage's [start, end) range; SSE per-stage pct (if matching the
  // current stage) interpolates inside that range, otherwise we sit at the
  // start of the stage. This guarantees monotonic forward progress.
  const overallProgress = useMemo(() => {
    if (watchedJobs.length === 0) return 0;

    const values = watchedJobs.map((j) => {
      const entry = progressMap[j.id];
      const stagePct = entry && entry.stage === j.stage ? entry.pct : undefined;
      return progressForJob(j.stage, stagePct);
    });

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.min(99, Math.max(0, avg));
  }, [watchedJobs, progressMap]);

  // Current phase is derived from highest stage across watched jobs.
  const highestStage = useMemo(() => {
    if (watchedJobs.length === 0) return 0;
    return Math.max(...watchedJobs.map((j) => j.stage));
  }, [watchedJobs]);

  const displayProgress = allDone ? 100 : overallProgress;
  // Derive phase from the most-advanced stage rather than the averaged
  // progress so the speech bubble doesn't flicker when the average dips
  // mid-stage. Falls back to the first phase before any stage starts.
  const currentPhase = useMemo(() => {
    const phaseNum = STAGE_TO_PHASE[highestStage] ?? 0;
    return PHASES.find((p) => p.phaseNum === phaseNum) ?? PHASES[0];
  }, [highestStage]);
  const currentStageLabel = STAGE_LABELS[highestStage] ?? "Waiting";

  const phaseSpeech = allDone
    ? "All done! Check it out in the library."
    : PHASE_SPEECH[currentPhase.id] ?? PHASE_SPEECH["read"];

  const jobCountLabel =
    watchedJobs.length === 1
      ? `${watchedJobs.length} video`
      : `${watchedJobs.length} videos · avg progress`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        background: "var(--cloud)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Soft floating spark dots in background */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(circle at 12% 20%, rgba(255,107,74,0.10) 0 3px, transparent 4px)," +
            "radial-gradient(circle at 84% 30%, rgba(91,212,168,0.10) 0 2px, transparent 3px)," +
            "radial-gradient(circle at 70% 78%, rgba(255,200,61,0.12) 0 2.5px, transparent 3.5px)," +
            "radial-gradient(circle at 22% 80%, rgba(74,155,255,0.10) 0 2px, transparent 3px)",
          backgroundSize: "100% 100%",
        }}
      />

      {/* Top bar: logo + home button + step indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "20px 28px",
          gap: 16,
          position: "relative",
          zIndex: 1,
        }}
      >
        <ShortifyMark size={20} />
        <Btn variant="ghost" size="sm" onClick={() => setView("drop")} style={{ marginLeft: -6 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M 1.5 6 L 6 1.5 L 10.5 6 M 3 5 V 10 H 9 V 5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to home
          </span>
        </Btn>
        <div style={{ flex: 1 }} />
        <StepIndicator current={4} />
        <div style={{ flex: 1 }} />
        <div style={{ width: 140 }} />
      </div>

      {/* Center hero */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 40px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 920,
            display: "grid",
            gridTemplateColumns: "minmax(0, 320px) minmax(0, 1fr)",
            gap: 40,
            alignItems: "center",
          }}
        >
          {/* Left: character + speech bubble */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
            }}
          >
            <SpeechBubble key={currentPhase.id} text={phaseSpeech} />
            <div
              style={{
                position: "relative",
                padding: "14px 20px 0",
                background: "var(--cream)",
                border: "1.5px solid var(--hairline-strong)",
                borderRadius: 22,
                boxShadow: "4px 5px 0 var(--stamp-soft), 0 12px 28px rgba(26,22,20,0.06)",
              }}
            >
              {/* Spotlight wash behind Shori */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 22,
                  background:
                    "radial-gradient(ellipse at 50% 70%, rgba(255,107,74,0.18) 0%, transparent 65%)",
                  pointerEvents: "none",
                }}
              />
              <Shori size={240} pose="wave" />
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--ink-mute)",
                letterSpacing: -0.1,
              }}
            >
              <span style={{ color: "var(--coral-700)" }}>Shori</span> is making your video
            </div>
          </div>

          {/* Right: headline + progress + phase list + all-done CTA */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.7,
                  textTransform: "uppercase",
                  color: "var(--coral-700)",
                  marginBottom: 6,
                }}
              >
                {jobCountLabel}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 36,
                  fontWeight: 900,
                  letterSpacing: -1.0,
                  color: "var(--ink)",
                  lineHeight: 1.1,
                  textWrap: "balance",
                } as React.CSSProperties}
              >
                {allDone ? (
                  <>
                    Your <span style={{ color: "var(--mint-500)" }}>video</span> is ready!
                  </>
                ) : (
                  <>
                    Making your <span style={{ color: "var(--coral-500)" }}>video</span>…
                  </>
                )}
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  color: "var(--ink-soft)",
                  lineHeight: 1.55,
                }}
              >
                {allDone
                  ? "All videos are ready. Check them out in the library."
                  : "You can close the window — we'll keep working in the background and let you know when it's done."}
              </div>
            </div>

            {/* Progress bar card */}
            <ProgressDisplay
              progress={displayProgress}
              currentPhaseLabel={allDone ? "Done" : currentStageLabel}
            />

            {/* Phase list */}
            <PhaseList progress={displayProgress} />

            {/* All-done CTA */}
            {allDone && (
              <div style={{ display: "flex", justifyContent: "flex-start", paddingTop: 4 }}>
                <Btn variant="primary" size="lg" onClick={() => setView("library")}>
                  Open library →
                </Btn>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "18px 28px 22px",
          fontSize: 12,
          color: "var(--ink-mute)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {!allDone && (
          <>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--coral-500)",
                animation: "pulse-dot 1.4s ease-in-out infinite",
              }}
            />
            Running in background · we'll notify you when done
          </>
        )}
        {allDone && (
          <span style={{ color: "var(--mint-900)", fontWeight: 700 }}>
            ✓ All jobs complete
          </span>
        )}
      </div>
    </div>
  );
}
