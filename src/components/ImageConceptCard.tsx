import type { ImageConcept } from "../lib/api";

type Props = {
  concept: ImageConcept;
  selected?: boolean;
  onSelect?: (slug: string) => void;
};

export default function ImageConceptCard({ concept, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(concept.slug)}
      className={[
        "group relative aspect-[3/4] overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition",
        selected
          ? "border-neutral-900 ring-2 ring-neutral-900"
          : "border-neutral-200 hover:border-neutral-400",
      ].join(" ")}
    >
      <img
        src={concept.preview_path}
        alt={concept.name}
        className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.02]"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.opacity = "0";
        }}
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
        <div className="text-sm font-medium tracking-tight">{concept.name}</div>
        <div className="line-clamp-2 text-xs opacity-80">{concept.description}</div>
      </div>
      {selected ? (
        <span className="absolute right-3 top-3 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          Selected
        </span>
      ) : null}
    </button>
  );
}
