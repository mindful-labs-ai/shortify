import { useEffect, useMemo, useState } from "react";
import Shori from "@/components/brand/Shori";
import SpeechBubble from "@/components/brand/SpeechBubble";
import Btn from "@/components/ui/Btn";
import StepIndicator from "@/components/ui/StepIndicator";
import { api, type ImageConcept as ApiConcept } from "../lib/api";
import { useAppStore } from "../store";

// ─────────────────────────────────────────────────────────────
// Character roster — fetched live from sidecar (`/image-concepts`).
// Source of truth is `db.seed.SEED` (seed_image_concepts).
// `slug` is sent verbatim to api.selectImage().
// ─────────────────────────────────────────────────────────────

interface Character {
  id: string;
  name: string;
  desc: string;
  previewUrl: string;
  color: string;
  bg: string;
  badge: string | null;
}

// Per-slug visual palette for card backgrounds and accents. Colors are
// drawn from each character's main color cue defined in the seed bible.
const TONE_PALETTE: Record<string, { color: string; bg: string }> = {
  shori: { color: "var(--coral-500)", bg: "linear-gradient(135deg, #FFE7DC 0%, #FFD3C0 100%)" },
  pip:   { color: "#E5A82E",          bg: "linear-gradient(135deg, #FFF4D6 0%, #FFE49B 100%)" },
  iris:  { color: "#3FB892",          bg: "linear-gradient(135deg, #E0F7EE 0%, #BCEAD7 100%)" },
  jay:   { color: "#4A9BFF",          bg: "linear-gradient(135deg, #DDEBFF 0%, #BFD7FA 100%)" },
  vera:  { color: "#9078D4",          bg: "linear-gradient(135deg, #EFE6FA 0%, #D9C9F2 100%)" },
  sage:  { color: "#8B7E72",          bg: "linear-gradient(135deg, #ECE5DC 0%, #D6CDC0 100%)" },
};
const FALLBACK_PALETTE = { color: "#7A6CF0", bg: "linear-gradient(135deg, #E5E1FA 0%, #C8C0F0 100%)" };

function toCharacter(c: ApiConcept): Character {
  const palette = TONE_PALETTE[c.slug] ?? FALLBACK_PALETTE;
  return {
    id: c.slug,
    name: c.name,
    desc: c.description,
    previewUrl: c.preview_url,
    color: palette.color,
    bg: palette.bg,
    badge: c.slug === "shori" ? "Recommended" : null,
  };
}

// ─────────────────────────────────────────────────────────────
// File-local sub-components
// ─────────────────────────────────────────────────────────────

function CharacterPortrait({
  character,
  picked,
}: {
  character: Character;
  picked: boolean;
}) {
  const [failed, setFailed] = useState(false);

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
      {!failed ? (
        <img
          src={character.previewUrl}
          alt={character.name}
          onError={() => setFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transformOrigin: "50% 88%",
            animation: picked
              ? "shori-talk 0.9s cubic-bezier(.45,0,.55,1) infinite"
              : "shori-idle 2.6s cubic-bezier(.45,0,.55,1) infinite",
          }}
        />
      ) : (
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
      )}
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
  return (
    <button
      onClick={() => onPick(character.id)}
      style={{
        textAlign: "left",
        position: "relative",
        background: "var(--cream)",
        border: picked
          ? "2px solid var(--coral-500)"
          : "1.5px solid var(--hairline-strong)",
        borderRadius: 18,
        padding: 16,
        cursor: "pointer",
        boxShadow: picked
          ? "4px 6px 0 var(--coral-700), 0 12px 28px rgba(255,107,74,0.18)"
          : "3px 4px 0 var(--stamp-soft)",
        transition: "all 160ms cubic-bezier(.2,.9,.3,1.1)",
        fontFamily: "var(--font-sans)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
      onMouseEnter={(e) => {
        if (picked) return;
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow =
          "4px 6px 0 var(--stamp-deep), 0 12px 28px rgba(26,22,20,0.10)";
      }}
      onMouseLeave={(e) => {
        if (picked) return;
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
      {character.badge && (
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

      <CharacterPortrait character={character} picked={picked} />

      {/* Name + description */}
      <div>
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
    </button>
  );
}

// Shori coach panel inside side rail
function ShoriPanel({ selected }: { selected: string | null }) {
  const lines = useMemo<string[]>(() => {
    if (!selected) return ["Who should narrate?", "Pick your favorite."];
    if (selected === "shori") return ["That's me! Nice to meet you.", "I fit anywhere."];
    if (selected === "pip") return ["Pip is full of curiosity!", "Great for science and puzzles."];
    if (selected === "iris") return ["Iris is calm and thoughtful.", "Perfect for deep concepts."];
    if (selected === "jay") return ["Jay gets straight to the point.", "Great for business and tech."];
    if (selected === "vera") return ["Vera shares warm wisdom.", "Lovely for everyday topics."];
    if (selected === "sage") return ["Sage explains with patience.", "Great for craft and history."];
    return ["Great choice!"];
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
  characters,
  selected,
  pendingCount,
  filename,
}: {
  characters: Character[];
  selected: string | null;
  pendingCount: number;
  filename: string;
}) {
  const character = characters.find((c) => c.id === selected) ?? null;

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
          What we're building
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
            {pendingCount} sections selected
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
          Selected narrator
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
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "var(--ink-soft)",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 4,
                overflow: "hidden",
              } as React.CSSProperties}
            >
              {character.desc}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
            Pick a narrator you like.
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
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    api
      .imageConcepts()
      .then((r) => setCharacters(r.concepts.map(toCharacter)))
      .catch((e) => setErr(`Failed to load characters: ${e}`));
  }, []);

  const character = characters.find((c) => c.id === selected) ?? null;

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
      <SideRail
        characters={characters}
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
              Pick a narrator
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
              Who'll <span style={{ color: "var(--coral-500)" }}>narrate</span> for you?
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
              They'll guide your video. Pick whoever matches the tone — you can switch later anytime.
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
            {characters.map((c) => (
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
                ? `Make ${pendingJobIds.length} video${pendingJobIds.length === 1 ? "" : "s"} with ${character.name}.`
                : "Pick a narrator you like."}
            </div>

            <Btn variant="ghost" size="md" onClick={() => setView("toc")}>
              Back
            </Btn>
            <Btn
              variant="primary"
              size="md"
              disabled={!selected || busy}
              onClick={apply}
            >
              {busy ? "Starting…" : character ? "Make videos →" : "Next"}
            </Btn>
          </div>
        </div>
      </main>
    </div>
  );
}
