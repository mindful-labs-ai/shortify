import { CSSProperties } from "react";

interface ThumbPlaceholderProps {
  width?: number;
  label?: string;
  tone?: "neutral" | "coral";
  style?: CSSProperties;
}

export default function ThumbPlaceholder({
  width = 44,
  label,
  tone = "neutral",
}: ThumbPlaceholderProps) {
  const bg =
    tone === "coral"
      ? "repeating-linear-gradient(135deg, var(--coral-50) 0 6px, var(--coral-100) 6px 12px)"
      : "repeating-linear-gradient(135deg, var(--cloud) 0 6px, var(--warm-100) 6px 12px)";
  return (
    <div
      style={{
        width,
        aspectRatio: "9 / 16",
        borderRadius: 6,
        border: "1.5px solid var(--ink-soft)",
        background: bg,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 1px 0 var(--ink-soft)",
      }}
    >
      {label && (
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "var(--cream)",
            padding: "2px 5px",
            borderRadius: 3,
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "var(--ink-mute)",
            border: "1px solid var(--hairline)",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
