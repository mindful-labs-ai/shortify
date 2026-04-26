import React from "react";

interface Step {
  label: string;
}

interface StepIndicatorProps {
  current: number;
  steps?: Step[];
}

const DEFAULT_STEPS: Step[] = [
  { label: "Upload PDF" },
  { label: "Pick sections" },
  { label: "Choose narrator" },
  { label: "Generate" },
];

export default function StepIndicator({ current, steps = DEFAULT_STEPS }: StepIndicatorProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      {steps.map((s, i) => {
        const num = i + 1;
        const isActive = num === current;
        const isDone = num < current;
        return (
          <React.Fragment key={num}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px 6px 6px",
                borderRadius: 999,
                background: isActive ? "var(--coral-500)" : isDone ? "var(--cream)" : "transparent",
                border: isActive
                  ? "1.5px solid var(--coral-500)"
                  : isDone
                  ? "1.5px solid var(--mint-500)"
                  : "1.5px solid var(--hairline-strong)",
                color: isActive ? "var(--cream)" : isDone ? "var(--mint-900)" : "var(--ink-mute)",
                fontSize: 12,
                fontWeight: 700,
                boxShadow: isActive ? "3px 4px 0 var(--coral-700)" : "none",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: isActive ? "var(--cream)" : isDone ? "var(--mint-500)" : "var(--cloud)",
                  color: isActive ? "var(--coral-700)" : isDone ? "var(--cream)" : "var(--ink-mute)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 800,
                  fontSize: 11,
                }}
              >
                {isDone ? "✓" : num}
              </span>
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  width: 16,
                  height: 2,
                  background: num < current ? "var(--mint-500)" : "var(--hairline-strong)",
                  borderRadius: 1,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
