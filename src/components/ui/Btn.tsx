import React, { CSSProperties } from "react";

export interface BtnProps {
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
}

export default function Btn({
  children,
  variant = "secondary",
  size = "md",
  onClick,
  disabled,
  style = {},
}: BtnProps) {
  const base: CSSProperties = {
    fontFamily: "var(--font-sans)",
    fontWeight: 700,
    border: "1.5px solid transparent",
    borderRadius: 999,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 120ms cubic-bezier(0.2,0,0,1)",
    whiteSpace: "nowrap",
    lineHeight: 1,
    letterSpacing: -0.1,
    opacity: disabled ? 0.45 : 1,
  };
  const sizes: Record<"sm" | "md" | "lg", CSSProperties> = {
    sm: { fontSize: 12, padding: "7px 14px" },
    md: { fontSize: 13, padding: "10px 18px" },
    lg: { fontSize: 15, padding: "14px 24px" },
  };
  const variants: Record<"primary" | "secondary" | "ghost", CSSProperties> = {
    primary: {
      background: "var(--coral-500)",
      color: "var(--cream)",
      borderColor: "var(--coral-500)",
      boxShadow: disabled ? "none" : "3px 5px 0 var(--coral-700), var(--shadow-coral)",
    },
    secondary: {
      background: "var(--cream)",
      color: "var(--ink)",
      borderColor: "var(--ink-soft)",
      boxShadow: "3px 4px 0 var(--stamp-soft)",
    },
    ghost: {
      background: "transparent",
      color: "var(--ink-soft)",
      borderColor: "transparent",
    },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "primary") {
          e.currentTarget.style.background = "var(--coral-700)";
          e.currentTarget.style.transform = "translate(-1px, 2px)";
          e.currentTarget.style.boxShadow =
            "1px 2px 0 var(--coral-700), 0 4px 10px rgba(255,107,74,0.28)";
        }
        if (variant === "secondary") {
          e.currentTarget.style.background = "var(--coral-50)";
          e.currentTarget.style.transform = "translateY(1px)";
          e.currentTarget.style.boxShadow = "2px 3px 0 var(--stamp-soft)";
        }
        if (variant === "ghost") {
          e.currentTarget.style.background = "var(--coral-50)";
          e.currentTarget.style.color = "var(--coral-700)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = variants[variant].background as string;
        e.currentTarget.style.borderColor = variants[variant].borderColor as string;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = (variants[variant].boxShadow as string) || "none";
        if (variant === "ghost") e.currentTarget.style.color = "var(--ink-soft)";
      }}
    >
      {children}
    </button>
  );
}
