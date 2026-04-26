import ShortifyMark from "@/components/brand/ShortifyMark";
import Hairline from "@/components/ui/Hairline";
import { useAppStore } from "@/store";
import type { View } from "@/store";

// ─── Sub-components ──────────────────────────────────────────

interface SidebarItemProps {
  label: string;
  count?: number;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function SidebarItem({ label, count, active = false, disabled = false, onClick }: SidebarItemProps) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) onClick?.();
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) (e.currentTarget as HTMLDivElement).style.background = "var(--cloud)";
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
      style={{
        display: "flex",
        alignItems: "center",
        height: 32,
        padding: "0 14px",
        margin: "1px 10px",
        borderRadius: 8,
        background: active ? "var(--coral-50)" : "transparent",
        cursor: disabled ? "default" : "pointer",
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        color: disabled
          ? "var(--ink-faint)"
          : active
          ? "var(--coral-900)"
          : "var(--ink-soft)",
        opacity: disabled ? 0.5 : 1,
        transition: "background 120ms",
        userSelect: "none",
      }}
    >
      <span
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      {count != null && (
        <span
          style={{
            fontSize: 11,
            color: active ? "var(--coral-700)" : "var(--ink-mute)",
            fontVariantNumeric: "tabular-nums",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function SidebarHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "0 24px 8px",
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        color: "var(--ink-mute)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Streak chip (relocated from TitleBar) ───────────────────

function StreakChip({ count }: { count: number }) {
  return (
    <div
      title={`${count}-day streak`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px 4px 8px",
        borderRadius: 999,
        background: "var(--yellow-50)",
        border: "1.5px solid var(--yellow-500)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        fontWeight: 700,
        color: "var(--yellow-900)",
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "var(--yellow-500)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--yellow-900)",
          fontWeight: 900,
          fontSize: 9,
        }}
      >
        ★
      </span>
      {count}
    </div>
  );
}

// ─── Nav item → View mapping ─────────────────────────────────
// Library / In-progress / Drafts all go to "drop" for Phase 2.
// Real tab switching within DropView is wired in Phase 3.
// Settings / profile row → "settings"

const NAV_ITEMS: Array<{
  label: string;
  count?: number;
  target: View;
  disabled?: boolean;
}> = [
  { label: "Upload", target: "drop" },
  { label: "Library", count: 6, target: "library" },
  { label: "In progress", count: 2, target: "progress" },
  { label: "Drafts", target: "drop", disabled: true },
];

// ─── Sidebar ─────────────────────────────────────────────────

export default function Sidebar() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);

  return (
    <aside
      style={{
        width: 232,
        background: "var(--paper)",
        borderRight: "1px solid var(--hairline)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        minHeight: "100vh",
      }}
    >
      {/* Brand block — click to return home (drop view) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setView("drop")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setView("drop");
        }}
        style={{
          padding: "20px 22px 18px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <ShortifyMark size={26} />
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: "var(--ink-mute)",
            lineHeight: 1.45,
          }}
        >
          Bite-sized, auto-playing learning
        </div>
      </div>

      <Hairline />

      {/* Workspace */}
      <div style={{ padding: "14px 0 8px" }}>
        <SidebarHeader>Workspace</SidebarHeader>
        {NAV_ITEMS.map(({ label, count, target, disabled }) => (
          <SidebarItem
            key={label}
            label={label}
            count={count}
            active={!disabled && view === target}
            disabled={disabled}
            onClick={() => setView(target)}
          />
        ))}
      </div>

      <Hairline />

      {/* Sources — mock data, wired in Phase 3 */}
      <div style={{ padding: "14px 0 8px" }}>
        <SidebarHeader>PDF sources</SidebarHeader>
        <SidebarItem label="Physics 101" count={5} />
        <SidebarItem label="Intro to Astrophysics" count={1} />
        <SidebarItem label="All sources" />
      </div>

      <div style={{ flex: 1 }} />

      {/* Footer — usage card + streak + user profile */}
      <div style={{ padding: "12px" }}>
        {/* Usage card */}
        <div
          style={{
            background: "var(--coral-50)",
            border: "1.5px solid var(--coral-100)",
            borderRadius: 12,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: "var(--coral-700)",
            }}
          >
            This month
          </div>
          <div
            style={{
              marginTop: 4,
              fontFamily: "var(--font-mono)",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--ink)",
              letterSpacing: -0.4,
            }}
          >
            $14.32
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              color: "var(--ink-mute)",
              lineHeight: 1.45,
            }}
          >
            BYOK · billed to your key
          </div>
        </div>

        {/* User profile / Settings — streak chip relocated here from TitleBar */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setView("settings")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setView("settings");
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = "var(--cloud)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = "transparent";
          }}
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            cursor: "pointer",
            borderRadius: 8,
            color: "var(--ink-soft)",
            transition: "background 120ms",
            userSelect: "none",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "var(--cloud)",
              border: "1.5px solid var(--hairline-strong)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              color: "var(--ink-soft)",
              flexShrink: 0,
            }}
          >
            J
          </div>

          {/* Name + sub-label */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
              Jiho Kim
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-mute)" }}>Settings · API keys</div>
          </div>

          {/* Streak chip — relocated from TitleBar per Phase 2 decision */}
          <StreakChip count={14} />
        </div>
      </div>
    </aside>
  );
}
