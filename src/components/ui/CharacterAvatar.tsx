interface CharacterAvatarProps {
  name: string;
  tone: "coral" | "mint" | "sky" | "yellow";
  size?: number;
}

export default function CharacterAvatar({ name, tone = "coral", size = 22 }: CharacterAvatarProps) {
  const initial = (name || "?").trim().charAt(0);
  const tones: Record<"coral" | "mint" | "sky" | "yellow", { bg: string; border: string; color: string }> = {
    coral: { bg: "var(--coral-100)", border: "var(--coral-500)", color: "var(--coral-900)" },
    sky: { bg: "#D6E8FF", border: "var(--sky-500)", color: "#0F4A99" },
    mint: { bg: "var(--mint-50)", border: "var(--mint-500)", color: "var(--mint-900)" },
    yellow: { bg: "var(--yellow-50)", border: "var(--yellow-500)", color: "var(--yellow-900)" },
  };
  const t = tones[tone] ?? tones.coral;
  return (
    <span
      aria-label={`character: ${name}`}
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: t.bg,
        border: `1.5px solid ${t.border}`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.5),
        fontWeight: 800,
        color: t.color,
        fontFamily: "var(--font-sans)",
        flexShrink: 0,
      }}
    >
      {initial}
    </span>
  );
}
