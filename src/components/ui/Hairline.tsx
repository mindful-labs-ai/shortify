import { CSSProperties } from "react";

interface HairlineProps {
  vertical?: boolean;
  style?: CSSProperties;
}

export default function Hairline({ vertical = false, style = {} }: HairlineProps) {
  return (
    <div
      style={{
        background: "var(--hairline)",
        width: vertical ? 1 : "100%",
        height: vertical ? "100%" : 1,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
