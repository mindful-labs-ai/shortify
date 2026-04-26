import { CSSProperties, useEffect, useState } from "react";
import { api } from "../lib/api";
import { tauri } from "../lib/tauri";
import Btn from "@/components/ui/Btn";
import Shori from "@/components/brand/Shori";

const SERVICE = "shortify";
const KEY = "gemini";

// ---------------------------------------------------------------------------
// Style constants
// ---------------------------------------------------------------------------
const page: CSSProperties = {
  maxWidth: 640,
  margin: "0 auto",
  padding: "40px 32px",
};

const heading1: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 28,
  fontWeight: 800,
  color: "var(--ink)",
  letterSpacing: -0.5,
  marginBottom: 28,
};

const card: CSSProperties = {
  background: "var(--paper)",
  border: "1.5px solid var(--hairline-strong)",
  borderRadius: "var(--radius-lg)",
  padding: "24px 28px",
  boxShadow: "var(--shadow-sm)",
  marginBottom: 20,
};

const sectionLabel: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.9,
  textTransform: "uppercase" as const,
  color: "var(--ink-mute)",
};

const bodyText: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  color: "var(--ink-soft)",
  marginTop: 6,
  lineHeight: 1.6,
};

const inputRow: CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 16,
  alignItems: "stretch",
};

const inputStyle: CSSProperties = {
  flex: 1,
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  color: "var(--ink)",
  background: "var(--cream)",
  border: "1.5px solid var(--hairline-strong)",
  borderRadius: "var(--radius-md)",
  padding: "9px 12px",
  outline: "none",
  transition: "border-color 120ms",
};

const removeBtn: CSSProperties = {
  marginTop: 10,
  fontFamily: "var(--font-sans)",
  fontSize: 12,
  color: "var(--ink-faint)",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

const dangerBtn: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--ink-soft)",
  background: "var(--cream)",
  border: "1.5px solid var(--hairline-strong)",
  borderRadius: "var(--radius-md)",
  padding: "9px 16px",
  cursor: "pointer",
  transition: "border-color 140ms, color 140ms",
};

const toastStyle: CSSProperties = {
  marginTop: 20,
  background: "var(--coral-50)",
  border: "1.5px solid var(--coral-100)",
  borderRadius: "var(--radius-md)",
  padding: "12px 16px",
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  color: "var(--ink-soft)",
};

const shoriWrap: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 0,
  marginBottom: 8,
};

// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [keyValue, setKeyValue] = useState("");
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    tauri.keychainGet(SERVICE, KEY).then((v) => setHasKey(Boolean(v)));
  }, []);

  const save = async () => {
    if (!keyValue.trim()) return;
    setBusy(true);
    try {
      await tauri.keychainSet(SERVICE, KEY, keyValue.trim());
      setHasKey(true);
      setKeyValue("");
      setMsg("Saved. Restart the app for the sidecar to pick up the new key.");
    } catch (e) {
      setMsg(`Failed: ${e}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await tauri.keychainDelete(SERVICE, KEY);
      setHasKey(false);
      setMsg("API key removed.");
    } finally {
      setBusy(false);
    }
  };

  const wipe = async () => {
    if (!confirm("Soft-delete ALL data and remove the API key? You can restore from Trash before emptying it.")) {
      return;
    }
    setBusy(true);
    try {
      const jobs = await api.listJobs();
      await Promise.all(jobs.jobs.map((j) => api.deleteJob(j.id)));
      await remove();
      setMsg("All data moved to Trash. Empty Trash from the library to free disk.");
    } finally {
      setBusy(false);
    }
  };

  const emptyTrash = async () => {
    setBusy(true);
    try {
      const r = await api.emptyTrash();
      setMsg(`Purged ${r.purged_jobs} jobs, ${r.purged_pdfs} PDFs, freed ${(r.freed_bytes / 1e6).toFixed(1)} MB.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={page}>
      {/* Shori greeting in header area */}
      <div style={shoriWrap}>
        <Shori pose="idle" size={88} />
      </div>

      <h1 style={heading1}>Settings</h1>

      {/* ── API Key card ───────────────────────────────────────────── */}
      <section style={card}>
        <h2 style={sectionLabel}>Gemini API key</h2>
        <p style={bodyText}>
          Stored in macOS Keychain. Used for all AI calls (Gemini text · Imagen · Veo · TTS · Audio).
        </p>
        <div style={inputRow}>
          <input
            type="password"
            value={keyValue}
            onChange={(e) => setKeyValue(e.target.value)}
            placeholder={hasKey ? "•••••••• (replace)" : "Paste your Gemini API key"}
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--coral-500)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--hairline-strong)";
            }}
          />
          <Btn
            variant="primary"
            size="md"
            onClick={save}
            disabled={busy || !keyValue.trim()}
          >
            Save
          </Btn>
        </div>
        {hasKey ? (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            style={removeBtn}
          >
            Remove API key
          </button>
        ) : null}
      </section>

      {/* ── Data card ──────────────────────────────────────────────── */}
      <section style={card}>
        <h2 style={sectionLabel}>Data</h2>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexWrap: "wrap" as const,
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={wipe}
            disabled={busy}
            style={dangerBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)";
              e.currentTarget.style.color = "rgb(220,38,38)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--hairline-strong)";
              e.currentTarget.style.color = "var(--ink-soft)";
            }}
          >
            Move all data to Trash
          </button>
          <button
            type="button"
            onClick={emptyTrash}
            disabled={busy}
            style={dangerBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)";
              e.currentTarget.style.color = "rgb(220,38,38)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--hairline-strong)";
              e.currentTarget.style.color = "var(--ink-soft)";
            }}
          >
            Empty Trash (irreversible)
          </button>
        </div>
      </section>

      {/* ── Status toast ───────────────────────────────────────────── */}
      {msg ? (
        <p style={toastStyle}>{msg}</p>
      ) : null}
    </div>
  );
}
