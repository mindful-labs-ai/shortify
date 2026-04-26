import { useEffect, useMemo, useState } from "react";
import { fetchPrompts, resetPrompt, updatePrompt } from "../lib/api";
import type { AdminPrompt } from "../types";

const VAR_RE = /\$\{([A-Z0-9_]+)\}\$/g;

function extractVars(template: string): string[] {
  const found = new Set<string>();
  for (const m of template.matchAll(VAR_RE)) found.add(m[1]);
  return [...found].sort();
}

function diff(a: string[], b: string[]): { missing: string[]; extra: string[] } {
  const A = new Set(a);
  const B = new Set(b);
  return {
    missing: [...A].filter((x) => !B.has(x)).sort(),
    extra: [...B].filter((x) => !A.has(x)).sort(),
  };
}

type Props = {
  baseUrl: string;
};

type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; ts: string }
  | { kind: "error"; msg: string };

export default function PromptsPanel({ baseUrl }: Props) {
  const [list, setList] = useState<AdminPrompt[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>("");
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const reload = async () => {
    try {
      const next = await fetchPrompts(baseUrl);
      setList(next);
      setLoadErr(null);
      if (selected === null && next.length > 0) {
        setSelected(next[0].key);
      }
    } catch (e) {
      setLoadErr((e as Error).message);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl]);

  const current = useMemo(
    () => list?.find((p) => p.key === selected) ?? null,
    [list, selected],
  );

  // 선택이 바뀌면 편집 버퍼를 서버 값으로 동기화
  useEffect(() => {
    setDraft(current?.template ?? "");
    setStatus({ kind: "idle" });
  }, [current?.key, current?.updated_at]);

  const declared = current?.variables ?? [];
  const inTemplate = useMemo(() => extractVars(draft), [draft]);
  const { missing: undeclared, extra: unused } = diff(inTemplate, declared);
  const dirty = current ? draft !== current.template : false;
  const modifiedFromDefault =
    current?.default_template !== null &&
    current?.default_template !== undefined &&
    current.template !== current.default_template;

  const save = async () => {
    if (!current) return;
    setStatus({ kind: "saving" });
    try {
      await updatePrompt(baseUrl, current.key, { template: draft });
      setStatus({ kind: "saved", ts: new Date().toLocaleTimeString() });
      await reload();
    } catch (e) {
      setStatus({ kind: "error", msg: (e as Error).message });
    }
  };

  const reset = async () => {
    if (!current) return;
    if (!confirm(`Reset '${current.key}' to seed default?`)) return;
    setStatus({ kind: "saving" });
    try {
      await resetPrompt(baseUrl, current.key);
      setStatus({ kind: "saved", ts: new Date().toLocaleTimeString() });
      await reload();
    } catch (e) {
      setStatus({ kind: "error", msg: (e as Error).message });
    }
  };

  if (loadErr) {
    return (
      <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        Failed to load prompts: {loadErr}
      </section>
    );
  }
  if (list === null) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
        Loading prompts…
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
      {/* list */}
      <aside className="rounded-2xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-2 text-sm font-medium">
          Prompts ({list.length})
        </div>
        <ul className="max-h-[640px] divide-y divide-neutral-100 overflow-auto text-sm">
          {list.map((p) => {
            const isSelected = p.key === selected;
            const isModified =
              p.default_template !== null &&
              p.default_template !== undefined &&
              p.template !== p.default_template;
            return (
              <li key={p.key}>
                <button
                  type="button"
                  onClick={() => setSelected(p.key)}
                  className={[
                    "block w-full px-4 py-2 text-left",
                    isSelected
                      ? "bg-neutral-900/5 ring-1 ring-inset ring-neutral-900/20"
                      : "hover:bg-neutral-50",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] font-medium">{p.key}</code>
                    {isModified ? (
                      <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">
                        modified
                      </span>
                    ) : null}
                  </div>
                  {p.description ? (
                    <div className="mt-0.5 line-clamp-2 text-[11px] text-neutral-500">
                      {p.description}
                    </div>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* editor */}
      <div className="rounded-2xl border border-neutral-200 bg-white">
        {current === null ? (
          <div className="p-6 text-sm text-neutral-500">
            Select a prompt on the left.
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-4 py-3">
              <div>
                <div className="font-mono text-sm font-semibold">{current.key}</div>
                {current.description ? (
                  <div className="mt-0.5 text-xs text-neutral-500">
                    {current.description}
                  </div>
                ) : null}
                <div className="mt-1 text-[11px] text-neutral-400">
                  declared vars:{" "}
                  {declared.length === 0 ? (
                    <em>none</em>
                  ) : (
                    declared.map((v) => (
                      <code
                        key={v}
                        className="mr-1 rounded bg-neutral-100 px-1 py-0.5"
                      >
                        ${"{"}
                        {v}
                        {"}"}$
                      </code>
                    ))
                  )}
                  {current.updated_at ? (
                    <span className="ml-2">
                      · updated {new Date(current.updated_at).toLocaleString()}
                    </span>
                  ) : null}
                  {modifiedFromDefault ? (
                    <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-800">
                      modified from seed
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={reset}
                  disabled={!modifiedFromDefault || status.kind === "saving"}
                  className="rounded-md border border-neutral-300 px-3 py-1 text-xs disabled:opacity-40"
                >
                  Reset to default
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={!dirty || status.kind === "saving"}
                  className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
                >
                  {status.kind === "saving" ? "Saving…" : "Save"}
                </button>
              </div>
            </div>

            {(undeclared.length > 0 || unused.length > 0) && (
              <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                {undeclared.length > 0 && (
                  <div>
                    <strong>Undeclared</strong> vars used in template (will be
                    rejected at render time):{" "}
                    {undeclared.map((v) => (
                      <code
                        key={v}
                        className="mr-1 rounded bg-amber-100 px-1 py-0.5"
                      >
                        {v}
                      </code>
                    ))}
                  </div>
                )}
                {unused.length > 0 && (
                  <div>
                    <strong>Declared but unused</strong>:{" "}
                    {unused.map((v) => (
                      <code
                        key={v}
                        className="mr-1 rounded bg-amber-100 px-1 py-0.5"
                      >
                        {v}
                      </code>
                    ))}
                  </div>
                )}
              </div>
            )}

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
              className="min-h-[420px] w-full resize-y bg-neutral-950 p-4 font-mono text-xs leading-relaxed text-neutral-100 outline-none"
            />

            {current.default_template &&
              current.template !== current.default_template && (
                <details className="border-t border-neutral-200">
                  <summary className="cursor-pointer px-4 py-2 text-xs text-neutral-500">
                    Show seed default
                  </summary>
                  <pre className="border-t border-neutral-200 bg-neutral-50 p-4 text-[11px] text-neutral-700">
                    {current.default_template}
                  </pre>
                </details>
              )}

            <div className="border-t border-neutral-200 px-4 py-2 text-[11px]">
              {status.kind === "idle" && (
                <span className="text-neutral-400">
                  Variable pattern: <code>${"{NAME}"}$</code> · changes apply on
                  next call (no restart).
                </span>
              )}
              {status.kind === "saving" && (
                <span className="text-neutral-500">Saving…</span>
              )}
              {status.kind === "saved" && (
                <span className="text-emerald-700">Saved {status.ts}</span>
              )}
              {status.kind === "error" && (
                <span className="text-rose-700">Error: {status.msg}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
