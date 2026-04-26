import { CSSProperties } from "react";

type StatusPillStatus = "done" | "rendering" | "awaiting" | "failed";

interface StatusPillProps {
  status: StatusPillStatus;
  stageLabel?: string;
}

function pillStyle(bg: string, color: string, border: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 999,
    background: bg,
    color,
    border: `1.5px solid ${border}`,
    whiteSpace: "nowrap",
  };
}

function Dot({ color }: { color: string }) {
  return (
    <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
  );
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 0 0 ${color}`,
        animation: "shori-pulse 1.4s ease-out infinite",
      }}
    />
  );
}

export default function StatusPill({ status, stageLabel }: StatusPillProps) {
  if (status === "done") {
    return (
      <span style={pillStyle("var(--mint-50)", "var(--mint-900)", "var(--mint-500)")}>
        <Dot color="var(--mint-500)" />
        완료
      </span>
    );
  }
  if (status === "rendering") {
    return (
      <span style={pillStyle("var(--coral-50)", "var(--coral-900)", "var(--coral-300)")}>
        <PulsingDot color="var(--coral-500)" />
        {stageLabel || "만드는 중"}
      </span>
    );
  }
  if (status === "awaiting") {
    return (
      <span style={pillStyle("var(--yellow-50)", "var(--yellow-900)", "var(--yellow-500)")}>
        <Dot color="var(--yellow-500)" />
        {stageLabel || "확인 필요"}
      </span>
    );
  }
  return (
    <span style={pillStyle("var(--cloud)", "var(--ink-soft)", "var(--hairline-strong)")}>
      {stageLabel || "—"}
    </span>
  );
}
