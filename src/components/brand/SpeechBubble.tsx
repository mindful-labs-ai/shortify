import { useState, useEffect } from "react";

interface SpeechBubbleProps {
  text: string;
}

export default function SpeechBubble({ text }: SpeechBubbleProps) {
  const [phase, setPhase] = useState<"typing" | "shown">("typing");

  useEffect(() => {
    setPhase("typing");
    const t = setTimeout(() => setPhase("shown"), 700);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <div
      style={{
        position: "relative",
        background: "var(--cream)",
        border: "1.5px solid var(--hairline-strong)",
        borderRadius: 16,
        boxShadow: "3px 4px 0 var(--stamp-soft), 0 8px 18px rgba(26,22,20,0.05)",
        padding: "12px 14px",
        minHeight: 48,
        display: "flex",
        alignItems: "center",
        animation: "bubble-pop 220ms cubic-bezier(.2,.9,.3,1.4) both",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 30,
          bottom: -9,
          width: 16,
          height: 16,
          background: "var(--cream)",
          borderRight: "1.5px solid var(--hairline-strong)",
          borderBottom: "1.5px solid var(--hairline-strong)",
          transform: "rotate(45deg)",
          borderBottomRightRadius: 3,
        }}
      />
      {phase === "typing" ? (
        <div style={{ display: "inline-flex", gap: 4, padding: "4px 2px" }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--ink-faint)",
                display: "inline-block",
                animation: `bubble-dot 1s cubic-bezier(.45,0,.55,1) ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--ink)",
            letterSpacing: -0.1,
            animation: "bubble-text 220ms ease-out both",
            textWrap: "pretty",
          } as React.CSSProperties}
        >
          {text}
        </div>
      )}
    </div>
  );
}
