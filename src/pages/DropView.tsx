/**
 * DropView — Phase 3 design migration.
 *
 * Contract: on PDF upload/pick success, calls setPdf(...) + setView("toc").
 * All layout subcomponents are file-local (not exported).
 * 100% inline style={{ }} per project convention.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { api, type Job, type PdfSummary } from "../lib/api";
import { useAppStore } from "../store";
import Btn from "@/components/ui/Btn";
import CharacterAvatar from "@/components/ui/CharacterAvatar";
import ProgressBar from "@/components/ui/ProgressBar";
import StatusPill from "@/components/ui/StatusPill";
import ThumbPlaceholder from "@/components/ui/ThumbPlaceholder";
import Shori from "@/components/brand/Shori";

// ─────────────────────────────────────────────────────────────
// Stage → label & status helpers
// ─────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<number, string> = {
  [-1]: "실패",
  0: "대기 중",
  1: "PDF 분석 중",
  2: "핵심 개념 추출 중",
  3: "이미지 컨셉 골라주세요",
  4: "이미지 만드는 중",
  5: "영상 클립 만드는 중",
  6: "내레이션 만드는 중",
  7: "오디오 정렬 중",
  8: "영상 합치는 중",
  9: "완료",
};

function statusOf(stage: number): "done" | "rendering" | "awaiting" | "failed" {
  if (stage === -1) return "failed";
  if (stage === 9) return "done";
  if (stage === 3) return "awaiting";
  return "rendering";
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface LibraryItem {
  id: string;
  title: string;
  source: string;
  chapter: string;
  duration: string;
  createdAt: string;
  status: "done" | "rendering" | "awaiting" | "failed";
  stage?: number;
  stageLabel?: string;
  progress?: number;
  eta?: string;
}

interface RecentProjectItem {
  id: string;
  title: string;
  subtitle: string;
  shortsCount: number;
  pageRange: string;
  lastUsed: string;
  character: { slug: string; name: string; tone: "coral" | "mint" | "sky" | "yellow" };
  status?: "generating";
  progress?: number;
  phaseLabel?: string;
  etaLabel?: string;
}

// ─────────────────────────────────────────────────────────────
// DropZone
// ─────────────────────────────────────────────────────────────

interface DropZoneProps {
  compact: boolean;
  isHover: boolean;
  busy: string | null;
  err: string | null;
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClickPick: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function DropZone({
  compact,
  isHover,
  busy,
  err,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onClickPick,
  inputRef,
  onFileChange,
}: DropZoneProps) {
  const dragHandlers = {
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  };

  if (compact) {
    return (
      <div
        {...dragHandlers}
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
          pointerEvents: busy ? "none" : "auto",
          opacity: busy ? 0.7 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          style={{ display: "none" }}
          onChange={onFileChange}
        />
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
            {busy ?? "새 PDF로 한 입 더 만들어볼까요?"}
          </div>
          {!busy && (
            <div style={{ marginTop: 4, fontSize: 13, color: "var(--ink-mute)" }}>
              여기에 끌어다 놓거나 파일을 선택하면, 평균 10~12분이면 한 편이 완성돼요.
            </div>
          )}
          {err && (
            <div style={{ marginTop: 4, fontSize: 12, color: "var(--coral-700)", fontWeight: 700 }}>
              {err}
            </div>
          )}
        </div>
        {!busy && (
          <>
            <Btn variant="secondary" size="md">샘플 PDF</Btn>
            <Btn variant="primary" size="md" onClick={onClickPick}>파일 선택</Btn>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      {...dragHandlers}
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
        pointerEvents: busy ? "none" : "auto",
        opacity: busy ? 0.7 : 1,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        style={{ display: "none" }}
        onChange={onFileChange}
      />

      {/* Decorative corner bracket marks */}
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
        {([0, 1, 2, 3] as const).map((i) => (
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
            } as React.CSSProperties}
          >
            {busy ? (
              <span style={{ fontSize: 28, letterSpacing: -0.8, color: "var(--coral-700)" }}>
                {busy}
              </span>
            ) : isHover ? (
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

          {!busy && (
            <div
              style={{
                marginTop: 18,
                fontSize: 16,
                color: "var(--ink-soft)",
                maxWidth: 480,
                lineHeight: 1.55,
                textWrap: "pretty",
              } as React.CSSProperties}
            >
              교과서·논문·강의 자료를 여기에 떨어뜨리면, 쇼리가 단원 단위로 60초짜리 학습 숏폼을 만들어 드려요.
            </div>
          )}

          {err && !busy && (
            <div style={{ marginTop: 12, fontSize: 13, color: "var(--coral-700)", fontWeight: 700 }}>
              {err}
            </div>
          )}

          {!busy && (
            <div
              style={{
                marginTop: 28,
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Btn variant="primary" size="lg" onClick={onClickPick}>PDF 선택</Btn>
              <Btn variant="secondary" size="lg">샘플로 먼저 보기</Btn>
            </div>
          )}

          {!busy && (
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
          )}
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
          <Shori pose={isHover ? "reach" : busy ? "idle" : "wave"} size={220} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Library
// ─────────────────────────────────────────────────────────────

function LibraryRow({
  item,
  density,
  onClick,
}: {
  item: LibraryItem;
  density: "comfortable" | "compact";
  onClick: () => void;
}) {
  const padY = density === "compact" ? 10 : 16;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
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
            <ProgressBar value={item.progress ?? 0} />
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "var(--ink-mute)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {item.stage}/9 · {item.eta ?? "—"}
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

function Library({
  items,
  density,
  onRowClick,
}: {
  items: LibraryItem[];
  density: "comfortable" | "compact";
  onRowClick: (item: LibraryItem) => void;
}) {
  const [activeFilter, setActiveFilter] = useState<"전체" | "완료" | "만드는 중" | "확인 필요">("전체");

  const filtered = items.filter((it) => {
    if (activeFilter === "전체") return true;
    if (activeFilter === "완료") return it.status === "done";
    if (activeFilter === "만드는 중") return it.status === "rendering";
    if (activeFilter === "확인 필요") return it.status === "awaiting";
    return true;
  });

  const filters = ["전체", "완료", "만드는 중", "확인 필요"] as const;

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
        {/* Filter tabs */}
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
          {filters.map((t) => {
            const active = t === activeFilter;
            return (
              <button
                key={t}
                onClick={() => setActiveFilter(t)}
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
                  transition: "background 100ms",
                }}
              >
                {t}
              </button>
            );
          })}
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

      {filtered.length === 0 ? (
        <div
          style={{
            padding: "32px 24px",
            textAlign: "center",
            fontSize: 13,
            color: "var(--ink-mute)",
          }}
        >
          해당 상태의 숏폼이 없어요
        </div>
      ) : (
        filtered.map((it) => (
          <LibraryRow
            key={it.id}
            item={it}
            density={density}
            onClick={() => onRowClick(it)}
          />
        ))
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Recent Projects Grid
// ─────────────────────────────────────────────────────────────

function RecentProjectCard({
  item,
  onClick,
}: {
  item: RecentProjectItem;
  onClick: () => void;
}) {
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
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
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
      {/* Generating ribbon */}
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
          <Shori
            pose={isGenerating ? "wave" : tone === "coral" ? "munch" : "idle"}
            size={104}
          />
        </div>

        {/* Shorts count badge */}
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

        {/* Page range badge */}
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

        {/* Generating progress overlay */}
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
                  width: `${item.progress ?? 0}%`,
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
              {item.progress ?? 0}%
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
          {isGenerating
            ? `${item.phaseLabel ?? ""} · ${item.etaLabel ?? ""}`
            : item.subtitle}
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
          <CharacterAvatar
            name={item.character.name}
            tone={item.character.tone}
            size={20}
          />
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

function RecentProjectsGrid({
  items,
  onCardClick,
}: {
  items: RecentProjectItem[];
  onCardClick: (id: string) => void;
}) {
  if (items.length === 0) return null;

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
          <div style={{ marginTop: 4, fontSize: 13, color: "var(--ink-mute)" }}>
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
        {items.map((p) => (
          <RecentProjectCard key={p.id} item={p} onClick={() => onCardClick(p.id)} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty state (no recents, no jobs)
// ─────────────────────────────────────────────────────────────

function EmptyHint() {
  return (
    <div
      style={{
        marginTop: 48,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        opacity: 0.6,
      }}
    >
      <div style={{ fontSize: 13, color: "var(--ink-mute)", textAlign: "center" }}>
        아직 만든 숏폼이 없어요. 위 드롭존에 PDF를 올려보세요.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main DropView
// ─────────────────────────────────────────────────────────────

export default function DropView() {
  const setPdf = useAppStore((s) => s.setPdf);
  const setView = useAppStore((s) => s.setView);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [recents, setRecents] = useState<PdfSummary[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);

  // "filled" once recents or jobs exist
  const hasFilled = recents.length > 0 || allJobs.length > 0;

  const refreshData = useCallback(async () => {
    try {
      const [pdfsResult, jobsResult] = await Promise.all([
        api.listPdfs(),
        api.listJobs(),
      ]);
      setRecents(pdfsResult.pdfs);
      setAllJobs(jobsResult.jobs);
    } catch {
      // sidecar may not be up yet — silent fail
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Poll TocAPI until ready (up to 60s)
  const waitForToc = useCallback(
    async (pdfId: string, label: string): Promise<boolean> => {
      setBusy(label);
      for (let i = 0; i < 60; i++) {
        const pdf = await api.getToc(pdfId);
        if (pdf.toc && pdf.toc.length > 0) {
          setPdf(pdf);
          setView("toc");
          return true;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      setErr("TOC 추출 시간이 초과됐어요. 다시 시도하거나 다른 PDF를 선택해 주세요.");
      return false;
    },
    [setPdf, setView],
  );

  const openExisting = useCallback(
    async (id: string) => {
      setErr(null);
      try {
        const pdf = await api.getToc(id);
        if (pdf.toc && pdf.toc.length > 0) {
          setPdf(pdf);
          setView("toc");
          return;
        }
        await waitForToc(id, "목차 다시 추출 중…");
      } catch (e) {
        setErr(String(e));
      } finally {
        setBusy(null);
      }
    },
    [setPdf, setView, waitForToc],
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setErr("PDF 파일만 올릴 수 있어요.");
        return;
      }
      setErr(null);
      setBusy(`${file.name} 업로드 중…`);
      try {
        const r = await api.uploadPdf(file);

        if (r.deduped && r.toc_present) {
          await openExisting(r.pdf_id);
          return;
        }
        const ok = await waitForToc(r.pdf_id, "목차 추출 중…");
        if (ok) refreshData();
      } catch (e) {
        setErr(String(e));
      } finally {
        setBusy(null);
      }
    },
    [openExisting, refreshData, waitForToc],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setHover(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setHover(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setHover(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setHover(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handleClickPick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
      e.target.value = "";
    },
    [handleFile],
  );

  // ── Map API data → view models ──────────────────────────────

  // Build pdf lookup for jobs
  const pdfById = Object.fromEntries(recents.map((p) => [p.id, p]));

  // Group jobs by pdf_id
  const jobsByPdf: Record<string, Job[]> = {};
  for (const job of allJobs) {
    (jobsByPdf[job.pdf_id] ??= []).push(job);
  }

  // Library items from jobs
  const libraryItems: LibraryItem[] = allJobs.map((job) => {
    const status = statusOf(job.stage);
    return {
      id: job.id,
      title: job.toc_section_title,
      source: pdfById[job.pdf_id]?.filename ?? "—",
      chapter: `${job.toc_section_index + 1}번째 섹션`,
      duration: "—",
      createdAt: "—",
      status,
      stage: job.stage,
      stageLabel: STAGE_LABELS[job.stage] ?? "—",
      progress: 0,
      eta: "—",
    };
  });

  // Recent project cards from pdfs
  const recentProjects: RecentProjectItem[] = recents.map((pdf) => {
    const jobs = jobsByPdf[pdf.id] ?? [];
    const latestJob = jobs[jobs.length - 1];
    const isGenerating = latestJob ? statusOf(latestJob.stage) === "rendering" : false;

    const subtitle =
      jobs.length > 0
        ? `${jobs.length}개의 숏츠`
        : pdf.has_toc
        ? `${pdf.toc_count}개 섹션`
        : "TOC 추출 대기";

    const projectItem: RecentProjectItem = {
      id: pdf.id,
      title: pdf.filename.replace(/\.pdf$/i, ""),
      subtitle,
      shortsCount: jobs.length,
      pageRange: `${pdf.page_count ?? "?"}p`,
      lastUsed: "—", // MOCK: no timestamp in API
      character: { slug: "shori", name: "쇼리", tone: "coral" }, // MOCK: always Shori
    };

    if (isGenerating && latestJob) {
      return {
        ...projectItem,
        status: "generating" as const,
        progress: 0, // MOCK: no real progress in API
        phaseLabel: STAGE_LABELS[latestJob.stage] ?? "만드는 중",
        etaLabel: "—",
      };
    }

    return projectItem;
  });

  // ── Library row click handler ────────────────────────────────
  const handleLibraryRowClick = useCallback(
    (item: LibraryItem) => {
      if (item.status === "awaiting") {
        // TODO: when store has selectedJobId field, set it here
        setView("image_picker");
      } else if (item.status === "rendering") {
        setView("progress");
      } else if (item.status === "done") {
        setView("library");
      }
    },
    [setView],
  );

  // ── Density — currently fixed to comfortable; can be extended ──
  const density: "comfortable" | "compact" = "comfortable";

  return (
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
        <DropZone
          compact={hasFilled}
          isHover={hover}
          busy={busy}
          err={err}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClickPick={handleClickPick}
          inputRef={inputRef}
          onFileChange={handleFileChange}
        />

        {libraryItems.length > 0 && (
          <Library
            items={libraryItems}
            density={density}
            onRowClick={handleLibraryRowClick}
          />
        )}

        {recentProjects.length > 0 ? (
          <RecentProjectsGrid
            items={recentProjects}
            onCardClick={openExisting}
          />
        ) : (
          !hasFilled && <EmptyHint />
        )}
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes shori-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,107,74,0.5); }
          70%  { box-shadow: 0 0 0 8px rgba(255,107,74,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,107,74,0); }
        }
        @keyframes progress-stripes {
          from { background-position: 0 0; }
          to   { background-position: 24px 0; }
        }
        @keyframes shori-talk {
          0%, 100% { transform: translateX(-50%) scaleY(1); }
          50%       { transform: translateX(-50%) scaleY(1.04); }
        }
      `}</style>
    </main>
  );
}
