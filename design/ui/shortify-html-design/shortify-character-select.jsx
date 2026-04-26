// Shortify — Step 3: pick a narrator character (4 options).
// Brand tokens + keyframes are defined in Shortify Character Select.html.

const { useState, useMemo } = React;

// ─────────────────────────────────────────────────────────────
// Mock state carried over from Step 2 (TOC pick recap)
// ─────────────────────────────────────────────────────────────

const PDF_META = {
  filename: "고등 물리학 I.pdf",
  pages: 412,
};

// 3 of the chapters the user picked in step 2 — shown as a recap.
const PICKED_RECAP = [
  { num: "1.1", title: "물리량과 단위" },
  { num: "2.2", title: "등가속도 운동" },
  { num: "3.1", title: "운동량 보존" },
];

// ─────────────────────────────────────────────────────────────
// Character roster
// ─────────────────────────────────────────────────────────────

const CHARACTERS = [
  {
    id: "shori",
    name: "쇼리",
    tagline: "기본 마스코트",
    desc: "톡톡 튀는 한 입 가이드. 어디든 잘 어울리는 만능 친구예요.",
    voice: "밝고 친근한",
    pace: "빠름",
    color: "var(--coral-500)",
    bg: "linear-gradient(135deg, #FFE7DC 0%, #FFD3C0 100%)",
    badge: "추천",
    locked: false,
    asset: "shori",
  },
  {
    id: "luna",
    name: "루나",
    tagline: "차분한 해설가",
    desc: "한 박자 천천히 설명해 줘요. 개념이 무거운 단원에 어울려요.",
    voice: "차분하고 또렷한",
    pace: "보통",
    color: "#7A6CF0",
    bg: "linear-gradient(135deg, #E5E1FA 0%, #C8C0F0 100%)",
    badge: null,
    locked: false,
    asset: "placeholder",
  },
  {
    id: "pico",
    name: "피코",
    tagline: "장난기 많은 친구",
    desc: "리듬감 있는 말투로 흥미를 끌어요. 짧은 단원에 잘 맞아요.",
    voice: "발랄하고 빠른",
    pace: "매우 빠름",
    color: "#3FB8AF",
    bg: "linear-gradient(135deg, #DFF4F0 0%, #B6E4DC 100%)",
    badge: null,
    locked: false,
    asset: "placeholder",
  },
  {
    id: "eddy",
    name: "에디",
    tagline: "진지한 튜터",
    desc: "수험·전공 자료에 어울리는 또렷한 진행. 곧 만나요.",
    voice: "또박또박한",
    pace: "느림",
    color: "#C58A4A",
    bg: "linear-gradient(135deg, #F2E6D6 0%, #DFC9A9 100%)",
    badge: null,
    locked: true,
    asset: "placeholder",
  },
];

// ─────────────────────────────────────────────────────────────
// Mascot (Shori) — same idle/talk motion as step 2
// ─────────────────────────────────────────────────────────────

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

// Speech bubble — same as step 2
function SpeechBubble({ text }) {
  const [phase, setPhase] = useState("typing");
  React.useEffect(() => {
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
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Buttons + brand mark — identical to step 2
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
// Wizard step indicator (active = 3)
// ─────────────────────────────────────────────────────────────

function StepIndicator({ active = 3 }) {
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
// Left rail — recap of step 2 picks + Shori coach
// ─────────────────────────────────────────────────────────────

function SideRail({ selected }) {
  const character = CHARACTERS.find((c) => c.id === selected);
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

      {/* PDF recap */}
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
          이번에 만들 영상
        </div>
        <div
          style={{
            background: "var(--cream)",
            border: "1.5px solid var(--hairline-strong)",
            borderRadius: 14,
            padding: "12px 14px",
            boxShadow: "3px 4px 0 var(--stamp-soft)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--ink-mute)",
              fontFamily: "var(--font-mono)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={PDF_META.filename}
          >
            {PDF_META.filename}
          </div>
          <div style={{ height: 1, background: "var(--hairline)", margin: "10px 0" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PICKED_RECAP.map((s, i) => (
              <div key={s.num} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "var(--coral-500)",
                    color: "var(--cream)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 800,
                    fontSize: 10,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--ink)",
                      letterSpacing: -0.1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.title}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--ink-mute)", fontFamily: "var(--font-mono)" }}>
                    {s.num}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Currently picked character summary */}
      <div
        style={{
          background: character ? "var(--coral-50)" : "var(--cloud)",
          border: character ? "1.5px solid var(--coral-100)" : "1.5px dashed var(--hairline-strong)",
          borderRadius: 14,
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.7,
            textTransform: "uppercase",
            color: character ? "var(--coral-700)" : "var(--ink-mute)",
            marginBottom: 6,
          }}
        >
          선택된 내레이터
        </div>
        {character ? (
          <>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: -0.4,
                color: "var(--ink)",
              }}
            >
              {character.name}
            </div>
            <div style={{ marginTop: 2, fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>
              {character.tagline}
            </div>
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
              <Chip>{character.voice}</Chip>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
            마음에 드는 내레이터를 골라 주세요.
          </div>
        )}
      </div>

      {/* Shori coach */}
      <ShoriPanel selected={selected} />
    </aside>
  );
}

function Chip({ children }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        color: "var(--coral-700)",
        background: "var(--cream)",
        border: "1px solid var(--coral-100)",
        padding: "3px 8px",
        borderRadius: 999,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function ShoriPanel({ selected }) {
  const lines = useMemo(() => {
    if (!selected) return ["누구로 만들까요?", "취향껏 골라봐요."];
    if (selected === "shori") return ["저예요 저! 잘 부탁해요.", "어디든 잘 어울려요."];
    if (selected === "luna") return ["루나는 차분해서 멋져요.", "개념 정리에 딱이에요."];
    if (selected === "pico") return ["피코랑 가면 신나요!", "짧은 단원에 추천!"];
    if (selected === "eddy") return ["에디는 곧 만나요.", "조금만 기다려 주세요!"];
    return ["좋은 선택이에요!"];
  }, [selected]);

  const [idx, setIdx] = useState(0);
  React.useEffect(() => {
    setIdx(0);
    const t = setInterval(() => setIdx((i) => (i + 1) % lines.length), 3800);
    return () => clearInterval(t);
  }, [lines]);

  return (
    <div style={{ marginTop: "auto", position: "relative", paddingTop: 8 }}>
      <div style={{ paddingLeft: 4, paddingRight: 18, marginBottom: 14 }}>
        <SpeechBubble key={lines[idx]} text={lines[idx]} />
      </div>
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
          <Shori size={300} talking={!!selected} withShadow={false} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Character card
// ─────────────────────────────────────────────────────────────

function CharacterPortrait({ character, picked }) {
  // Real Shori art for the shori card; otherwise a placeholder silhouette
  // that hints at "another mascot is coming" without faking final art.
  if (character.asset === "shori") {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 220,
          borderRadius: 14,
          background: character.bg,
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <img
          src="assets/shori.png"
          alt="쇼리"
          style={{
            position: "absolute",
            bottom: -28,
            width: 200,
            height: 200,
            objectFit: "contain",
            transformOrigin: "50% 88%",
            animation: picked
              ? "shori-talk 0.9s cubic-bezier(.45,0,.55,1) infinite"
              : "shori-idle 2.6s cubic-bezier(.45,0,.55,1) infinite",
          }}
        />
      </div>
    );
  }

  // Placeholder: dotted-bordered "image area", soft silhouette circle,
  // "준비 중" caption — communicates "art coming soon" honestly.
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 220,
        borderRadius: 14,
        background: character.bg,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* dotted overlay frame */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 12,
          borderRadius: 10,
          border: `2px dashed ${character.color}66`,
          pointerEvents: "none",
        }}
      />
      {/* silhouette blob */}
      <div
        style={{
          width: 130,
          height: 130,
          borderRadius: "50%",
          background: `${character.color}33`,
          border: `2px solid ${character.color}55`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: 56,
          color: character.color,
          letterSpacing: -2,
          opacity: 0.85,
        }}
      >
        {character.name.charAt(0)}
      </div>
      {/* "image placeholder" tag */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: character.color,
          background: "rgba(255,255,255,0.7)",
          border: `1px solid ${character.color}55`,
          padding: "3px 7px",
          borderRadius: 999,
        }}
      >
        Placeholder
      </div>
    </div>
  );
}

function CharacterCard({ character, picked, onPick }) {
  const { locked } = character;
  return (
    <button
      onClick={() => !locked && onPick(character.id)}
      disabled={locked}
      style={{
        textAlign: "left",
        position: "relative",
        background: locked ? "var(--cloud)" : "var(--cream)",
        border: picked
          ? "2px solid var(--coral-500)"
          : locked
          ? "1.5px dashed var(--hairline-strong)"
          : "1.5px solid var(--hairline-strong)",
        borderRadius: 18,
        padding: 16,
        cursor: locked ? "not-allowed" : "pointer",
        boxShadow: picked
          ? "4px 6px 0 var(--coral-700), 0 12px 28px rgba(255,107,74,0.18)"
          : locked
          ? "none"
          : "3px 4px 0 var(--stamp-soft)",
        transition: "all 160ms cubic-bezier(.2,.9,.3,1.1)",
        // de-emphasized but still readable; the strong overlay banner does the
        // heavy lifting for "this is locked" so we don't need to wash it out.
        opacity: locked ? 0.55 : 1,
        filter: locked ? "saturate(0.5)" : "none",
        fontFamily: "var(--font-sans)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
      onMouseEnter={(e) => {
        if (locked || picked) return;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "4px 6px 0 var(--stamp-deep), 0 12px 28px rgba(26,22,20,0.10)";
      }}
      onMouseLeave={(e) => {
        if (locked || picked) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "3px 4px 0 var(--stamp-soft)";
      }}
    >
      {/* picked stamp — order number, top-right */}
      {picked && (
        <div
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--coral-500)",
            color: "var(--cream)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontWeight: 900,
            fontSize: 14,
            border: "2.5px solid var(--cream)",
            boxShadow: "2px 3px 0 var(--coral-700)",
            transform: "rotate(-8deg)",
            animation: "bubble-pop 220ms cubic-bezier(.2,.9,.3,1.4) both",
          }}
        >
          ✓
        </div>
      )}

      {/* badges (recommended / locked) */}
      {character.badge && !locked && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 2,
            background: "var(--mint-500)",
            color: "var(--mint-900)",
            fontFamily: "var(--font-mono)",
            fontWeight: 800,
            fontSize: 10,
            padding: "4px 9px",
            borderRadius: 999,
            border: "1.5px solid var(--mint-900)",
            boxShadow: "2px 2px 0 var(--mint-900)",
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
        >
          ★ {character.badge}
        </div>
      )}
      {locked && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            // bring color back inside the banner so it pops against the desaturated card
            filter: "saturate(2)",
          }}
        >
          <div
            style={{
              transform: "rotate(-8deg)",
              background: "var(--ink)",
              color: "var(--cream)",
              fontFamily: "var(--font-display)",
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              padding: "10px 24px 10px 22px",
              borderRadius: 8,
              border: "2.5px solid var(--cream)",
              boxShadow: "4px 5px 0 rgba(26,22,20,0.35), 0 0 0 1.5px var(--ink)",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              whiteSpace: "nowrap",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="5.5" width="8" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M 3.7 5.5 V 4 a 2.3 2.3 0 0 1 4.6 0 V 5.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            Coming&nbsp;soon
          </div>
        </div>
      )}

      <CharacterPortrait character={character} picked={picked} />

      {/* name + tagline */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: -0.6,
              color: "var(--ink)",
            }}
          >
            {character.name}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ink-mute)",
              letterSpacing: -0.1,
            }}
          >
            {character.tagline}
          </div>
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            color: "var(--ink-soft)",
            lineHeight: 1.5,
            textWrap: "pretty",
          }}
        >
          {character.desc}
        </div>
      </div>

      {/* voice meta */}
      <div
        style={{
          display: "flex",
          gap: 10,
          paddingTop: 10,
          borderTop: "1px dashed var(--hairline-strong)",
        }}
      >
        <Meta label="목소리" value={character.voice} />
        <div style={{ flex: 1 }} />
        <span
          role="button"
          tabIndex={locked ? -1 : 0}
          onClick={(e) => {
            e.stopPropagation();
            // no-op — preview not wired in mock
          }}
          onKeyDown={(e) => {
            if (locked) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          aria-disabled={locked}
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: 11,
            color: locked ? "var(--ink-faint)" : character.color,
            background: "transparent",
            border: `1.5px solid ${locked ? "var(--hairline-strong)" : character.color + "55"}`,
            borderRadius: 999,
            padding: "5px 11px",
            cursor: locked ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            alignSelf: "center",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill={locked ? "var(--ink-faint)" : character.color}>
            <path d="M 1.5 1 L 7.5 4.5 L 1.5 8 Z" />
          </svg>
          미리듣기
        </span>
      </div>
    </button>
  );
}

function Meta({ label, value }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: 0.7,
          textTransform: "uppercase",
          color: "var(--ink-mute)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 2,
          fontSize: 12,
          fontWeight: 700,
          color: "var(--ink)",
          letterSpacing: -0.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main view
// ─────────────────────────────────────────────────────────────

function CharacterSelectView({ tweaks, setTweak }) {
  const selected = tweaks.selectedCharacter;
  const character = CHARACTERS.find((c) => c.id === selected);

  const onPick = (id) => setTweak("selectedCharacter", id);

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0, background: "var(--cloud)" }}>
      {tweaks.showSidebar && <SideRail selected={selected} />}

      <main style={{ flex: 1, minWidth: 0, overflowY: "auto", position: "relative" }}>
        <div style={{ padding: "28px 40px 140px", maxWidth: 980, margin: "0 auto" }}>
          <StepIndicator active={3} />

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
              내레이터를 골라요
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
              누가 <span style={{ color: "var(--coral-500)" }}>설명</span>해 줄까요?
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.55, maxWidth: 580 }}>
              영상에서 안내를 맡을 친구예요. 단원 분위기에 맞춰 골라보세요. 나중에 언제든 바꿀 수 있어요.
            </div>
          </div>

          {/* Character grid */}
          <div
            style={{
              marginTop: 24,
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 18,
            }}
          >
            {CHARACTERS.map((c) => (
              <CharacterCard
                key={c.id}
                character={c}
                picked={selected === c.id}
                onPick={onPick}
              />
            ))}
          </div>
        </div>

        {/* Sticky footer */}
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
                color: character ? "var(--coral-700)" : "var(--ink-mute)",
                background: character ? "var(--coral-50)" : "var(--cloud)",
                border: "1.5px solid",
                borderColor: character ? "var(--coral-100)" : "var(--hairline-strong)",
                padding: "6px 12px",
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              {character ? character.name : "—"}
            </div>

            <div style={{ minWidth: 0, flex: 1, fontSize: 13, color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {character
                ? `${character.name}와(과) 함께 ${PICKED_RECAP.length}개 영상을 만들어요.`
                : "마음에 드는 친구를 골라 주세요."}
            </div>

            <Btn variant="ghost" size="md">뒤로</Btn>
            <Btn variant="primary" size="md" disabled={!character}>
              {character ? "영상 만들기 →" : "다음"}
            </Btn>
          </div>
        </div>
      </main>
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
            <CharacterSelectView tweaks={tweaks} setTweak={setTweak} />
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
        <TweakSelect
          label="기본 선택 캐릭터"
          value={tweaks.selectedCharacter}
          onChange={(v) => setTweak("selectedCharacter", v)}
          options={[
            { value: "", label: "선택 없음" },
            { value: "shori", label: "쇼리 (기본)" },
            { value: "luna", label: "루나" },
            { value: "pico", label: "피코" },
            { value: "eddy", label: "에디 (잠김)" },
          ]}
        />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
