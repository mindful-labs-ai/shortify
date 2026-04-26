// Shortify — main screen (monochrome, icon-less hi-fi mock)
// Loaded after tweaks-panel.jsx; uses TweaksPanel + Tweak controls + useTweaks.

const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────
// Mock data — only used when state === "filled"
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
    stageLabel: "내레이션 생성 중",
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
    stageLabel: "이미지 컨셉 선택 대기",
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

// ─────────────────────────────────────────────────────────────
// Generic atoms — neutral, icon-less
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

function Tag({ children, strong = false }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: 0,
        padding: "2px 7px",
        borderRadius: 4,
        background: strong ? "var(--n-900)" : "var(--n-100)",
        color: strong ? "var(--n-0)" : "var(--n-700)",
        border: strong ? "none" : "1px solid var(--hairline)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Btn({ children, variant = "secondary", size = "md", onClick, style = {} }) {
  const base = {
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    border: "1px solid transparent",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    transition: "all 120ms cubic-bezier(0.2,0,0,1)",
    whiteSpace: "nowrap",
    lineHeight: 1,
  };
  const sizes = {
    sm: { fontSize: 12, padding: "6px 10px" },
    md: { fontSize: 13, padding: "8px 14px" },
    lg: { fontSize: 14, padding: "11px 18px" },
  };
  const variants = {
    primary: {
      background: "var(--n-900)",
      color: "var(--n-0)",
      borderColor: "var(--n-900)",
    },
    secondary: {
      background: "var(--n-0)",
      color: "var(--n-800)",
      borderColor: "var(--hairline-strong)",
    },
    ghost: {
      background: "transparent",
      color: "var(--n-700)",
      borderColor: "transparent",
    },
  };
  return (
    <button
      onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={(e) => {
        if (variant === "primary") e.currentTarget.style.background = "var(--n-800)";
        if (variant === "secondary") e.currentTarget.style.background = "var(--n-50)";
        if (variant === "ghost") e.currentTarget.style.background = "var(--n-100)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = variants[variant].background;
      }}
    >
      {children}
    </button>
  );
}

// Geometric placeholder for video thumbnails — striped neutral, no real imagery
function ThumbPlaceholder({ ratio = "9 / 16", width = 96, label }) {
  return (
    <div
      style={{
        width,
        aspectRatio: ratio,
        borderRadius: 6,
        border: "1px solid var(--hairline-strong)",
        background:
          "repeating-linear-gradient(135deg, var(--n-100) 0 6px, var(--n-150) 6px 12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--n-500)",
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span style={{ background: "rgba(255,255,255,0.85)", padding: "2px 5px", borderRadius: 2 }}>
        {label || "thumb"}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Window chrome — minimal macOS, monochrome
// ─────────────────────────────────────────────────────────────

function TrafficLights() {
  const dot = {
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: "var(--n-200)",
    border: "0.5px solid var(--hairline-strong)",
  };
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div style={dot} />
      <div style={dot} />
      <div style={dot} />
    </div>
  );
}

function TitleBar({ title = "Shortify" }) {
  return (
    <div
      style={{
        height: 44,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 16,
        borderBottom: "1px solid var(--hairline)",
        background: "var(--n-50)",
        flexShrink: 0,
      }}
    >
      <TrafficLights />
      <div style={{ flex: 1 }} />
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--n-700)",
          letterSpacing: -0.1,
        }}
      >
        {title}
      </div>
      <div style={{ flex: 1 }} />
      {/* right-side spacer to balance traffic lights */}
      <div style={{ width: 52 }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────

function SidebarItem({ label, count, active, indent = 0 }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 30,
        padding: `0 12px 0 ${12 + indent}px`,
        margin: "1px 8px",
        borderRadius: 6,
        background: active ? "var(--n-200)" : "transparent",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: active ? "var(--n-900)" : "var(--n-700)",
      }}
    >
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
      {count != null && (
        <span style={{ fontSize: 11, color: "var(--n-500)", fontVariantNumeric: "tabular-nums" }}>
          {count}
        </span>
      )}
    </div>
  );
}

function Sidebar({ activeKey = "library" }) {
  return (
    <aside
      style={{
        width: 220,
        background: "var(--n-50)",
        borderRight: "1px solid var(--hairline)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Brand block */}
      <div style={{ padding: "20px 20px 16px" }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: -0.4,
            color: "var(--n-900)",
            lineHeight: 1,
          }}
        >
          Shortify
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: "var(--n-500)",
            letterSpacing: 0.2,
            textTransform: "uppercase",
          }}
        >
          Knowledge → Shorts
        </div>
      </div>

      <Hairline style={{ background: "var(--hairline)" }} />

      {/* Section: Workspace */}
      <div style={{ padding: "12px 0 8px" }}>
        <div
          style={{
            padding: "0 20px 6px",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: "var(--n-500)",
          }}
        >
          작업 공간
        </div>
        <SidebarItem label="라이브러리" count={6} active={activeKey === "library"} />
        <SidebarItem label="진행 중" count={2} active={activeKey === "queue"} />
        <SidebarItem label="초안" count={null} active={activeKey === "drafts"} />
      </div>

      <Hairline />

      {/* Section: Sources */}
      <div style={{ padding: "12px 0 8px" }}>
        <div
          style={{
            padding: "0 20px 6px",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: "var(--n-500)",
          }}
        >
          PDF 출처
        </div>
        <SidebarItem label="고등 물리학 I" count={5} />
        <SidebarItem label="천체물리 입문" count={1} />
        <SidebarItem label="모든 출처 보기" />
      </div>

      <div style={{ flex: 1 }} />

      <Hairline />

      {/* Footer: settings */}
      <div style={{ padding: "10px 0 14px" }}>
        <SidebarItem label="설정" />
        <SidebarItem label="API 키" />
        <div
          style={{
            margin: "10px 20px 0",
            fontSize: 11,
            color: "var(--n-500)",
            lineHeight: 1.5,
          }}
        >
          이번 달 누적 비용
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--n-800)",
              marginTop: 2,
            }}
          >
            $14.32
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// Drop zone — three states
// ─────────────────────────────────────────────────────────────

function CharacterSlot({ state, size = "lg" }) {
  // Reserved space for the mascot — no real character drawn yet, just a labeled placeholder.
  // state hints at the pose/expression the character should take in this layout.
  const poseLabel =
    state === "dragover"
      ? "캐릭터 — 손 뻗는 포즈"
      : state === "filled"
      ? "캐릭터 — 인사 포즈"
      : "캐릭터 — 기본 포즈";

  const dims =
    size === "sm"
      ? { w: 88, h: 110 }
      : size === "md"
      ? { w: 160, h: 200 }
      : { w: 220, h: 280 };

  return (
    <div
      aria-label="character placeholder"
      style={{
        width: dims.w,
        height: dims.h,
        flexShrink: 0,
        borderRadius: 16,
        border: "1.5px dashed var(--n-300)",
        background:
          "repeating-linear-gradient(135deg, var(--n-50) 0 8px, var(--n-100) 8px 16px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        color: "var(--n-500)",
        textAlign: "center",
        padding: 16,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: "var(--n-500)",
          background: "var(--n-0)",
          padding: "3px 8px",
          borderRadius: 4,
          border: "1px solid var(--hairline)",
        }}
      >
        Character
      </span>
      <span style={{ fontSize: 12, color: "var(--n-600)", lineHeight: 1.4 }}>
        {poseLabel}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          color: "var(--n-400)",
        }}
      >
        {dims.w} × {dims.h}
      </span>
    </div>
  );
}

function DropZone({ state }) {
  // state: "empty" | "filled" | "dragover"
  const isHover = state === "dragover";
  const compact = state === "filled";

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "var(--radius-xl)",
        background: isHover ? "var(--n-0)" : "var(--n-50)",
        border: isHover
          ? "2px dashed var(--n-900)"
          : "1.5px dashed var(--n-300)",
        transition: "all 200ms cubic-bezier(0.2,0,0,1)",
        padding: compact ? "24px 28px" : "48px 44px",
        boxShadow: isHover ? "var(--shadow-md)" : "none",
        transform: isHover ? "scale(1.005)" : "scale(1)",
      }}
    >
      {/* Empty / dragover state — two-column: copy + character */}
      {!compact && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 220px",
            gap: 40,
            alignItems: "center",
            minHeight: 360,
          }}
        >
          {/* Left: copy + CTA */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: "var(--n-500)",
                marginBottom: 16,
              }}
            >
              새 작업 시작
            </div>
            <div
              style={{
                fontSize: 42,
                fontWeight: 800,
                letterSpacing: -1.2,
                lineHeight: 1.05,
                color: isHover ? "var(--n-900)" : "var(--n-800)",
                textWrap: "balance",
              }}
            >
              {isHover ? "놓으면 시작합니다" : "PDF를 끌어다 놓으세요"}
            </div>
            <div
              style={{
                marginTop: 16,
                fontSize: 15,
                color: "var(--n-600)",
                maxWidth: 460,
                lineHeight: 1.55,
                textWrap: "pretty",
              }}
            >
              교과서·논문·강의 자료를 떨어뜨리면, 목차 단위로 30~60초 학습 숏폼을 만들어 드립니다.
            </div>

            <div
              style={{
                marginTop: 32,
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <Btn variant="primary" size="lg">파일 선택</Btn>
              <Btn variant="secondary" size="lg">샘플 PDF로 시작</Btn>
            </div>

            <div
              style={{
                marginTop: 24,
                fontSize: 12,
                color: "var(--n-500)",
                fontFamily: "var(--font-mono)",
              }}
            >
              PDF · 최대 200MB · 한국어 / 영어 지원
            </div>
          </div>

          {/* Right: character slot */}
          <CharacterSlot state={state} size="lg" />
        </div>
      )}

      {/* Compact filled-state drop zone — slim row + small character */}
      {compact && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <CharacterSlot state={state} size="sm" />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: -0.4,
                color: "var(--n-900)",
              }}
            >
              새 PDF로 숏폼 만들기
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: "var(--n-600)" }}>
              여기에 끌어다 놓거나 파일을 선택하세요. 평균 처리 시간 10~12분.
            </div>
          </div>
          <Btn variant="secondary" size="md">샘플 PDF</Btn>
          <Btn variant="primary" size="md">파일 선택</Btn>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Library — list of generated jobs
// ─────────────────────────────────────────────────────────────

function StatusPill({ status, stageLabel }) {
  const map = {
    done: { label: "완료", strong: false, mono: true },
    rendering: { label: stageLabel || "렌더링 중", strong: true },
    awaiting: { label: stageLabel || "선택 대기", strong: false },
    failed: { label: "실패", strong: false },
  };
  const cfg = map[status] || map.done;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 4,
        background: cfg.strong ? "var(--n-900)" : "var(--n-100)",
        color: cfg.strong ? "var(--n-0)" : "var(--n-700)",
        border: cfg.strong ? "none" : "1px solid var(--hairline)",
        whiteSpace: "nowrap",
      }}
    >
      {/* monochrome status dot — circle only, no icon */}
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.strong ? "var(--n-0)" : "var(--n-500)",
          display: status === "rendering" ? "inline-block" : "inline-block",
          opacity: status === "done" ? 0.4 : 1,
        }}
      />
      {cfg.label}
    </span>
  );
}

function ProgressBar({ value }) {
  return (
    <div
      style={{
        width: "100%",
        height: 3,
        background: "var(--n-200)",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.round(value * 100)}%`,
          height: "100%",
          background: "var(--n-900)",
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
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--n-50)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <ThumbPlaceholder width={density === "compact" ? 36 : 44} label="9:16" />

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--n-900)",
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
            color: "var(--n-500)",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span>{item.source}</span>
          <span style={{ color: "var(--n-300)" }}>·</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>{item.chapter}</span>
        </div>
        {item.status === "rendering" && (
          <div style={{ marginTop: 8, maxWidth: 320 }}>
            <ProgressBar value={item.progress} />
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "var(--n-500)",
                fontFamily: "var(--font-mono)",
              }}
            >
              stage {item.stage}/9 · {item.eta}
            </div>
          </div>
        )}
      </div>

      <StatusPill status={item.status} stageLabel={item.stageLabel} />

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--n-600)",
          fontVariantNumeric: "tabular-nums",
          minWidth: 48,
          textAlign: "right",
        }}
      >
        {item.duration}
      </div>

      <div
        style={{
          fontSize: 12,
          color: "var(--n-500)",
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
        background: "var(--n-0)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "16px 24px",
          gap: 16,
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--n-900)" }}>
            라이브러리
          </div>
          <div style={{ marginTop: 2, fontSize: 12, color: "var(--n-500)" }}>
            지금까지 만든 숏폼 {items.length}편
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: "flex",
            background: "var(--n-100)",
            borderRadius: 6,
            padding: 2,
            gap: 0,
            border: "1px solid var(--hairline)",
          }}
        >
          {["전체", "완료", "진행 중", "실패"].map((t, i) => (
            <button
              key={t}
              style={{
                border: "none",
                background: i === 0 ? "var(--n-0)" : "transparent",
                boxShadow: i === 0 ? "var(--shadow-sm)" : "none",
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: i === 0 ? 600 : 500,
                color: i === 0 ? "var(--n-900)" : "var(--n-600)",
                borderRadius: 4,
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <Btn variant="secondary" size="sm">정렬: 최신순</Btn>
      </div>

      {/* Column header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto auto auto",
          gap: 20,
          padding: "10px 24px",
          alignItems: "center",
          background: "var(--n-50)",
          borderBottom: "1px solid var(--hairline)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: "var(--n-500)",
        }}
      >
        <div style={{ width: density === "compact" ? 36 : 44 }}>썸네일</div>
        <div>제목 · 출처</div>
        <div style={{ minWidth: 80 }}>상태</div>
        <div style={{ minWidth: 48, textAlign: "right" }}>길이</div>
        <div style={{ minWidth: 76, textAlign: "right" }}>생성</div>
      </div>

      {items.map((it) => (
        <LibraryRow key={it.id} item={it} density={density} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty-library hint block
// ─────────────────────────────────────────────────────────────

function EmptyHint() {
  return (
    <div
      style={{
        marginTop: 32,
        padding: "28px 32px",
        background: "var(--n-0)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-lg)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 28,
      }}
    >
      {[
        ["한 PDF · 여러 숏폼", "한 권의 교과서에서 단원별로 5편까지 동시에 생성합니다."],
        ["10~12분 / 1편", "이미지 컨셉을 고른 뒤 평균 10~12분 안에 한 편이 완성됩니다."],
        ["내 키, 내 비용", "BYOK 방식. 실제 사용한 만큼만 본인 API 계정으로 청구됩니다."],
      ].map(([h, p]) => (
        <div key={h}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: "var(--n-500)",
              marginBottom: 6,
            }}
          >
            안내
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--n-900)" }}>{h}</div>
          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "var(--n-600)",
              lineHeight: 1.55,
              textWrap: "pretty",
            }}
          >
            {p}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Recent projects grid — bottom of the home view
// ─────────────────────────────────────────────────────────────

const MOCK_RECENT_PROJECTS = [
  {
    id: "p-01",
    title: "고등 물리학 I",
    subtitle: "역학 단원 모음",
    shortsCount: 5,
    pageRange: "1–142p",
    lastUsed: "오늘 14:22",
    character: { slug: "scholar-otter", name: "스칼라 오터" },
  },
  {
    id: "p-02",
    title: "천체물리 입문",
    subtitle: "케플러 법칙 시리즈",
    shortsCount: 1,
    pageRange: "22–48p",
    lastUsed: "4월 24일",
    character: { slug: "nova-fox", name: "노바 폭스" },
  },
  {
    id: "p-03",
    title: "유기화학 핵심",
    subtitle: "작용기 정리",
    shortsCount: 3,
    pageRange: "60–110p",
    lastUsed: "4월 21일",
    character: { slug: "atom-cat", name: "아톰 캣" },
  },
  {
    id: "p-04",
    title: "선형대수학",
    subtitle: "벡터 공간",
    shortsCount: 2,
    pageRange: "1–58p",
    lastUsed: "4월 18일",
    character: { slug: "scholar-otter", name: "스칼라 오터" },
  },
];

// Tiny avatar placeholder for a character — circle, monogram, no real art yet.
function CharacterAvatar({ name, size = 22 }) {
  const initial = (name || "?").trim().charAt(0);
  return (
    <span
      aria-label={`character: ${name}`}
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--n-100)",
        border: "1px solid var(--hairline-strong)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.5),
        fontWeight: 700,
        color: "var(--n-700)",
        fontFamily: "var(--font-sans)",
        flexShrink: 0,
      }}
    >
      {initial}
    </span>
  );
}

function RecentProjectCard({ item }) {
  return (
    <div
      style={{
        background: "var(--n-0)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-lg)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        cursor: "pointer",
        transition: "all 120ms cubic-bezier(0.2,0,0,1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--hairline-strong)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--hairline)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Cover — striped 16:9 placeholder with character chip */}
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 8,
          border: "1px solid var(--hairline)",
          background:
            "repeating-linear-gradient(135deg, var(--n-100) 0 8px, var(--n-150) 8px 16px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--n-500)",
            background: "rgba(255,255,255,0.85)",
            padding: "3px 8px",
            borderRadius: 3,
          }}
        >
          cover · {item.pageRange}
        </span>
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--n-0)",
            background: "var(--n-900)",
            padding: "2px 6px",
            borderRadius: 3,
          }}
        >
          {item.shortsCount} shorts
        </span>
        {/* Character chip — overlay bottom-left */}
        <span
          style={{
            position: "absolute",
            left: 8,
            bottom: 8,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 8px 3px 4px",
            borderRadius: 999,
            background: "var(--n-0)",
            border: "1px solid var(--hairline-strong)",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--n-800)",
            maxWidth: "calc(100% - 16px)",
            overflow: "hidden",
          }}
        >
          <CharacterAvatar name={item.character.name} size={18} />
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.character.name}
          </span>
        </span>
      </div>

      {/* Meta */}
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--n-900)",
            letterSpacing: -0.1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            marginTop: 3,
            fontSize: 12,
            color: "var(--n-500)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.subtitle}
        </div>
      </div>

      {/* Footer meta */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--n-500)",
          fontFamily: "var(--font-mono)",
          paddingTop: 10,
          borderTop: "1px solid var(--hairline)",
          gap: 8,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 500,
              color: "var(--n-600)",
            }}
          >
            캐릭터
          </span>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              color: "var(--n-800)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 100,
            }}
          >
            {item.character.name}
          </span>
        </span>
        <span>{item.lastUsed}</span>
      </div>
    </div>
  );
}

function RecentProjectsGrid({ state }) {
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
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: -0.3,
              color: "var(--n-900)",
            }}
          >
            최근 프로젝트
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: "var(--n-500)",
            }}
          >
            이전에 작업한 PDF로 빠르게 이어 만들기
          </div>
        </div>
        <Btn variant="ghost" size="sm">전체 보기</Btn>
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
          background: "var(--n-0)",
          position: "relative",
        }}
      >
        <div style={{ padding: "32px 40px 60px", maxWidth: 1180, margin: "0 auto" }}>
          <DropZone state={state} />

          {state !== "empty" && (
            <Library items={items} density={density} />
          )}

          {/* Recent projects grid */}
          <RecentProjectsGrid state={state} />
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Outer frame — windowed vs full-bleed
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
            background: "var(--n-0)",
            borderRadius: framed ? 14 : 0,
            overflow: "hidden",
            border: framed ? "1px solid var(--hairline-strong)" : "none",
            boxShadow: framed
              ? "0 30px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.08)"
              : "none",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TitleBar title="Shortify — 라이브러리" />
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
