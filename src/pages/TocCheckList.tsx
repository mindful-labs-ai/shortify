import { useState, useMemo, useEffect, CSSProperties } from "react";
import { api, TocItem } from "../lib/api";
import { useAppStore } from "../store";
import Shori from "@/components/brand/Shori";
import SpeechBubble from "@/components/brand/SpeechBubble";
import StepIndicator from "@/components/ui/StepIndicator";
import Btn from "@/components/ui/Btn";

const MAX_PICKS = 5;

// ─────────────────────────────────────────────────────────────
// Data-mapping types (design shape, built from flat TocItem[])
// ─────────────────────────────────────────────────────────────

interface DesignSection {
  id: string;   // String(TocItem.idx)
  num: string;  // e.g. "1.1" or section title prefix
  title: string;
  pageRange: string;
  pages: number;
  est: string;  // mocked "~45초"
  idx: number;  // original TocItem.idx — used for createJobs
}

interface DesignChapter {
  id: string;
  num: string;   // e.g. "1장" or "본문"
  title: string;
  pageRange: string;
  pages: number;
  sections: DesignSection[];
}

/** Group flat TocItem[] into chapters by Korean N장 prefix. */
function buildChapters(toc: TocItem[], filename: string): DesignChapter[] {
  if (toc.length === 0) return [];

  const CHAPTER_RE = /^(\d+장)/;

  // Group by chapter prefix
  const chapterMap = new Map<string, TocItem[]>();
  for (const item of toc) {
    const m = CHAPTER_RE.exec(item.title);
    const key = m ? m[1] : "본문";
    if (!chapterMap.has(key)) chapterMap.set(key, []);
    chapterMap.get(key)!.push(item);
  }

  // If no item matched a chapter, put everything in one chapter named filename
  const hasChapters = [...chapterMap.keys()].some((k) => k !== "본문");
  if (!hasChapters) {
    const all = toc;
    return [
      {
        id: "ch-default",
        num: "—",
        title: filename.replace(/\.pdf$/i, ""),
        pageRange: all.length > 0 ? `${all[0].page_start + 1}–${all[all.length - 1].page_end + 1}` : "—",
        pages: all.length > 0 ? all[all.length - 1].page_end - all[0].page_start + 1 : 0,
        sections: all.map((item, si) => ({
          id: String(item.idx),
          num: `§${si + 1}`,
          title: item.title,
          pageRange: `${item.page_start + 1}–${item.page_end + 1}`,
          pages: item.page_end - item.page_start + 1,
          est: "~45초",
          idx: item.idx,
        })),
      },
    ];
  }

  const chapters: DesignChapter[] = [];
  let chapterIndex = 0;
  for (const [chKey, items] of chapterMap.entries()) {
    chapterIndex++;
    const pageStart = items[0].page_start + 1;
    const pageEnd = items[items.length - 1].page_end + 1;
    const isChapterLabel = CHAPTER_RE.test(chKey);

    // Title: strip "N장" prefix from chapter label for the subtitle
    const chapterTitle = isChapterLabel
      ? (items[0].title.replace(CHAPTER_RE, "").replace(/^[\s·\-—]+/, "").trim() || items[0].title)
      : chKey;

    const sections: DesignSection[] = items.map((item, si) => {
      // Try to derive a section number like "N.M" by stripping chapter prefix
      const stripped = item.title.replace(CHAPTER_RE, "").trim();
      const secNumM = /^(\d+\.\d+)/.exec(stripped);
      const num = secNumM ? secNumM[1] : `${chapterIndex}.${si + 1}`;
      const sectionTitle = secNumM ? stripped.replace(/^\d+\.\d+[\s\-·—]*/, "").trim() || item.title : item.title;
      return {
        id: String(item.idx),
        num,
        title: sectionTitle || item.title,
        pageRange: `${item.page_start + 1}–${item.page_end + 1}`,
        pages: item.page_end - item.page_start + 1,
        est: "~45초",
        idx: item.idx,
      };
    });

    chapters.push({
      id: `ch-${chapterIndex}`,
      num: chKey,
      title: chapterTitle,
      pageRange: `${pageStart}–${pageEnd}`,
      pages: pageEnd - pageStart + 1,
      sections,
    });
  }
  return chapters;
}

// ─────────────────────────────────────────────────────────────
// PickCheckbox
// ─────────────────────────────────────────────────────────────

interface PickCheckboxProps {
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}

function PickCheckbox({ checked, disabled, onChange }: PickCheckboxProps) {
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
          <path
            d="M 3 7.5 L 5.8 10.2 L 11 4.5"
            stroke="var(--cream)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// SectionRow
// ─────────────────────────────────────────────────────────────

interface SectionRowProps {
  section: DesignSection;
  picked: boolean;
  locked: boolean;
  onToggle: () => void;
  order: number | undefined;
}

function SectionRow({ section, picked, locked, onToggle, order }: SectionRowProps) {
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
        if (!picked && !locked)
          (e.currentTarget as HTMLDivElement).style.background = "var(--cloud)";
      }}
      onMouseLeave={(e) => {
        if (!picked)
          (e.currentTarget as HTMLDivElement).style.background = "transparent";
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
          {order}
        </span>
      ) : (
        <span style={{ width: 24 }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ChapterBlock
// ─────────────────────────────────────────────────────────────

interface ChapterBlockProps {
  chapter: DesignChapter;
  picks: Map<string, number>;
  onToggle: (id: string) => void;
  locked: boolean;
}

function ChapterBlock({ chapter, picks, onToggle, locked }: ChapterBlockProps) {
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
          <div
            style={{
              marginTop: 3,
              fontSize: 12,
              color: "var(--ink-mute)",
              fontFamily: "var(--font-mono)",
            }}
          >
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
              order={picks.get(s.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ShoriPanel — mascot with reactive speech bubble
// ─────────────────────────────────────────────────────────────

interface ShoriPanelProps {
  picksSize: number;
}

function ShoriPanel({ picksSize }: ShoriPanelProps) {
  const lines = useMemo(
    () => ({
      empty: ["어떤 단원이 끌려요?", "한 입 크기로 만들어 줄게요."],
      few: [`오, ${picksSize}개 골랐네요!`, "조금 더 골라도 좋아요."],
      almost: [`벌써 ${picksSize}개! 잘 어울려요.`, "한 개만 더 고르면 만석이에요."],
      full: ["딱 5개! 완벽해요.", "이제 다음 단계로 가볼까요?"],
    }),
    [picksSize]
  );

  const bucket =
    picksSize === 0
      ? "empty"
      : picksSize === MAX_PICKS
      ? "full"
      : picksSize === MAX_PICKS - 1
      ? "almost"
      : "few";

  const list = lines[bucket];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(0);
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 3800);
    return () => clearInterval(t);
  }, [bucket, list.length]);

  const message = list[idx];

  return (
    <div style={{ marginTop: "auto", position: "relative", paddingTop: 8 }}>
      {/* Speech bubble above Shori */}
      <div style={{ paddingLeft: 4, paddingRight: 18, marginBottom: 14 }}>
        <SpeechBubble key={message} text={message} />
      </div>

      {/* Shori — big, centered, slightly cropped at bottom */}
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
          <Shori size={300} pose={picksSize > 0 ? "wave" : "idle"} />
        </div>

        {/* Pick-count badge */}
        {picksSize > 0 && (
          <div
            key={picksSize}
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
          >
            +{picksSize}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PdfSummaryPanel — left rail
// ─────────────────────────────────────────────────────────────

interface PdfSummaryPanelProps {
  filename: string;
  pageCount: number;
  picks: Map<string, number>;
}

function PdfSummaryPanel({ filename, pageCount, picks }: PdfSummaryPanelProps) {
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
            <div
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                padding: "1px 5px",
                borderRadius: 3,
                background: "var(--coral-500)",
                color: "var(--cream)",
                fontSize: 8,
                fontWeight: 800,
              }}
            >
              PDF
            </div>
            <span>{pageCount}p</span>
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
              title={filename}
            >
              {filename}
            </div>
            <div
              style={{
                marginTop: 3,
                fontSize: 11,
                color: "var(--ink-mute)",
                fontFamily: "var(--font-mono)",
              }}
            >
              — · 한국어
            </div>
            <div style={{ marginTop: 3, fontSize: 11, color: "var(--ink-mute)" }}>
              {pageCount}쪽
            </div>
          </div>
        </div>
      </div>

      {/* Selection summary card */}
      <div
        style={{
          background: picks.size > 0 ? "var(--coral-50)" : "var(--cloud)",
          border:
            picks.size > 0
              ? "1.5px solid var(--coral-100)"
              : "1.5px dashed var(--hairline-strong)",
          borderRadius: 14,
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 6,
          }}
        >
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

        {/* Progress dots */}
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

      {/* Shori mascot panel */}
      <ShoriPanel picksSize={picks.size} />
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// TocCheckList — page root
// ─────────────────────────────────────────────────────────────

export default function TocCheckList() {
  const pdf = useAppStore((s) => s.pdf);
  const setPendingJobIds = useAppStore((s) => s.setPendingJobIds);
  const setView = useAppStore((s) => s.setView);

  // picks: Map<sectionId (string), order (1-based)>
  const [picks, setPicks] = useState<Map<string, number>>(new Map());
  const [busy, setBusy] = useState(false);

  const chapters = useMemo(
    () => (pdf ? buildChapters(pdf.toc, pdf.filename) : []),
    [pdf]
  );

  const allSections = useMemo(
    () => chapters.flatMap((ch) => ch.sections),
    [chapters]
  );

  const totalSections = allSections.length;

  if (!pdf) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-mute)",
        }}
      >
        No PDF loaded. Drop one first.
      </div>
    );
  }

  const togglePick = (id: string) => {
    setPicks((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
        // Re-number remaining picks in insertion order
        const ordered = [...next.entries()].sort((a, b) => a[1] - b[1]);
        const final = new Map<string, number>();
        ordered.forEach(([k], i) => final.set(k, i + 1));
        return final;
      }
      if (next.size >= MAX_PICKS) return prev;
      next.set(id, next.size + 1);
      return next;
    });
  };

  const submit = async () => {
    if (picks.size === 0 || !pdf) return;
    setBusy(true);
    try {
      // Convert string ids back to numeric idx for the API
      const sectionIdxs = [...picks.entries()]
        .sort((a, b) => a[1] - b[1])
        .map(([id]) => {
          const sec = allSections.find((s) => s.id === id);
          return sec?.idx ?? parseInt(id, 10);
        });
      const { job_ids } = await api.createJobs(pdf.id, sectionIdxs);
      setPendingJobIds(job_ids);
      setView("image_picker");
    } finally {
      setBusy(false);
    }
  };

  const lockedAtMax = picks.size >= MAX_PICKS;

  // Inline style for the selected titles strip in footer
  const selectedTitlesStyle: CSSProperties = {
    minWidth: 0,
    flex: 1,
    fontSize: 13,
    color: "var(--ink-soft)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", height: "100vh", minHeight: 0, background: "var(--cloud)" }}>
      {/* Left rail */}
      <PdfSummaryPanel
        filename={pdf.filename}
        pageCount={pdf.page_count}
        picks={picks}
      />

      {/* Main column */}
      <main style={{ flex: 1, minWidth: 0, overflowY: "auto", position: "relative" }}>
        <div style={{ padding: "28px 40px 140px", maxWidth: 980, margin: "0 auto" }}>
          {/* Step indicator — step 2 is active */}
          <StepIndicator current={2} />

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
              }}
            >
              어떤 단원으로{" "}
              <span style={{ color: "var(--coral-500)" }}>한 입</span> 만들까요?
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
              총 {chapters.length}개 장 · {totalSections}개 소단원을 찾았어요. 한 번에 최대{" "}
              <strong>5개</strong>까지 골라서 숏폼으로 만들 수 있어요.
            </div>
          </div>

          {/* TOC chapter blocks */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 24 }}>
            {chapters.map((ch) => (
              <ChapterBlock
                key={ch.id}
                chapter={ch}
                picks={picks}
                onToggle={togglePick}
                locked={lockedAtMax}
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
            {/* Pick counter pill */}
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 800,
                color: picks.size === 0 ? "var(--ink-mute)" : "var(--coral-700)",
                background: picks.size === 0 ? "var(--cloud)" : "var(--coral-50)",
                border: "1.5px solid",
                borderColor:
                  picks.size === 0 ? "var(--hairline-strong)" : "var(--coral-100)",
                padding: "6px 12px",
                borderRadius: 999,
              }}
            >
              {picks.size} / {MAX_PICKS} 선택
            </div>

            {/* Selected titles strip */}
            {picks.size > 0 ? (
              <div style={selectedTitlesStyle}>
                {[...picks.entries()]
                  .sort((a, b) => a[1] - b[1])
                  .map(([id]) => allSections.find((s) => s.id === id)?.title)
                  .filter((t): t is string => Boolean(t))
                  .join(" · ")}
              </div>
            ) : (
              <div style={{ flex: 1, fontSize: 13, color: "var(--ink-mute)" }}>
                만들고 싶은 소단원을 골라 주세요.
              </div>
            )}

            <Btn
              variant="ghost"
              size="md"
              onClick={() => setView("drop")}
            >
              뒤로
            </Btn>
            <Btn
              variant="primary"
              size="md"
              disabled={busy || picks.size === 0}
              onClick={submit}
            >
              {busy ? "생성 중…" : picks.size === 0 ? "다음" : `${picks.size}개로 다음 →`}
            </Btn>
          </div>
        </div>
      </main>
    </div>
  );
}
