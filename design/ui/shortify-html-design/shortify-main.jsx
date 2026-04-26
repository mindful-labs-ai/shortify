// Shortify — main screen, branded hi-fi (v1.1 brand identity)
// Loaded after tweaks-panel.jsx; uses TweaksPanel + Tweak controls + useTweaks.
//
// Brand cues followed:
//   • Spark coral as primary (#FF6B4A), Cream surface, Ink text
//   • Sunny yellow ONLY on streak/celebration; Mint ONLY on success/done
//   • Warm, friendly tone in copy; informal banmal-but-polite ("…했어요")
//   • Mascot 쇼리 (Shori) — a red-panda placeholder, simple geometric SVG.
//     Real character art will replace `<Shori/>` later.

const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────
// Mock data — only when state === "filled" / "dragover"
// ─────────────────────────────────────────────────────────────

const MOCK_LIBRARY = [
  {
    id: "j-01",
    title: "운동량 보존 법칙",
    source: "고등 물리학 I.pdf",
    chapter: "3장 · 92–98p",
    duration: "00:47",
    createdAt: "오늘 14:22",
    status: "done",
  },
  {
    id: "j-02",
    title: "탄성 충돌과 비탄성 충돌",
    source: "고등 물리학 I.pdf",
    chapter: "3장 · 99–104p",
    duration: "00:52",
    createdAt: "오늘 14:21",
    status: "done",
  },
  {
    id: "j-03",
    title: "각운동량의 정의",
    source: "고등 물리학 I.pdf",
    chapter: "4장 · 110–117p",
    duration: "—",
    createdAt: "오늘 14:18",
    status: "rendering",
    stage: 6,
    stageLabel: "내레이션 만드는 중",
    progress: 0.62,
    eta: "2분 남음",
  },
  {
    id: "j-04",
    title: "관성 모멘트의 직관",
    source: "고등 물리학 I.pdf",
    chapter: "4장 · 118–124p",
    duration: "—",
    createdAt: "오늘 14:18",
    status: "awaiting",
    stage: 3,
    stageLabel: "이미지 컨셉 골라주세요",
  },
  {
    id: "j-05",
    title: "회전 운동 에너지",
    source: "고등 물리학 I.pdf",
    chapter: "4장 · 125–131p",
    duration: "00:58",
    createdAt: "어제 21:04",
    status: "done",
  },
  {
    id: "j-06",
    title: "케플러 제2법칙",
    source: "천체물리 입문.pdf",
    chapter: "1장 · 22–30p",
    duration: "01:02",
    createdAt: "4월 24일",
    status: "done",
  },
];

const MOCK_RECENT_PROJECTS = [
  {
    id: "p-00",
    title: "현대 미술사 입문",
    subtitle: "20세기 사조 정리",
    shortsCount: 4,
    pageRange: "12–96p",
    lastUsed: "방금",
    character: { slug: "shori", name: "쇼리", tone: "coral" },
    status: "generating",
    progress: 42,
    phaseLabel: "영상 합치는 중",
    etaLabel: "약 5분 남음",
  },
  {
    id: "p-01",
    title: "고등 물리학 I",
    subtitle: "역학 단원 모음",
    shortsCount: 5,
    pageRange: "1–142p",
    lastUsed: "오늘 14:22",
    character: { slug: "shori", name: "쇼리", tone: "coral" },
  },
  {
    id: "p-02",
    title: "천체물리 입문",
    subtitle: "케플러 법칙 시리즈",
    shortsCount: 1,
    pageRange: "22–48p",
    lastUsed: "4월 24일",
    character: { slug: "nova", name: "노바", tone: "sky" },
  },
  {
    id: "p-03",
    title: "유기화학 핵심",
    subtitle: "작용기 정리",
    shortsCount: 3,
    pageRange: "60–110p",
    lastUsed: "4월 21일",
    character: { slug: "atom", name: "아톰", tone: "mint" },
  },
  {
    id: "p-04",
    title: "선형대수학",
    subtitle: "벡터 공간",
    shortsCount: 2,
    pageRange: "1–58p",
    lastUsed: "4월 18일",
    character: { slug: "shori", name: "쇼리", tone: "coral" },
  },
];

// ─────────────────────────────────────────────────────────────
// Mascot — Shori (Red panda) — geometric placeholder
// Pose-aware: "wave" | "idle" | "reach" | "munch"
// Uses brand tokens. Will be replaced by final mascot art.
// ─────────────────────────────────────────────────────────────

function Shori({ pose = "wave", size = 220 }) {
  // Final mascot art — uses the PNG asset. `pose` now drives subtle transforms
  // (slight rotation / scale / hover) since the artwork itself is fixed.
  const tilt =
    pose === "reach" ? -4 : pose === "munch" ? 3 : pose === "idle" ? 0 : -2;
  const lift = pose === "reach" ? -8 : pose === "wave" ? -2 : 0;

  return (
    <div
      aria-label="Shori — shortify mascot"
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {/* Soft ground shadow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          bottom: size * 0.04,
          transform: "translateX(-50%)",
          width: size * 0.62,
          height: size * 0.06,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(26,22,20,0.22) 0%, rgba(26,22,20,0) 70%)",
          pointerEvents: "none",
        }}
      />
      <img
        src="assets/shori.png"
        alt="Shori"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          display: "block",
          transform: `rotate(${tilt}deg) translateY(${lift}px)`,
          transformOrigin: "50% 80%",
          transition: "transform 220ms cubic-bezier(0.2,0,0,1)",
          objectFit: "contain",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────

function Hairline({ vertical = false, style = {} }) {
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

function Btn({ children, variant = "secondary", size = "md", onClick, style = {} }) {
  const base = {
    fontFamily: "var(--font-sans)",
    fontWeight: 700,
    border: "1.5px solid transparent",
    borderRadius: 999,
    cursor: "pointer",
    transition: "all 120ms cubic-bezier(0.2,0,0,1)",
    whiteSpace: "nowrap",
    lineHeight: 1,
    letterSpacing: -0.1,
  };
  const sizes = {
    sm: { fontSize: 12, padding: "7px 14px" },
    md: { fontSize: 13, padding: "10px 18px" },
    lg: { fontSize: 15, padding: "14px 24px" },
  };
  const variants = {
    primary: {
      background: "var(--coral-500)",
      color: "var(--cream)",
      borderColor: "var(--coral-500)",
      boxShadow: "3px 5px 0 var(--coral-700), var(--shadow-coral)",
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
      onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={(e) => {
        if (variant === "primary") {
          e.currentTarget.style.background = "var(--coral-700)";
          e.currentTarget.style.borderColor = "var(--coral-700)";
          e.currentTarget.style.transform = "translateY(1px)";
          e.currentTarget.style.boxShadow = "2px 3px 0 var(--coral-700), 0 6px 14px rgba(255,107,74,0.30)";
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
        e.currentTarget.style.background = variants[variant].background;
        e.currentTarget.style.borderColor = variants[variant].borderColor;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = variants[variant].boxShadow || "none";
        if (variant === "ghost") e.currentTarget.style.color = "var(--ink-soft)";
      }}
    >
      {children}
    </button>
  );
}

// Brand logo — SVG wordmark
function ShortifyMark({ size = 24 }) {
  const aspect = 1920 / 527.54;
  const h = size * 1.4;
  const w = h * aspect;
  return (
    <svg viewBox="0 0 1920 527.54"
      style={{ height: h, width: w, display: "block", flexShrink: 0 }}
      fill="var(--coral-500)" aria-label="shortify" role="img">
      <path d="M1739.23,479.03c-35.72,13.69-74.16,14.06-109.73,2.78-15.32-4.86-26.16-17.43-26.95-33.14-.56-11.11,4.53-21.27,12.21-27.15,8.89-6.81,21.43-10.87,31.62-5.93,12.93,6.27,25.15,9.08,39.71,8.41,38.55-1.76,59.01-29.73,61.11-67.4-14.49,14.13-31.14,19.6-50.03,19.56-28.42-.07-56.03-10.58-73.74-33.22-13.34-17.04-21.21-37.82-21.37-59.74l-.57-81.42c-.13-18.83,11.74-33.12,30.43-36.04,17.84-2.78,39.34,7.91,40.83,27.62l1.01,86.62c.25,21.55,17.61,36.37,39.07,35.69,19.96-.64,37.73-14.55,37.85-35.27l.5-82.66c.1-16.77,12.55-28.66,28.83-31.79,18.25-3.51,41.79,8.11,41.87,28.77l.54,136.18c.1,26.42-3.99,51.35-12.84,75.72-12.18,33.54-36.23,59.34-70.36,72.42Z" />
      <path d="M501.11,375.29l-.71-109.73c-.08-12.92-4.5-25.32-13.97-33.95-11.05-10.08-26.09-12.83-40.55-10.7-23.59,3.47-40.08,21.96-40.23,45.9l-.72,109.08c-.11,17.33-15.65,29-32.26,30.68-18.55,1.88-39.54-10.94-39.57-31.32l-.38-280.45c-.03-21.21,16.57-35.83,37.58-35.11,16.03.58,34.08,10.98,34.32,28.39l1.36,98.12c21.77-24.39,51.27-34.65,82.26-29.91,49.65,5.72,84.75,46.78,84.76,95.57l.02,122.33c0,20.97-21.34,34.78-41.02,32.18-16.08-2.12-30.78-13.54-30.9-31.1Z" />
      <path d="M852.28,329.64c-26.4,70.36-108.63,94.73-175.02,68.3-39.74-15.82-67.15-50.05-73.97-91.88-9.76-59.83,18.14-117.63,74.84-140.84,32.72-13.39,69.15-13.73,102.41-1.42,67.59,25,96.37,100.2,71.74,165.84ZM770.54,328.63c15.38-13.53,20.07-32.94,18.74-52.42-2.13-31.05-25.77-54.63-55.94-55.84s-55.93,20.87-59.98,51.54c-2.42,18.35.81,36.55,12.89,50.88,21.13,25.06,59.05,28.04,84.29,5.83Z" />
      <path d="M260.77,396.22c-37.15,17.07-92.26,15.35-130.07-.08-11.54-4.71-21.82-10.15-30.53-18.68-13.96-13.68-14.07-34.84-.72-47.96,14.18-13.02,36.36-13.18,48.8,2.68,23.24,18.63,78.31,24.1,82.67,2.2,5.97-29.94-75.49-20.58-112.71-57.95-15.22-15.29-19.9-36.65-16.73-57.9,3.48-23.33,18.1-41.81,39.18-52.35,39.09-19.54,108.7-16.65,141.7,10.52,13.15,10.83,14.92,28.41,5.94,41.06-10.05,14.15-27.7,16.2-42.33,6.83-29.08-18.63-70.41-17.15-72.6,1.85-.78,6.78,3.48,11.72,9.73,14.8,20.02,9.88,50.7,11.44,81.89,27.35,22.45,11.45,36.84,31.62,38.2,56.67,1.69,31.17-14,57.92-42.42,70.98Z" />
      <path d="M1523.69,372.37c-.06,21.91-19.62,35.93-40,34.18-17.98-1.54-32.3-14.94-32.32-33.49l-.18-146.45-16.59-.37c-15.51-.35-25.07-15.04-24.7-30.17.37-15.19,10.76-28.33,26.23-28.8l15.53-.47,1.74-33.06c7.87-60.57,68.74-80.08,124.14-66.76,9.91,2.38,17.77,9.9,21.11,16.8,5.22,10.8,4.38,21.85-.5,31.43s-15.91,16.8-26.97,14.25c-20.73-4.79-42.4-3.31-46.35,16.67l-.9,20.65,31.29,1.33c14.14,2.34,22.76,15.65,22.83,28.68s-8.47,26.43-22.77,28.89l-31.15.5-.42,146.18Z" />
      <path d="M1231.21,340.68c12.87-6.57,26.49-2.73,33.57,9.66,5.17,9.03,7.1,19.63,2.88,30.64-10.69,27.95-63.43,30.49-93.07,22.91-37.09-9.49-53.86-39.57-53.92-77.21l-.17-100.49-19.85-.36c-14.31-2.61-23.32-15.34-23.29-29.06s9.66-27.33,24.27-29.33l18.84-.12.2-31.62c.12-19.24,15.18-31.75,33.92-32.56,19.03-.82,37.44,11.57,37.67,31.19l.38,32.53,36.35.26c19.07.14,33.57,12.59,32.62,31.94-.65,13.36-9.88,26.56-24.05,26.67l-45.05.37.28,96.19c.03,8.85,5.41,17.23,13.32,20.23,7.78,2.95,17.13,2.2,25.09-1.86Z" />
      <path d="M960.94,263.48l-.65,112.42c-.09,15.21-12.27,25.79-26.63,29.66-18.6,5.02-44.12-6.83-44.09-28.41l.15-124.51c2.18-46.07,34.02-82.24,77.17-93.75,24.15-6.45,47.68-7.02,71.56.13,20.08,6.01,30.87,28.28,22.34,47.02-7.19,15.78-23.49,22.17-39.2,16.29-6.32-2.36-13.04-2.37-19.46-1.72-22.9,2.31-38.82,18.92-41.2,42.87Z" />
      <path d="M1352.08,403.79c-11.68,4.62-22.91,4.08-33.63-2.31-7.55-4.49-16.63-13.91-16.6-25.65l.5-181.07c.05-17.1,18.18-27.72,33.44-28.48,19.28-.96,37.79,12.52,37.79,32.71l.04,176.63c0,13.29-9.98,23.58-21.55,28.16Z" />
      <path d="M1375.52,96.63c4.12,12.84,2.05,25.44-5.81,36.33-6.31,8.75-18.11,14.9-30.97,15.33-15.31.52-29.01-7.33-36.23-19.59-7.55-12.84-6.96-29.04,1.62-41.88,8.41-12.59,23.67-18.83,38.92-16.69,13.84,1.94,27.54,11.18,32.47,26.5Z" />
    </svg>
  );
}

// Vertical 9:16 thumbnail placeholder — coral-tinted stripes
function ThumbPlaceholder({ width = 44, label, tone = "neutral" }) {
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

// ─────────────────────────────────────────────────────────────
// Window chrome
// ─────────────────────────────────────────────────────────────

function TrafficLights() {
  const dot = (color) => ({
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: color,
    border: "0.5px solid rgba(0,0,0,0.18)",
  });
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div style={dot("#FF5F57")} />
      <div style={dot("#FEBC2E")} />
      <div style={dot("#28C840")} />
    </div>
  );
}

function TitleBar() {
  return (
    <div
      style={{
        height: 48,
        display: "flex",
        alignItems: "center",
        padding: "0 18px",
        gap: 16,
        borderBottom: "1px solid var(--hairline)",
        background: "var(--cream)",
        flexShrink: 0,
      }}
    >
      <TrafficLights />
      <div style={{ flex: 1 }} />
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "var(--ink-soft)",
          letterSpacing: -0.1,
        }}
      >
        shortify
      </div>
      <div style={{ flex: 1 }} />
      {/* streak chip in title bar — branded */}
      <div
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
        title="14일 연속 학습 중"
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
        14
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────

function SidebarItem({ label, count, active, accent }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 32,
        padding: "0 14px",
        margin: "1px 10px",
        borderRadius: 8,
        background: active ? "var(--coral-50)" : "transparent",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        color: active ? "var(--coral-900)" : "var(--ink-soft)",
        transition: "background 120ms",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = "var(--cloud)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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

function SidebarHeader({ children }) {
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

function Sidebar({ activeKey = "library" }) {
  return (
    <aside
      style={{
        width: 232,
        background: "var(--paper)",
        borderRight: "1px solid var(--hairline)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Brand block */}
      <div style={{ padding: "20px 22px 18px" }}>
        <ShortifyMark size={26} />
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: "var(--ink-mute)",
            lineHeight: 1.45,
          }}
        >
          한 입 크기로, 자동으로 재생되는 학습
        </div>
      </div>

      <Hairline />

      {/* Workspace */}
      <div style={{ padding: "14px 0 8px" }}>
        <SidebarHeader>작업 공간</SidebarHeader>
        <SidebarItem label="라이브러리" count={6} active={activeKey === "library"} />
        <SidebarItem label="만드는 중" count={2} />
        <SidebarItem label="초안" />
      </div>

      <Hairline />

      {/* Sources */}
      <div style={{ padding: "14px 0 8px" }}>
        <SidebarHeader>PDF 출처</SidebarHeader>
        <SidebarItem label="고등 물리학 I" count={5} />
        <SidebarItem label="천체물리 입문" count={1} />
        <SidebarItem label="모든 출처 보기" />
      </div>

      <div style={{ flex: 1 }} />

      {/* Footer card — usage + streak */}
      <div style={{ padding: "12px" }}>
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
            이번 달 사용량
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
            BYOK · 본인 키로 청구 중
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            cursor: "pointer",
            borderRadius: 8,
            color: "var(--ink-soft)",
          }}
        >
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
            }}
          >
            J
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>김지호</div>
            <div style={{ fontSize: 10, color: "var(--ink-mute)" }}>설정 · API 키</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// DropZone
// ─────────────────────────────────────────────────────────────

function DropZone({ state }) {
  const isHover = state === "dragover";
  const compact = state === "filled";

  if (compact) {
    return (
      <div
        style={{
          position: "relative",
          borderRadius: "var(--radius-xl)",
          background: "var(--cream)",
          border: "2px dashed var(--coral-300)",
          padding: "20px 24px 20px 12px",
          display: "flex",
          alignItems: "center",
          gap: 18,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ flexShrink: 0, marginTop: -16, marginBottom: -28 }}>
          <Shori pose="idle" size={120} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: -0.6,
              color: "var(--ink)",
              lineHeight: 1.15,
            }}
          >
            새 PDF로 한 입 더 만들어볼까요?
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: "var(--ink-mute)" }}>
            여기에 끌어다 놓거나 파일을 선택하면, 평균 10~12분이면 한 편이 완성돼요.
          </div>
        </div>
        <Btn variant="secondary" size="md">샘플 PDF</Btn>
        <Btn variant="primary" size="md">파일 선택</Btn>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "var(--radius-xl)",
        background: isHover ? "var(--coral-50)" : "var(--cream)",
        border: isHover ? "3px dashed var(--coral-500)" : "2px dashed var(--coral-300)",
        transition: "all 200ms cubic-bezier(0.2,0,0,1)",
        padding: "44px 48px",
        boxShadow: isHover ? "var(--shadow-coral)" : "var(--shadow-sm)",
        transform: isHover ? "scale(1.005)" : "scale(1)",
        overflow: "hidden",
      }}
    >
      {/* Decorative coral bracket marks in the corners */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 18,
          pointerEvents: "none",
          opacity: isHover ? 0 : 0.5,
          transition: "opacity 160ms",
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: 22,
              height: 22,
              borderColor: "var(--coral-300)",
              borderStyle: "solid",
              borderWidth: 0,
              ...(i === 0 && { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 6 }),
              ...(i === 1 && { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 6 }),
              ...(i === 2 && { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 6 }),
              ...(i === 3 && { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 6 }),
            }}
          />
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 240px",
          gap: 32,
          alignItems: "center",
          minHeight: 320,
        }}
      >
        {/* Left: copy + CTA */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 12px 5px 8px",
              borderRadius: 999,
              background: "var(--cream)",
              border: "1.5px solid var(--coral-300)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--coral-700)",
              marginBottom: 18,
              letterSpacing: 0.2,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--coral-500)",
                display: "inline-block",
              }}
            />
            새 작업 시작
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 46,
              fontWeight: 900,
              letterSpacing: -1.6,
              lineHeight: 1.02,
              color: "var(--ink)",
              textWrap: "balance",
            }}
          >
            {isHover ? (
              <>
                여기에 <span style={{ color: "var(--coral-500)" }}>탁!</span><br />
                놓아 주세요
              </>
            ) : (
              <>
                오늘은 뭐<br />
                <span style={{ color: "var(--coral-500)" }}>한 입</span> 배워볼까요?
              </>
            )}
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 16,
              color: "var(--ink-soft)",
              maxWidth: 480,
              lineHeight: 1.55,
              textWrap: "pretty",
            }}
          >
            교과서·논문·강의 자료를 여기에 떨어뜨리면, 쇼리가 단원 단위로 60초짜리 학습 숏폼을 만들어 드려요.
          </div>

          <div
            style={{
              marginTop: 28,
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Btn variant="primary" size="lg">PDF 선택</Btn>
            <Btn variant="secondary" size="lg">샘플로 먼저 보기</Btn>
          </div>

          <div
            style={{
              marginTop: 22,
              fontSize: 12,
              color: "var(--ink-mute)",
              fontFamily: "var(--font-mono)",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span>PDF · 200MB까지</span>
            <span style={{ color: "var(--ink-faint)" }}>·</span>
            <span>한국어 / English</span>
            <span style={{ color: "var(--ink-faint)" }}>·</span>
            <span>평균 10~12분</span>
          </div>
        </div>

        {/* Right: mascot */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            height: "100%",
          }}
        >
          <Shori pose={isHover ? "reach" : "wave"} size={220} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Library
// ─────────────────────────────────────────────────────────────

function StatusPill({ status, stageLabel }) {
  // Tones strictly per brand: Mint = success only, Coral = active, Yellow = celebration
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
function pillStyle(bg, color, border) {
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
function Dot({ color }) {
  return <span style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />;
}
function PulsingDot({ color }) {
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

function ProgressBar({ value }) {
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

function LibraryRow({ item, density }) {
  const padY = density === "compact" ? 10 : 16;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto auto auto",
        gap: 20,
        padding: `${padY}px 24px`,
        alignItems: "center",
        borderBottom: "1px solid var(--hairline)",
        cursor: "pointer",
        transition: "background 120ms",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--coral-50)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <ThumbPlaceholder
        width={density === "compact" ? 36 : 44}
        label="9:16"
        tone={item.status === "rendering" ? "coral" : "neutral"}
      />

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: -0.1,
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            marginTop: 3,
            fontSize: 12,
            color: "var(--ink-mute)",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span>{item.source}</span>
          <span style={{ color: "var(--ink-faint)" }}>·</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>{item.chapter}</span>
        </div>
        {item.status === "rendering" && (
          <div style={{ marginTop: 8, maxWidth: 320 }}>
            <ProgressBar value={item.progress} />
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "var(--ink-mute)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {item.stage}/9 · {item.eta}
            </div>
          </div>
        )}
      </div>

      <StatusPill status={item.status} stageLabel={item.stageLabel} />

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--ink-soft)",
          fontVariantNumeric: "tabular-nums",
          minWidth: 48,
          textAlign: "right",
          fontWeight: 600,
        }}
      >
        {item.duration}
      </div>

      <div
        style={{
          fontSize: 12,
          color: "var(--ink-mute)",
          minWidth: 76,
          textAlign: "right",
        }}
      >
        {item.createdAt}
      </div>
    </div>
  );
}

function Library({ items, density }) {
  return (
    <div
      style={{
        marginTop: 32,
        background: "var(--cream)",
        border: "1.5px solid var(--hairline-strong)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "18px 24px",
          gap: 16,
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 800,
              color: "var(--ink)",
              letterSpacing: -0.4,
            }}
          >
            라이브러리
          </div>
          <div style={{ marginTop: 2, fontSize: 12, color: "var(--ink-mute)" }}>
            지금까지 만든 숏폼 {items.length}편이에요
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: "flex",
            background: "var(--cloud)",
            borderRadius: 999,
            padding: 3,
            gap: 0,
            border: "1.5px solid var(--hairline-strong)",
          }}
        >
          {[
            ["전체", true],
            ["완료", false],
            ["만드는 중", false],
            ["확인 필요", false],
          ].map(([t, active], i) => (
            <button
              key={t}
              style={{
                border: "none",
                background: active ? "var(--cream)" : "transparent",
                boxShadow: active ? "0 1px 2px rgba(26,22,20,0.1)" : "none",
                padding: "5px 14px",
                fontSize: 12,
                fontWeight: active ? 700 : 600,
                color: active ? "var(--ink)" : "var(--ink-mute)",
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <Btn variant="ghost" size="sm">최신순 ▾</Btn>
      </div>

      {/* Column header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto auto auto",
          gap: 20,
          padding: "10px 24px",
          alignItems: "center",
          background: "var(--paper)",
          borderBottom: "1px solid var(--hairline)",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 0.7,
          textTransform: "uppercase",
          color: "var(--ink-mute)",
        }}
      >
        <div style={{ width: density === "compact" ? 36 : 44 }}>썸네일</div>
        <div>제목 · 출처</div>
        <div style={{ minWidth: 80 }}>상태</div>
        <div style={{ minWidth: 48, textAlign: "right" }}>길이</div>
        <div style={{ minWidth: 76, textAlign: "right" }}>만든 날</div>
      </div>

      {items.map((it) => (
        <LibraryRow key={it.id} item={it} density={density} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Recent projects grid
// ─────────────────────────────────────────────────────────────

function CharacterAvatar({ name, tone = "coral", size = 22 }) {
  const initial = (name || "?").trim().charAt(0);
  const tones = {
    coral: { bg: "var(--coral-100)", border: "var(--coral-500)", color: "var(--coral-900)" },
    sky: { bg: "#D6E8FF", border: "var(--sky-500)", color: "#0F4A99" },
    mint: { bg: "var(--mint-50)", border: "var(--mint-500)", color: "var(--mint-900)" },
  };
  const t = tones[tone] || tones.coral;
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

function RecentProjectCard({ item }) {
  const tone = item.character.tone;
  const isGenerating = item.status === "generating";
  const coverBg =
    tone === "coral"
      ? "linear-gradient(135deg, var(--coral-100), var(--coral-50))"
      : tone === "sky"
      ? "linear-gradient(135deg, #D6E8FF, #EAF2FF)"
      : "linear-gradient(135deg, var(--mint-50), #ECFBF4)";
  return (
    <div
      style={{
        background: "var(--cream)",
        border: isGenerating
          ? "1.5px solid var(--coral-500)"
          : "1.5px solid var(--hairline-strong)",
        borderRadius: "var(--radius-lg)",
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        cursor: "pointer",
        transition: "all 120ms cubic-bezier(0.2,0,0,1)",
        boxShadow: isGenerating
          ? "3px 4px 0 var(--coral-700), 0 0 0 4px var(--coral-50)"
          : "3px 4px 0 var(--stamp-soft)",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = isGenerating
          ? "5px 7px 0 var(--coral-700), 0 0 0 4px var(--coral-50), 0 12px 26px rgba(255,107,74,0.18)"
          : "5px 7px 0 var(--stamp-deep), 0 12px 26px rgba(26,22,20,0.10)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = isGenerating
          ? "3px 4px 0 var(--coral-700), 0 0 0 4px var(--coral-50)"
          : "3px 4px 0 var(--stamp-soft)";
      }}
    >
      {/* Generating ribbon — diagonal corner flag */}
      {isGenerating && (
        <div
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            zIndex: 2,
            background: "var(--coral-500)",
            color: "var(--cream)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.5,
            padding: "5px 10px",
            borderRadius: 999,
            border: "1.5px solid var(--coral-700)",
            boxShadow: "2px 3px 0 var(--coral-900)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--cream)",
              animation: "shori-pulse 1.4s ease-out infinite",
            }}
          />
          생성 중
        </div>
      )}

      {/* Cover */}
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 10",
          borderRadius: 10,
          border: "1.5px solid var(--hairline-strong)",
          background: coverBg,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Mascot peeking from cover bottom */}
        <div
          style={{
            position: "absolute",
            bottom: -28,
            left: "50%",
            transform: "translateX(-50%)",
            opacity: tone === "coral" ? 1 : 0.4,
            animation: isGenerating
              ? "shori-talk 0.9s cubic-bezier(.45,0,.55,1) infinite"
              : "none",
            transformOrigin: "50% 90%",
          }}
        >
          <Shori pose={isGenerating ? "wave" : tone === "coral" ? "munch" : "idle"} size={104} />
        </div>

        {/* Top badges */}
        {!isGenerating && (
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 800,
              color: "var(--cream)",
              background: "var(--ink)",
              padding: "3px 8px",
              borderRadius: 999,
              letterSpacing: 0.2,
            }}
          >
            {item.shortsCount} 편
          </span>
        )}

        {/* Page range */}
        <span
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 700,
            color: "var(--ink-soft)",
            background: "var(--cream)",
            padding: "3px 7px",
            borderRadius: 4,
            border: "1px solid var(--hairline-strong)",
          }}
        >
          {item.pageRange}
        </span>

        {/* Generating progress overlay — striped bar across bottom */}
        {isGenerating && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 28,
              background: "rgba(26,22,20,0.55)",
              backdropFilter: "blur(2px)",
              WebkitBackdropFilter: "blur(2px)",
              display: "flex",
              alignItems: "center",
              padding: "0 10px",
              gap: 8,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 6,
                borderRadius: 999,
                background: "rgba(255,248,242,0.25)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${item.progress}%`,
                  background: "var(--coral-500)",
                  borderRadius: 999,
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(255,255,255,0.22) 0 6px, transparent 6px 14px)",
                  backgroundSize: "24px 100%",
                  animation: "progress-stripes 1.2s linear infinite",
                  transition: "width 600ms cubic-bezier(.45,0,.55,1)",
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 800,
                color: "var(--cream)",
                letterSpacing: 0.2,
                minWidth: 30,
                textAlign: "right",
              }}
            >
              {item.progress}%
            </span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 15,
            fontWeight: 800,
            color: "var(--ink)",
            letterSpacing: -0.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 12,
            color: isGenerating ? "var(--coral-700)" : "var(--ink-mute)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: isGenerating ? 700 : 400,
          }}
        >
          {isGenerating ? item.phaseLabel + " · " + item.etaLabel : item.subtitle}
        </div>
      </div>

      {/* Footer meta */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          paddingTop: 10,
          borderTop: "1px solid var(--hairline)",
          gap: 8,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <CharacterAvatar name={item.character.name} tone={item.character.tone} size={20} />
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              color: "var(--ink-soft)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.character.name}
          </span>
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            color: isGenerating ? "var(--coral-700)" : "var(--ink-mute)",
            fontWeight: isGenerating ? 800 : 500,
          }}
        >
          {item.lastUsed}
        </span>
      </div>
    </div>
  );
}

function RecentProjectsGrid() {
  return (
    <div style={{ marginTop: 40 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: -0.5,
              color: "var(--ink)",
            }}
          >
            최근 프로젝트
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 13,
              color: "var(--ink-mute)",
            }}
          >
            이전에 작업한 PDF로 빠르게 이어 만들어요
          </div>
        </div>
        <Btn variant="ghost" size="sm">전체 보기 →</Btn>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 14,
        }}
      >
        {MOCK_RECENT_PROJECTS.map((p) => (
          <RecentProjectCard key={p.id} item={p} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main shell
// ─────────────────────────────────────────────────────────────

function MainView({ tweaks }) {
  const { state, showSidebar, density } = tweaks;

  const items =
    state === "filled"
      ? MOCK_LIBRARY
      : state === "dragover"
      ? MOCK_LIBRARY.slice(0, 3)
      : [];

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      {showSidebar && <Sidebar activeKey="library" />}

      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          background: "var(--cloud)",
          position: "relative",
        }}
      >
        <div style={{ padding: "32px 40px 60px", maxWidth: 1180, margin: "0 auto" }}>
          <DropZone state={state} />

          {state !== "empty" && <Library items={items} density={density} />}

          <RecentProjectsGrid />
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Outer frame
// ─────────────────────────────────────────────────────────────

function App() {
  const [tweaks, setTweak] = useTweaks(window.__TWEAKS_DEFAULTS);

  const framed = tweaks.windowMode === "framed";

  return (
    <>
      <style>{`
        @keyframes shori-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,107,74,0.5); }
          70%  { box-shadow: 0 0 0 8px rgba(255,107,74,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,107,74,0); }
        }
      `}</style>
      <div
        style={{
          minHeight: "100vh",
          padding: framed ? "40px 40px 60px" : 0,
          display: "flex",
          flexDirection: "column",
          alignItems: framed ? "center" : "stretch",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: framed ? 1280 : "none",
            height: framed ? "min(900px, calc(100vh - 100px))" : "100vh",
            minHeight: 720,
            background: "var(--cream)",
            borderRadius: framed ? 16 : 0,
            overflow: "hidden",
            border: framed ? "1px solid var(--hairline-strong)" : "none",
            boxShadow: framed
              ? "0 30px 80px rgba(26,22,20,0.18), 0 8px 24px rgba(26,22,20,0.08)"
              : "none",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TitleBar />
          <div style={{ flex: 1, minHeight: 0 }}>
            <MainView tweaks={tweaks} />
          </div>
        </div>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="화면 상태" />
        <TweakRadio
          label="라이브러리"
          value={tweaks.state}
          onChange={(v) => setTweak("state", v)}
          options={[
            { value: "empty", label: "비어있음" },
            { value: "filled", label: "채워짐" },
            { value: "dragover", label: "드래그중" },
          ]}
        />

        <TweakSection label="레이아웃" />
        <TweakRadio
          label="윈도우"
          value={tweaks.windowMode}
          onChange={(v) => setTweak("windowMode", v)}
          options={[
            { value: "framed", label: "데스크톱" },
            { value: "fullbleed", label: "전체화면" },
          ]}
        />
        <TweakToggle
          label="사이드바"
          value={tweaks.showSidebar}
          onChange={(v) => setTweak("showSidebar", v)}
        />
        <TweakRadio
          label="목록 밀도"
          value={tweaks.density}
          onChange={(v) => setTweak("density", v)}
          options={[
            { value: "comfortable", label: "여유" },
            { value: "compact", label: "조밀" },
          ]}
        />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
