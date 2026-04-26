// Shortify — Step 4: generating the shorts.
// Shows phase progress, the picked character watching, and a Home button.
// Brand tokens + keyframes are defined in Shortify Generating.html.

const { useState, useMemo, useEffect } = React;

// ─────────────────────────────────────────────────────────────
// Mock state carried over from previous steps
// ─────────────────────────────────────────────────────────────

const PDF_META = { filename: "고등 물리학 I.pdf" };

const PICKED_SECTIONS = [
  { num: "1.1", title: "물리량과 단위" },
  { num: "2.2", title: "등가속도 운동" },
  { num: "3.1", title: "운동량 보존" },
  { num: "4.1", title: "에너지의 형태" },
  { num: "5.2", title: "파동의 성질" },
];

const CHARACTER = {
  id: "shori",
  name: "쇼리",
  tagline: "기본 마스코트",
};

const PHASES = [
  { id: "read",    label: "PDF 읽는 중",   range: [0, 18] },
  { id: "outline", label: "스크립트 짜는 중", range: [18, 42] },
  { id: "voice",   label: "목소리 입히는 중", range: [42, 68] },
  { id: "render",  label: "영상 합치는 중", range: [68, 94] },
  { id: "finish",  label: "마무리",        range: [94, 100] },
];

// ─────────────────────────────────────────────────────────────
// Mascot
// ─────────────────────────────────────────────────────────────

function Shori({ size = 240, talking = true, withShadow = true }) {
  return (
    <div
      style={{
        position: "relative",
        width: size, height: size,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {withShadow && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "50%", bottom: 4,
            transform: "translateX(-50%)",
            width: size * 0.6, height: size * 0.07,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(26,22,20,0.22) 0%, rgba(26,22,20,0) 70%)",
            animation: "shori-shadow 2.6s cubic-bezier(.45,0,.55,1) infinite",
          }}
        />
      )}
      <img
        src="assets/shori.png"
        alt="쇼리"
        style={{
          width: size, height: size,
          display: "block", objectFit: "contain",
          transformOrigin: "50% 88%",
          animation: talking
            ? "shori-talk 0.9s cubic-bezier(.45,0,.55,1) infinite"
            : "shori-idle 2.6s cubic-bezier(.45,0,.55,1) infinite",
        }}
      />
    </div>
  );
}

function SpeechBubble({ text }) {
  const [phase, setPhase] = useState("typing");
  useEffect(() => {
    setPhase("typing");
    const t = setTimeout(() => setPhase("shown"), 500);
    return () => clearTimeout(t);
  }, [text]);
  return (
    <div
      style={{
        position: "relative",
        background: "var(--cream)",
        border: "1.5px solid var(--hairline-strong)",
        borderRadius: 18,
        boxShadow: "3px 4px 0 var(--stamp-soft), 0 8px 18px rgba(26,22,20,0.05)",
        padding: "14px 18px",
        minHeight: 52,
        display: "inline-flex",
        alignItems: "center",
        animation: "bubble-pop 220ms cubic-bezier(.2,.9,.3,1.4) both",
        maxWidth: 320,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%", bottom: -10,
          marginLeft: -8,
          width: 16, height: 16,
          background: "var(--cream)",
          borderRight: "1.5px solid var(--hairline-strong)",
          borderBottom: "1.5px solid var(--hairline-strong)",
          transform: "rotate(45deg)",
          borderBottomRightRadius: 3,
        }}
      />
      {phase === "typing" ? (
        <div style={{ display: "inline-flex", gap: 5, padding: "4px 2px" }}>
          {[0, 1, 2].map((i) => (
            <span key={i}
              style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "var(--ink-faint)", display: "inline-block",
                animation: `bubble-dot 1s cubic-bezier(.45,0,.55,1) ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      ) : (
        <div style={{
          fontSize: 14, lineHeight: 1.5, color: "var(--ink)",
          letterSpacing: -0.1, animation: "bubble-text 220ms ease-out both",
          textWrap: "pretty", textAlign: "center", width: "100%",
        }}>
          {text}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Buttons
// ─────────────────────────────────────────────────────────────

function Btn({ children, variant = "secondary", size = "md", onClick, disabled, style = {} }) {
  const base = {
    fontFamily: "var(--font-sans)", fontWeight: 700,
    border: "1.5px solid transparent", borderRadius: 999,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 120ms cubic-bezier(0.2,0,0,1)",
    whiteSpace: "nowrap", lineHeight: 1, letterSpacing: -0.1,
    opacity: disabled ? 0.45 : 1,
  };
  const sizes = {
    sm: { fontSize: 12, padding: "7px 14px" },
    md: { fontSize: 13, padding: "10px 18px" },
    lg: { fontSize: 15, padding: "14px 24px" },
  };
  const variants = {
    primary: {
      background: "var(--coral-500)", color: "var(--cream)",
      borderColor: "var(--coral-500)",
      boxShadow: "3px 5px 0 var(--coral-700), var(--shadow-coral)",
    },
    secondary: {
      background: "var(--cream)", color: "var(--ink)",
      borderColor: "var(--ink-soft)",
      boxShadow: "3px 4px 0 var(--stamp-soft)",
    },
    ghost: {
      background: "transparent", color: "var(--ink-soft)",
      borderColor: "transparent",
    },
  };
  return (
    <button onClick={disabled ? undefined : onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "primary") {
          e.currentTarget.style.background = "var(--coral-700)";
          e.currentTarget.style.transform = "translate(-1px, 2px)";
        }
        if (variant === "secondary") e.currentTarget.style.background = "var(--coral-50)";
        if (variant === "ghost") {
          e.currentTarget.style.background = "var(--coral-50)";
          e.currentTarget.style.color = "var(--coral-700)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = variants[variant].background;
        e.currentTarget.style.transform = "translateY(0)";
        if (variant === "ghost") e.currentTarget.style.color = "var(--ink-soft)";
      }}
    >
      {children}
    </button>
  );
}

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

// ─────────────────────────────────────────────────────────────
// Window chrome
// ─────────────────────────────────────────────────────────────

function TitleBar() {
  const dot = (color) => ({
    width: 12, height: 12, borderRadius: "50%", background: color,
    border: "0.5px solid rgba(0,0,0,0.18)",
  });
  return (
    <div style={{
      height: 48, display: "flex", alignItems: "center",
      padding: "0 18px", gap: 16,
      borderBottom: "1px solid var(--hairline)",
      background: "var(--cream)", flexShrink: 0,
    }}>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={dot("#FF5F57")} />
        <div style={dot("#FEBC2E")} />
        <div style={dot("#28C840")} />
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", letterSpacing: -0.1 }}>
        shortify — 영상 만드는 중
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ width: 52 }} />
    </div>
  );
}

function StepIndicator({ active = 4 }) {
  const steps = [
    { num: 1, label: "PDF 업로드" },
    { num: 2, label: "목차 고르기" },
    { num: 3, label: "캐릭터 선택" },
    { num: 4, label: "생성" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
      {steps.map((s, i) => {
        const isActive = s.num === active;
        const isDone = s.num < active;
        return (
          <React.Fragment key={s.num}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 12px 6px 6px", borderRadius: 999,
              background: isActive ? "var(--coral-500)" : isDone ? "var(--cream)" : "transparent",
              border: isActive ? "1.5px solid var(--coral-500)"
                : isDone ? "1.5px solid var(--mint-500)"
                : "1.5px solid var(--hairline-strong)",
              color: isActive ? "var(--cream)" : isDone ? "var(--mint-900)" : "var(--ink-mute)",
              fontSize: 12, fontWeight: 700,
              boxShadow: isActive ? "3px 4px 0 var(--coral-700)" : "none",
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%",
                background: isActive ? "var(--cream)" : isDone ? "var(--mint-500)" : "var(--cloud)",
                color: isActive ? "var(--coral-700)" : isDone ? "var(--cream)" : "var(--ink-mute)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 11,
              }}>
                {isDone ? "✓" : s.num}
              </span>
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 16, height: 2,
                background: s.num < active ? "var(--mint-500)" : "var(--hairline-strong)",
                borderRadius: 1,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────────────────────

function ProgressBar({ value }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 18,
        borderRadius: 999,
        background: "var(--cream)",
        border: "1.5px solid var(--hairline-strong)",
        overflow: "hidden",
        boxShadow: "inset 2px 2px 0 rgba(26,22,20,0.04)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 2,
          width: `calc(${value}% - 4px)`,
          minWidth: 0,
          background: "var(--coral-500)",
          borderRadius: 999,
          transition: "width 600ms cubic-bezier(.45,0,.55,1)",
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 8px, transparent 8px 18px)",
          backgroundSize: "30px 100%",
          animation: "progress-stripes 1.2s linear infinite",
          boxShadow: "0 1px 0 var(--coral-700)",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Phase list (mini step ladder for each generation phase)
// ─────────────────────────────────────────────────────────────

function PhaseList({ progress }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {PHASES.map((p) => {
        const done = progress >= p.range[1];
        const active = progress >= p.range[0] && progress < p.range[1];
        const pending = !done && !active;
        return (
          <div key={p.id} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px",
            background: active ? "var(--coral-50)" : "var(--cream)",
            border: active
              ? "1.5px solid var(--coral-500)"
              : "1.5px solid var(--hairline-strong)",
            borderRadius: 12,
            boxShadow: active ? "3px 4px 0 var(--coral-700)" : "2px 3px 0 var(--stamp-soft)",
            opacity: pending ? 0.55 : 1,
            transition: "all 220ms",
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: "50%",
              background: done ? "var(--mint-500)" : active ? "var(--coral-500)" : "var(--cloud)",
              color: done || active ? "var(--cream)" : "var(--ink-mute)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 11,
              border: "1.5px solid",
              borderColor: done ? "var(--mint-900)" : active ? "var(--coral-700)" : "var(--hairline-strong)",
              flexShrink: 0,
            }}>
              {done ? "✓" : active ? (
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "var(--cream)",
                  animation: "pulse-dot 1s ease-in-out infinite",
                }} />
              ) : "·"}
            </span>
            <div style={{
              flex: 1, fontSize: 14, fontWeight: 700,
              color: pending ? "var(--ink-mute)" : "var(--ink)",
              letterSpacing: -0.1,
            }}>
              {p.label}
            </div>
            {active && (
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 800,
                color: "var(--coral-700)",
              }}>
                진행 중
              </div>
            )}
            {done && (
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 800,
                color: "var(--mint-900)",
              }}>
                완료
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Generating view
// ─────────────────────────────────────────────────────────────

function GeneratingView({ tweaks }) {
  // Auto-advance progress unless tweaks override
  const [auto, setAuto] = useState(tweaks.progress);
  useEffect(() => {
    setAuto(tweaks.progress);
  }, [tweaks.progress]);
  useEffect(() => {
    const t = setInterval(() => {
      setAuto((p) => (p >= 99 ? p : p + 1));
    }, 700);
    return () => clearInterval(t);
  }, []);
  const progress = Math.min(99, Math.max(0, auto));

  const currentPhase =
    PHASES.find((p) => progress >= p.range[0] && progress < p.range[1]) || PHASES[PHASES.length - 1];

  // Bubble lines per phase
  const bubble = useMemo(() => ({
    read:    "PDF 한 장씩 꼼꼼히 보고 있어요…",
    outline: "재밌는 한 입 사이즈로 잘라볼게요!",
    voice:   "자, 마이크 체크 — 하나, 둘!",
    render:  "그림이랑 자막을 입히는 중이에요.",
    finish:  "거의 다 됐어요, 조금만 더!",
  }), []);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", minHeight: 0,
      background: "var(--cloud)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* soft floating spark dots in background */}
      <div aria-hidden="true" style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage:
          "radial-gradient(circle at 12% 20%, rgba(255,107,74,0.10) 0 3px, transparent 4px)," +
          "radial-gradient(circle at 84% 30%, rgba(91,212,168,0.10) 0 2px, transparent 3px)," +
          "radial-gradient(circle at 70% 78%, rgba(255,200,61,0.12) 0 2.5px, transparent 3.5px)," +
          "radial-gradient(circle at 22% 80%, rgba(74,155,255,0.10) 0 2px, transparent 3px)",
        backgroundSize: "100% 100%",
      }} />

      {/* Top: home button + step indicator */}
      <div style={{
        display: "flex", alignItems: "center", padding: "20px 28px",
        gap: 16, position: "relative", zIndex: 1,
      }}>
        <ShortifyMark size={20} />
        <Btn variant="ghost" size="sm" style={{ marginLeft: -6 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M 1.5 6 L 6 1.5 L 10.5 6 M 3 5 V 10 H 9 V 5"
                stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            홈으로 돌아가기
          </span>
        </Btn>
        <div style={{ flex: 1 }} />
        <StepIndicator active={4} />
        <div style={{ flex: 1 }} />
        <div style={{ width: 140 }} />
      </div>

      {/* Center hero */}
      <div style={{
        flex: 1, minHeight: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 40px",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          width: "100%", maxWidth: 920,
          display: "grid",
          gridTemplateColumns: "minmax(0, 320px) minmax(0, 1fr)",
          gap: 40,
          alignItems: "center",
        }}>
          {/* Left: character + speech bubble */}
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 18,
          }}>
            <SpeechBubble key={currentPhase.id} text={bubble[currentPhase.id]} />
            <div style={{
              position: "relative",
              padding: "14px 20px 0",
              background: "var(--cream)",
              border: "1.5px solid var(--hairline-strong)",
              borderRadius: 22,
              boxShadow: "4px 5px 0 var(--stamp-soft), 0 12px 28px rgba(26,22,20,0.06)",
            }}>
              {/* small spotlight wash behind shori */}
              <div aria-hidden="true" style={{
                position: "absolute", inset: 0, borderRadius: 22,
                background:
                  "radial-gradient(ellipse at 50% 70%, rgba(255,107,74,0.18) 0%, transparent 65%)",
                pointerEvents: "none",
              }} />
              <Shori size={240} talking withShadow={false} />
            </div>
            <div style={{
              fontSize: 12, fontWeight: 700, color: "var(--ink-mute)",
              letterSpacing: -0.1,
            }}>
              <span style={{ color: "var(--coral-700)" }}>{CHARACTER.name}</span>가 영상을 만들고 있어요
            </div>
          </div>

          {/* Right: progress + phases */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
            <div>
              <div style={{
                fontSize: 11, fontWeight: 800, letterSpacing: 0.7,
                textTransform: "uppercase", color: "var(--coral-700)",
                marginBottom: 6,
              }}>
                {PDF_META.filename} · {PICKED_SECTIONS.length}개 영상
              </div>
              <div style={{
                fontFamily: "var(--font-display)",
                fontSize: 36, fontWeight: 900,
                letterSpacing: -1.0, color: "var(--ink)",
                lineHeight: 1.1, textWrap: "balance",
              }}>
                <span style={{ color: "var(--coral-500)" }}>영상</span> 만드는 중…
              </div>
              <div style={{
                marginTop: 8, fontSize: 14, color: "var(--ink-soft)",
                lineHeight: 1.55,
              }}>
                창을 닫아도 백그라운드에서 계속 진행돼요. 끝나면 알려드릴게요.
              </div>
            </div>

            {/* Progress headline + bar */}
            <div style={{
              background: "var(--cream)",
              border: "1.5px solid var(--hairline-strong)",
              borderRadius: 16,
              padding: "16px 18px",
              boxShadow: "3px 4px 0 var(--stamp-soft)",
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 32, fontWeight: 900,
                  color: "var(--coral-500)",
                  letterSpacing: -0.6, lineHeight: 1,
                }}>
                  {progress}
                  <span style={{ fontSize: 18, color: "var(--coral-700)" }}>%</span>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{
                  fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 800,
                  color: "var(--ink-mute)",
                }}>
                  {currentPhase.label}
                </div>
              </div>
              <ProgressBar value={progress} />
            </div>

            {/* Phase list */}
            <PhaseList progress={progress} />
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 8, padding: "18px 28px 22px",
        fontSize: 12, color: "var(--ink-mute)",
        position: "relative", zIndex: 1,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--coral-500)",
          animation: "pulse-dot 1.4s ease-in-out infinite",
        }} />
        백그라운드 작업 · 완료 시 알림
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────

function App() {
  const [tweaks, setTweak] = useTweaks(window.__TWEAKS_DEFAULTS);
  const framed = tweaks.windowMode === "framed";

  return (
    <>
      <div style={{
        minHeight: "100vh",
        padding: framed ? "40px 40px 60px" : 0,
        display: "flex", flexDirection: "column",
        alignItems: framed ? "center" : "stretch",
      }}>
        <div style={{
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
          display: "flex", flexDirection: "column",
        }}>
          <TitleBar />
          <div style={{ flex: 1, minHeight: 0 }}>
            <GeneratingView tweaks={tweaks} />
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
        <TweakSection label="진행도" />
        <TweakSlider
          label="시작 진행도"
          value={tweaks.progress}
          min={0} max={99} step={1}
          onChange={(v) => setTweak("progress", v)}
        />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
