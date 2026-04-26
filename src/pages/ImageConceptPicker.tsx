import { useEffect, useMemo, useState } from "react";
import Shori from "@/components/brand/Shori";
import SpeechBubble from "@/components/brand/SpeechBubble";
import Btn from "@/components/ui/Btn";
import StepIndicator from "@/components/ui/StepIndicator";
import { api } from "../lib/api";
import { useAppStore } from "../store";
import shoriPng from "@/assets/shori.png";

// ─────────────────────────────────────────────────────────────
// Character roster — hard-coded per design; slugs sent verbatim
// to api.selectImage() as the image_concept_slug.
// ─────────────────────────────────────────────────────────────

interface Character {
  id: string;
  name: string;
  tagline: string;
  desc: string;
  voice: string;
  pace: string;
  color: string;
  bg: string;
  badge: string | null;
  locked: boolean;
  asset: "shori" | "placeholder";
}

const CHARACTERS: Character[] = [
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
// File-local sub-components
// ─────────────────────────────────────────────────────────────

function Chip({ children }: { children: React.ReactNode }) {
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

function MetaItem({ label, value }: { label: string; value: string }) {
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

function CharacterPortrait({
  character,
  picked,
}: {
  character: Character;
  picked: boolean;
}) {
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
          src={shoriPng}
          alt="쇼리"
          style={{
            position: "absolute",
            bottom: -28,
            width: 200,
            height: 200,
            objectFit: "contain",
            transformOrigin: "50% 88%",
            animation: picked
              ? "card-shori-talk 0.9s cubic-bezier(.45,0,.55,1) infinite"
              : "card-shori-idle 2.6s cubic-bezier(.45,0,.55,1) infinite",
          }}
        />
      </div>
    );
  }

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

function CharacterCard({
  character,
  picked,
  onPick,
}: {
  character: Character;
  picked: boolean;
  onPick: (id: string) => void;
}) {
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
        e.currentTarget.style.boxShadow =
          "4px 6px 0 var(--stamp-deep), 0 12px 28px rgba(26,22,20,0.10)";
      }}
      onMouseLeave={(e) => {
        if (locked || picked) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "3px 4px 0 var(--stamp-soft)";
      }}
    >
      {/* Picked stamp */}
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

      {/* Recommended badge */}
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

      {/* Locked overlay */}
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
              <rect
                x="2"
                y="5.5"
                width="8"
                height="5.5"
                rx="1.2"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M 3.7 5.5 V 4 a 2.3 2.3 0 0 1 4.6 0 V 5.5"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
            Coming&nbsp;soon
          </div>
        </div>
      )}

      <CharacterPortrait character={character} picked={picked} />

      {/* Name + tagline */}
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
          } as React.CSSProperties}
        >
          {character.desc}
        </div>
      </div>

      {/* Voice meta row */}
      <div
        style={{
          display: "flex",
          gap: 10,
          paddingTop: 10,
          borderTop: "1px dashed var(--hairline-strong)",
        }}
      >
        <MetaItem label="목소리" value={character.voice} />
        <div style={{ flex: 1 }} />
        {/* Preview button — no-op in this version */}
        <span
          role="button"
          tabIndex={locked ? -1 : 0}
          onClick={(e) => e.stopPropagation()}
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
          <svg
            width="9"
            height="9"
            viewBox="0 0 9 9"
            fill={locked ? "var(--ink-faint)" : character.color}
          >
            <path d="M 1.5 1 L 7.5 4.5 L 1.5 8 Z" />
          </svg>
          미리듣기
        </span>
      </div>
    </button>
  );
}

// Shori coach panel inside side rail
function ShoriPanel({ selected }: { selected: string | null }) {
  const lines = useMemo<string[]>(() => {
    if (!selected) return ["누구로 만들까요?", "취향껏 골라봐요."];
    if (selected === "shori") return ["저예요 저! 잘 부탁해요.", "어디든 잘 어울려요."];
    if (selected === "luna") return ["루나는 차분해서 멋져요.", "개념 정리에 딱이에요."];
    if (selected === "pico") return ["피코랑 가면 신나요!", "짧은 단원에 추천!"];
    if (selected === "eddy") return ["에디는 곧 만나요.", "조금만 기다려 주세요!"];
    return ["좋은 선택이에요!"];
  }, [selected]);

  const [idx, setIdx] = useState(0);

  useEffect(() => {
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
          <Shori size={300} pose={selected ? "wave" : "idle"} />
        </div>
      </div>
    </div>
  );
}

// Left side rail
function SideRail({
  selected,
  pendingCount,
  filename,
}: {
  selected: string | null;
  pendingCount: number;
  filename: string;
}) {
  const character = CHARACTERS.find((c) => c.id === selected) ?? null;

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
            title={filename}
          >
            {filename || "—"}
          </div>
          <div style={{ height: 1, background: "var(--hairline)", margin: "10px 0" }} />
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--ink)",
              letterSpacing: -0.1,
            }}
          >
            {pendingCount}개 섹션 선택됨
          </div>
        </div>
      </div>

      {/* Currently picked character summary */}
      <div
        style={{
          background: character ? "var(--coral-50)" : "var(--cloud)",
          border: character
            ? "1.5px solid var(--coral-100)"
            : "1.5px dashed var(--hairline-strong)",
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
            <div
              style={{ marginTop: 2, fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}
            >
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

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function ImageConceptPicker() {
  const pendingJobIds = useAppStore((s) => s.pendingJobIds);
  const setView = useAppStore((s) => s.setView);
  const pdf = useAppStore((s) => s.pdf);

  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const character = CHARACTERS.find((c) => c.id === selected) ?? null;

  const apply = async () => {
    if (!selected || pendingJobIds.length === 0) return;
    setBusy(true);
    setErr(null);
    const results = await Promise.allSettled(
      pendingJobIds.map((id) => api.selectImage(id, selected)),
    );
    const failedItems = results
      .map((r, i) => ({ r, id: pendingJobIds[i] }))
      .filter((x) => x.r.status === "rejected");
    setBusy(false);

    if (failedItems.length === 0) {
      setView("progress");
      return;
    }
    if (failedItems.length < pendingJobIds.length) {
      setErr(
        `${failedItems.length} of ${pendingJobIds.length} jobs already past selection. Continuing.`,
      );
      setView("progress");
      return;
    }
    setErr(
      `All ${failedItems.length} jobs are no longer eligible for image choice. ` +
        `They may already be processing or have failed.`,
    );
  };

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0, background: "var(--cloud)" }}>
      <style>{`
        @keyframes card-shori-idle {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50%      { transform: translateY(-4px) rotate(1deg); }
        }
        @keyframes card-shori-talk {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50%      { transform: translateY(-3px) rotate(2.5deg); }
        }
      `}</style>
      <SideRail
        selected={selected}
        pendingCount={pendingJobIds.length}
        filename={pdf?.filename ?? ""}
      />

      <main style={{ flex: 1, minWidth: 0, overflowY: "auto", position: "relative" }}>
        <div style={{ padding: "28px 40px 140px", maxWidth: 980, margin: "0 auto" }}>
          <StepIndicator current={3} />

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
              } as React.CSSProperties}
            >
              누가 <span style={{ color: "var(--coral-500)" }}>설명</span>해 줄까요?
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "var(--ink-soft)",
                lineHeight: 1.55,
                maxWidth: 580,
              }}
            >
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
                onPick={setSelected}
              />
            ))}
          </div>

          {err && (
            <p
              style={{ marginTop: 16, fontSize: 13, color: "var(--rose-600, #e11d48)" }}
            >
              {err}
            </p>
          )}
        </div>

        {/* Sticky footer */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            background:
              "linear-gradient(180deg, rgba(245,239,232,0) 0%, var(--cloud) 28%)",
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
              boxShadow:
                "0 12px 28px rgba(26,22,20,0.07), 3px 4px 0 var(--stamp-soft)",
            }}
          >
            {/* Selected character pill */}
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 800,
                color: character ? "var(--coral-700)" : "var(--ink-mute)",
                background: character ? "var(--coral-50)" : "var(--cloud)",
                border: "1.5px solid",
                borderColor: character
                  ? "var(--coral-100)"
                  : "var(--hairline-strong)",
                padding: "6px 12px",
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              {character ? character.name : "—"}
            </div>

            <div
              style={{
                minWidth: 0,
                flex: 1,
                fontSize: 13,
                color: "var(--ink-soft)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {character
                ? `${character.name}와(과) 함께 ${pendingJobIds.length}개 영상을 만들어요.`
                : "마음에 드는 친구를 골라 주세요."}
            </div>

            <Btn variant="ghost" size="md" onClick={() => setView("toc")}>
              뒤로
            </Btn>
            <Btn
              variant="primary"
              size="md"
              disabled={!selected || busy}
              onClick={apply}
            >
              {busy ? "시작 중…" : character ? "영상 만들기 →" : "다음"}
            </Btn>
          </div>
        </div>
      </main>
    </div>
  );
}
