"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

const STYLES = ["storytelling", "motivation", "funny", "devotional", "business", "news"];
const LANGUAGES = [
  { value: "hi", label: "हिंदी" },
  { value: "en", label: "English" },
  { value: "hinglish", label: "Hinglish" },
];
const VOICES = [
  { value: "rohit_m", label: "Rohit (M)" },
  { value: "priya_f", label: "Priya (F)" },
  { value: "arjun_m", label: "Arjun (M)" },
  { value: "ananya_f", label: "Ananya (F)" },
];

export default function NewSeriesPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    topic: "",
    style: "storytelling",
    language: "hi",
    voice_id: "rohit_m",
    duration_target: 60,
    caption_mode: "full_sentence",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await api.post("/series", form);
      router.push(`/series/${r.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Failed to create series";
      setError(msg);
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "10px 14px", boxSizing: "border-box" as const,
    fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink)",
    background: "var(--bg-2)", border: "2px solid var(--ink)",
    borderRadius: "var(--r-sm)", outline: "none",
  };

  const labelStyle = {
    display: "block", fontFamily: "var(--font-mono)", fontSize: 11,
    textTransform: "uppercase" as const, letterSpacing: "0.1em",
    color: "var(--muted)", marginBottom: 6,
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 600, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <Link
          href="/series"
          style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-2)", textDecoration: "none" }}
        >
          ← Back to Series
        </Link>
      </div>

      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--ink)", margin: "0 0 8px" }}>
        New Series
      </h1>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink-2)", marginBottom: 32 }}>
        Define the universe — each episode will continue the story automatically.
      </p>

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={labelStyle}>Series Name</label>
          <input
            style={inputStyle}
            placeholder="e.g. Mahabharata Secrets"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Topic / Universe</label>
          <textarea
            style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
            placeholder="Describe the story universe, characters, and themes. e.g. Ancient Indian mythology — stories of warriors, sages, and divine battles from the Mahabharata era, told in dramatic 3D animated style."
            value={form.topic}
            onChange={(e) => update("topic", e.target.value)}
            required
            minLength={10}
          />
        </div>

        <div>
          <label style={labelStyle}>Style</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {STYLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update("style", s)}
                style={{
                  padding: "8px 12px", borderRadius: "var(--r-sm)", cursor: "pointer",
                  fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13,
                  border: "2px solid var(--ink)",
                  background: form.style === s ? "var(--orange)" : "var(--bg-2)",
                  color: form.style === s ? "#fff" : "var(--ink)",
                  boxShadow: form.style === s ? "2px 2px 0 var(--ink)" : "none",
                  textTransform: "capitalize",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Language</label>
            <select style={inputStyle} value={form.language} onChange={(e) => update("language", e.target.value)}>
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Voice</label>
            <select style={inputStyle} value={form.voice_id} onChange={(e) => update("voice_id", e.target.value)}>
              {VOICES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Duration (s)</label>
            <select style={inputStyle} value={form.duration_target} onChange={(e) => update("duration_target", Number(e.target.value))}>
              <option value={30}>30s</option>
              <option value={45}>45s</option>
              <option value={60}>60s</option>
              <option value={90}>90s</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Caption Style</label>
            <select style={inputStyle} value={form.caption_mode} onChange={(e) => update("caption_mode", e.target.value)}>
              <option value="full_sentence">Full sentence</option>
              <option value="keyword_pop">Keyword pop</option>
            </select>
          </div>
        </div>

        {error && (
          <div style={{
            background: "#FEF2F2", border: "2px solid #EF4444",
            borderRadius: "var(--r-sm)", padding: "10px 14px",
            fontFamily: "var(--font-body)", fontSize: 14, color: "#B91C1C",
          }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 24px",
            fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 16,
            color: "#fff", background: loading ? "var(--muted)" : "var(--orange)",
            border: "2px solid var(--ink)", borderRadius: "var(--r-sm)",
            boxShadow: loading ? "none" : "3px 3px 0 var(--ink)",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating..." : "Create Series →"}
        </button>
      </form>
    </div>
  );
}
