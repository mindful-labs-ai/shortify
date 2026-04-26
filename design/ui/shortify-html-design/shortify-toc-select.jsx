// Shortify — Step 2: PDF analyzed → choose up to 5 chapters from the TOC.
// Brand tokens are defined in Shortify TOC Select.html.

const { useState, useMemo } = React;

const MAX_PICKS = 5;

// ─────────────────────────────────────────────────────────────
// Mock PDF + parsed TOC
// ─────────────────────────────────────────────────────────────

const PDF_META = {
  filename: "고등 물리학 I.pdf",
  pages: 412,
  size: "38.2 MB",
  uploadedAt: "방금 전",
  language: "한국어",
};

const TOC = [
  {
    id: "ch-1",
    num: "1장",
    title: "물리학과 측정",
    pageRange: "12–46",
    pages: 35,
    sections: [
      { id: "s-1-1", num: "1.1", title: "물리량과 단위", pageRange: "14–22", pages: 9, est: "00:48" },
      { id: "s-1-2", num: "1.2", title: "차원 분석",       pageRange: "23–31", pages: 9, est: "00:52" },
      { id: "s-1-3", num: "1.3", title: "측정의 불확정성", pageRange: "32–46", pages: 15, est: "01:04" },
    ],
  },
  {
    id: "ch-2",
    num: "2장",
    title: "운동학 — 직선 운동",
    pageRange: "47–88",
    pages: 42,
    sections: [
      { id: "s-2-1", num: "2.1", title: "변위·속도·가속도",  pageRange: "48–58", pages: 11, est: "00:56" },
      { id: "s-2-2", num: "2.2", title: "등가속도 운동",      pageRange: "59–68", pages: 10, est: "00:50" },
      { id: "s-2-3", num: "2.3", title: "자유 낙하",           pageRange: "69–76", pages: 8,  est: "00:44" },
      { id: "s-2-4", num: "2.4", title: "상대 운동",           pageRange: "77–88", pages: 12, est: "00:58" },
    ],
  },
  {
    id: "ch-3",
    num: "3장",
    title: "운동량과 충돌",
    pageRange: "89–138",
    pages: 50,
    sections: [
      { id: "s-3-1", num: "3.1", title: "운동량 보존 법칙",     pageRange: "92–98",   pages: 7,  est: "00:47" },
      { id: "s-3-2", num: "3.2", title: "탄성 충돌과 비탄성 충돌", pageRange: "99–104",  pages: 6,  est: "00:52" },
      { id: "s-3-3", num: "3.3", title: "충격량",                 pageRange: "105–115", pages: 11, est: "00:42" },
      { id: "s-3-4", num: "3.4", title: "2차원 충돌 문제",        pageRange: "116–138", pages: 23, est: "01:08" },
    ],
  },
  {
    id: "ch-4",
    num: "4장",
    title: "회전 운동",
    pageRange: "139–196",
    pages: 58,
    sections: [
      { id: "s-4-1", num: "4.1", title: "각운동량의 정의",      pageRange: "110–117", pages: 8,  est: "00:54" },
      { id: "s-4-2", num: "4.2", title: "관성 모멘트의 직관",   pageRange: "118–124", pages: 7,  est: "00:50" },
      { id: "s-4-3", num: "4.3", title: "회전 운동 에너지",      pageRange: "125–131", pages: 7,  est: "00:58" },
      { id: "s-4-4", num: "4.4", title: "토크와 평형",           pageRange: "132–148", pages: 17, est: "01:02" },
    ],
  },
  {
    id: "ch-5",
    num: "5장",
    title: "에너지와 일",
    pageRange: "197–252",
    pages: 56,
    sections: [
      { id: "s-5-1", num: "5.1", title: "일과 운동 에너지",   pageRange: "198–210", pages: 13, est: "01:00" },
      { id: "s-5-2", num: "5.2", title: "퍼텐셜 에너지",       pageRange: "211–224", pages: 14, est: "00:55" },
      { id: "s-5-3", num: "5.3", title: "에너지 보존",         pageRange: "225–240", pages: 16, est: "01:08" },
      { id: "s-5-4", num: "5.4", title: "일률",                pageRange: "241–252", pages: 12, est: "00:46" },
    ],
  },
];

// flatten sections for selection state lookup
const ALL_SECTIONS = TOC.flatMap((ch) => ch.sections.map((s) => ({ ...s, chapterId: ch.id, chapterTitle: ch.title })));

// ─────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────

// Shori — mascot with a friendly idle bob, head tilt on talk,
// and an optional speech bubble.
function Shori({ size = 140, talking = false, withShadow = true }) {
  return (
    <div
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
      {/* soft ground shadow that pulses with the bob */}
      {withShadow && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%",
            bottom: 4,
            transform: "translateX(-50%)",
            width: size * 0.6,
            height: size * 0.07,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(26,22,20,0.22) 0%, rgba(26,22,20,0) 70%)",
            animation: "shori-shadow 2.6s cubic-bezier(.45,0,.55,1) infinite",
          }}
        />
      )}
      <img
        src="assets/shori.png"
        alt="Shori"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          display: "block",
          objectFit: "contain",
          transformOrigin: "50% 88%",
          animation: talking
            ? "shori-talk 0.9s cubic-bezier(.45,0,.55,1) infinite"
            : "shori-idle 2.6s cubic-bezier(.45,0,.55,1) infinite",
        }}
      />
    </div>
  );
}

// Speech bubble that types in (animated dots while loading,
// then fades in the message). `key` it on `text` to retrigger.
function SpeechBubble({ text }) {
  const [phase, setPhase] = useState("typing"); // 'typing' | 'shown'
  React.useEffect(() => {
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
      {/* tail pointing down toward Shori */}
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
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Buttons + brand mark
// ─────────────────────────────────────────────────────────────

function Btn({ children, variant = "secondary", size = "md", onClick, disabled, style = {} }) {
  const base = {
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
          e.currentTarget.style.boxShadow = "1px 2px 0 var(--coral-700), 0 4px 10px rgba(255,107,74,0.28)";
        }
        if (variant === "secondary") {
          e.currentTarget.style.background = "var(--coral-50)";
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

function ShortifyMark({ size = 24 }) {
  // viewBox is 1920 × 527.54 → aspect ≈ 3.638
  const aspect = 1920 / 527.54;
  const h = size * 1.4;
  const w = h * aspect;
  return (
    <svg
      viewBox="0 0 1920 527.54"
      style={{ height: h, width: w, display: "block", flexShrink: 0 }}
      fill="var(--coral-500)"
      aria-label="shortify"
      role="img"
    >
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

// ─────────────────────────────────────────────────────────────
// Window chrome
// ─────────────────────────────────────────────────────────────

function TitleBar() {
  const dot = (color) => ({
    width: 12, height: 12, borderRadius: "50%", background: color,
    border: "0.5px solid rgba(0,0,0,0.18)",
  });
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
      <div style={{ display: "flex", gap: 8 }}>
        <div style={dot("#FF5F57")} />
        <div style={dot("#FEBC2E")} />
        <div style={dot("#28C840")} />
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", letterSpacing: -0.1 }}>
        shortify — 새 작업
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ width: 52 }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Wizard step indicator
// ─────────────────────────────────────────────────────────────

function StepIndicator({ active = 2 }) {
  const steps = [
    { num: 1, label: "PDF 업로드" },
    { num: 2, label: "목차 고르기" },
    { num: 3, label: "캐릭터 선택" },
    { num: 4, label: "생성" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      {steps.map((s, i) => {
        const isActive = s.num === active;
        const isDone = s.num < active;
        return (
          <React.Fragment key={s.num}>
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
                {isDone ? "✓" : s.num}
              </span>
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div
                style={{
                  width: 16,
                  height: 2,
                  background: s.num < active ? "var(--mint-500)" : "var(--hairline-strong)",
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

// ─────────────────────────────────────────────────────────────
// PDF summary card (left rail)
// ─────────────────────────────────────────────────────────────

function PdfSummary({ picks }) {
  return (
    <aside
      style={{
        width: 312,
        flexShrink: 0,
        background: "var(--paper)",
        borderRight: "1px solid var(--hairline)",
        padding: "24px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
        overflowY: "auto",
      }}
    >
      <ShortifyMark size={22} />

      {/* PDF cover preview */}
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.7,
            textTransform: "uppercase",
            color: "var(--ink-mute)",
            marginBottom: 10,
          }}
        >
          업로드한 자료
        </div>

        <div
          style={{
            background: "var(--cream)",
            border: "1.5px solid var(--hairline-strong)",
            borderRadius: 14,
            padding: 14,
            display: "flex",
            gap: 12,
            alignItems: "center",
            boxShadow: "3px 4px 0 var(--stamp-soft)",
          }}
        >
          {/* Mini PDF cover */}
          <div
            style={{
              width: 56,
              height: 72,
              borderRadius: 6,
              background: "linear-gradient(135deg, var(--coral-100), var(--coral-50))",
              border: "1.5px solid var(--coral-100)",
              flexShrink: 0,
              display: "flex",
              alignItems: "flex-end",
              padding: 4,
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              fontWeight: 700,
              color: "var(--coral-700)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", top: 6, right: 6,
              padding: "1px 5px", borderRadius: 3,
              background: "var(--coral-500)", color: "var(--cream)",
              fontSize: 8, fontWeight: 800,
            }}>PDF</div>
            <span>{PDF_META.pages}p</span>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--ink)",
                letterSpacing: -0.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={PDF_META.filename}
            >
              {PDF_META.filename}
            </div>
            <div style={{ marginTop: 3, fontSize: 11, color: "var(--ink-mute)", fontFamily: "var(--font-mono)" }}>
              {PDF_META.size} · {PDF_META.language}
            </div>
            <div style={{ marginTop: 3, fontSize: 11, color: "var(--ink-mute)" }}>
              업로드 {PDF_META.uploadedAt}
            </div>
          </div>
        </div>
      </div>

      {/* Selection summary card */}
      <div
        style={{
          background: picks.size > 0 ? "var(--coral-50)" : "var(--cloud)",
          border: picks.size > 0 ? "1.5px solid var(--coral-100)" : "1.5px dashed var(--hairline-strong)",
          borderRadius: 14,
          padding: "14px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.7,
              textTransform: "uppercase",
              color: picks.size > 0 ? "var(--coral-700)" : "var(--ink-mute)",
            }}
          >
            선택한 목차
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              fontWeight: 800,
              color: picks.size > 0 ? "var(--coral-700)" : "var(--ink-mute)",
            }}
          >
            {picks.size} / {MAX_PICKS}
          </div>
        </div>

        {/* progress dots */}
        <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
          {Array.from({ length: MAX_PICKS }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 999,
                background: i < picks.size ? "var(--coral-500)" : "var(--cream)",
                border: "1px solid var(--hairline-strong)",
              }}
            />
          ))}
        </div>

        <div style={{ marginTop: 12, fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>
          {picks.size === 0 && "최대 5개까지 골라요."}
          {picks.size > 0 && picks.size < MAX_PICKS && "조금 더 골라도 되고, 지금 시작해도 좋아요."}
          {picks.size === MAX_PICKS && "딱 좋아요. 이대로 진행해 볼까요?"}
        </div>
      </div>

      {/* Shori — fills the bottom of the rail with personality */}
      <ShoriPanel picks={picks} />
    </aside>
  );
}

// Talking-mascot block: speech bubble that reacts to picks count + sits on top of Shori.
function ShoriPanel({ picks }) {
  const lines = useMemo(
    () => ({
      empty: [
        "어떤 단원이 끌려요?",
        "한 입 크기로 만들어 줄게요.",
      ],
      few: [
        `오, ${picks.size}개 골랐네요!`,
        "조금 더 골라도 좋아요.",
      ],
      almost: [
        `벌써 ${picks.size}개! 잘 어울려요.`,
        "한 개만 더 고르면 만석이에요.",
      ],
      full: [
        "딱 5개! 완벽해요.",
        "이제 다음 단계로 가볼까요?",
      ],
    }),
    [picks.size]
  );

  const bucket =
    picks.size === 0
      ? "empty"
      : picks.size === MAX_PICKS
      ? "full"
      : picks.size === MAX_PICKS - 1
      ? "almost"
      : "few";

  // cycle the chosen bucket's lines every few seconds for a "talking" feel
  const list = lines[bucket];
  const [idx, setIdx] = useState(0);
  React.useEffect(() => {
    setIdx(0);
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 3800);
    return () => clearInterval(t);
  }, [bucket, list.length]);

  const message = list[idx];
  const talking = picks.size > 0;

  return (
    <div
      style={{
        marginTop: "auto",
        position: "relative",
        paddingTop: 8,
      }}
    >
      {/* Bubble — anchored above Shori, with a tail pointing down */}
      <div style={{ paddingLeft: 4, paddingRight: 18, marginBottom: 14 }}>
        <SpeechBubble key={message} text={message} />
      </div>

      {/* Shori sitting at bottom-left, peeking out */}
      <div
        style={{
          position: "relative",
          height: 200,
          marginLeft: -22,
          marginRight: -22,
          marginBottom: -24,
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            transform: "translateX(-50%)",
          }}
        >
          <Shori size={300} talking={talking} withShadow={false} />
        </div>

        {/* small "ear" badge with current pick count for fun glanceability */}
        {picks.size > 0 && (
          <div
            style={{
              position: "absolute",
              top: 18,
              right: 28,
              background: "var(--coral-500)",
              color: "var(--cream)",
              fontFamily: "var(--font-mono)",
              fontWeight: 800,
              fontSize: 11,
              padding: "4px 9px",
              borderRadius: 999,
              boxShadow: "2px 3px 0 var(--coral-700)",
              border: "1.5px solid var(--coral-700)",
              transform: "rotate(-6deg)",
              animation: "bubble-pop 220ms cubic-bezier(.2,.9,.3,1.4) both",
              pointerEvents: "auto",
            }}
            key={picks.size}
          >
            +{picks.size}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TOC list — chapter > sections (sections are pickable)
// ─────────────────────────────────────────────────────────────

function PickCheckbox({ checked, disabled, onChange }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      style={{
        width: 26,
        height: 26,
        borderRadius: 8,
        border: checked ? "2px solid var(--coral-500)" : "2px solid var(--hairline-strong)",
        background: checked ? "var(--coral-500)" : "var(--cream)",
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        boxShadow: checked ? "2px 3px 0 var(--coral-700)" : "2px 2px 0 var(--stamp-soft)",
        transition: "all 120ms",
        opacity: disabled && !checked ? 0.4 : 1,
      }}
    >
      {checked && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M 3 7.5 L 5.8 10.2 L 11 4.5" stroke="var(--cream)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function SectionRow({ section, picked, locked, onToggle, idx }) {
  return (
    <div
      onClick={() => !locked && onToggle()}
      style={{
        display: "grid",
        gridTemplateColumns: "26px 56px 1fr auto",
        gap: 16,
        alignItems: "center",
        padding: "14px 18px 14px 14px",
        borderRadius: 12,
        background: picked ? "var(--coral-50)" : "transparent",
        border: picked ? "1.5px solid var(--coral-500)" : "1.5px solid transparent",
        cursor: locked ? "not-allowed" : "pointer",
        transition: "all 120ms",
        marginLeft: 14,
      }}
      onMouseEnter={(e) => {
        if (!picked && !locked) e.currentTarget.style.background = "var(--cloud)";
      }}
      onMouseLeave={(e) => {
        if (!picked) e.currentTarget.style.background = "transparent";
      }}
    >
      <PickCheckbox checked={picked} disabled={locked} onChange={onToggle} />

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          fontWeight: 700,
          color: picked ? "var(--coral-700)" : "var(--ink-mute)",
          textAlign: "left",
        }}
      >
        {section.num}
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: -0.1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {section.title}
        </div>
        <div
          style={{
            marginTop: 3,
            fontSize: 11,
            color: "var(--ink-mute)",
            fontFamily: "var(--font-mono)",
            display: "flex",
            gap: 12,
          }}
        >
          <span>p.{section.pageRange}</span>
          <span style={{ color: "var(--ink-faint)" }}>·</span>
          <span>{section.pages}쪽</span>
        </div>
      </div>

      {picked ? (
        <span
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "var(--coral-500)",
            color: "var(--cream)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontWeight: 800,
            fontSize: 11,
          }}
        >
          {idx}
        </span>
      ) : (
        <span style={{ width: 24 }} />
      )}
    </div>
  );
}

function ChapterBlock({ chapter, picks, onToggle, locked, getOrder }) {
  const pickedInChapter = chapter.sections.filter((s) => picks.has(s.id)).length;
  return (
    <div
      style={{
        background: "var(--cream)",
        border: "1.5px solid var(--hairline-strong)",
        borderRadius: 16,
        padding: "18px 18px 14px",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Chapter header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "var(--coral-500)",
            color: "var(--cream)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-display)",
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: -0.4,
            boxShadow: "3px 4px 0 var(--coral-700)",
            flexShrink: 0,
          }}
        >
          {chapter.num.replace("장", "")}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              fontWeight: 800,
              color: "var(--ink)",
              letterSpacing: -0.4,
            }}
          >
            {chapter.num} · {chapter.title}
          </div>
          <div style={{ marginTop: 3, fontSize: 12, color: "var(--ink-mute)", fontFamily: "var(--font-mono)" }}>
            p.{chapter.pageRange} · {chapter.pages}쪽 · 소단원 {chapter.sections.length}개
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: pickedInChapter > 0 ? "var(--coral-700)" : "var(--ink-mute)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {pickedInChapter > 0 ? `${pickedInChapter}개 선택` : "—"}
        </div>
      </div>

      <div style={{ height: 1, background: "var(--hairline)", margin: "14px 0 6px" }} />

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {chapter.sections.map((s) => {
          const picked = picks.has(s.id);
          return (
            <SectionRow
              key={s.id}
              section={s}
              picked={picked}
              locked={locked && !picked}
              onToggle={() => onToggle(s.id)}
              idx={getOrder(s.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main TOC view
// ─────────────────────────────────────────────────────────────

function TocView({ tweaks }) {
  const [picks, setPicks] = useState(new Map());

  // Tweak: pre-fill the first N sections for fast preview of selected/empty states
  React.useEffect(() => {
    const n = Math.min(tweaks.selectionCount, MAX_PICKS);
    const taken = ALL_SECTIONS.slice(0, n);
    setPicks(new Map(taken.map((s, i) => [s.id, i + 1])));
  }, [tweaks.selectionCount]);

  const togglePick = (id) => {
    setPicks((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
        const ordered = [...next.entries()].sort((a, b) => a[1] - b[1]);
        const final = new Map();
        ordered.forEach(([k], i) => final.set(k, i + 1));
        return final;
      }
      if (next.size >= MAX_PICKS) return prev;
      next.set(id, next.size + 1);
      return next;
    });
  };

  const getOrder = (id) => picks.get(id);
  const lockedAtMax = picks.size >= MAX_PICKS;
  const totalSections = ALL_SECTIONS.length;

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0, background: "var(--cloud)" }}>
      {tweaks.showSidebar && <PdfSummary picks={picks} />}

      {/* Main column */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          position: "relative",
        }}
      >
        <div style={{ padding: "28px 40px 140px", maxWidth: 980, margin: "0 auto" }}>
          {/* Step indicator */}
          <StepIndicator active={2} />

          {/* Headline */}
          <div style={{ marginTop: 22 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.7,
                textTransform: "uppercase",
                color: "var(--coral-700)",
                marginBottom: 6,
              }}
            >
              목차를 분석했어요
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 32,
                fontWeight: 900,
                letterSpacing: -1.0,
                color: "var(--ink)",
                lineHeight: 1.1,
                textWrap: "balance",
              }}
            >
              어떤 단원으로 <span style={{ color: "var(--coral-500)" }}>한 입</span> 만들까요?
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.55, maxWidth: 580 }}>
              총 {TOC.length}개 장 · {totalSections}개 소단원을 찾았어요. 한 번에 최대 <strong>5개</strong>까지 골라서 숏폼으로 만들 수 있어요.
            </div>
          </div>

          {/* TOC */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 24 }}>
            {TOC.map((ch) => (
              <ChapterBlock
                key={ch.id}
                chapter={ch}
                picks={picks}
                onToggle={togglePick}
                locked={lockedAtMax}
                getOrder={getOrder}
              />
            ))}
          </div>
        </div>

        {/* Sticky footer action bar */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(180deg, rgba(245,239,232,0) 0%, var(--cloud) 28%)",
            padding: "20px 40px 22px",
          }}
        >
          <div
            style={{
              maxWidth: 980,
              margin: "0 auto",
              background: "var(--cream)",
              border: "1.5px solid var(--hairline-strong)",
              borderRadius: 16,
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              boxShadow: "0 12px 28px rgba(26,22,20,0.07), 3px 4px 0 var(--stamp-soft)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 800,
                color: picks.size === 0 ? "var(--ink-mute)" : "var(--coral-700)",
                background: picks.size === 0 ? "var(--cloud)" : "var(--coral-50)",
                border: "1.5px solid",
                borderColor: picks.size === 0 ? "var(--hairline-strong)" : "var(--coral-100)",
                padding: "6px 12px",
                borderRadius: 999,
              }}
            >
              {picks.size} / {MAX_PICKS} 선택
            </div>

            {picks.size > 0 && (
              <div style={{ minWidth: 0, flex: 1, fontSize: 13, color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {[...picks.entries()]
                  .sort((a, b) => a[1] - b[1])
                  .map(([id]) => ALL_SECTIONS.find((s) => s.id === id)?.title)
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            )}
            {picks.size === 0 && (
              <div style={{ flex: 1, fontSize: 13, color: "var(--ink-mute)" }}>
                만들고 싶은 소단원을 골라 주세요.
              </div>
            )}

            <Btn variant="ghost" size="md">뒤로</Btn>
            <Btn variant="primary" size="md" disabled={picks.size === 0}>
              {picks.size === 0 ? "다음" : `${picks.size}개로 다음 →`}
            </Btn>
          </div>
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
            <TocView tweaks={tweaks} />
          </div>
        </div>
      </div>

      <TweaksPanel title="Tweaks">
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
          label="좌측 요약"
          value={tweaks.showSidebar}
          onChange={(v) => setTweak("showSidebar", v)}
        />

        <TweakSection label="미리보기" />
        <TweakSlider
          label="기본 선택 개수"
          value={tweaks.selectionCount}
          min={0}
          max={5}
          step={1}
          onChange={(v) => setTweak("selectionCount", v)}
        />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
