interface ProgressBarProps {
  value: number;
}

export default function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div
      style={{
        width: "100%",
        height: 6,
        background: "var(--coral-50)",
        borderRadius: 999,
        overflow: "hidden",
        border: "1px solid var(--coral-100)",
      }}
    >
      <div
        style={{
          width: `${Math.round(value * 100)}%`,
          height: "100%",
          background: "var(--coral-500)",
          borderRadius: 999,
          transition: "width 240ms",
        }}
      />
    </div>
  );
}
