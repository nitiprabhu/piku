"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api, { resolveMediaUrl } from "@/lib/api";
import AppShell from "@/components/AppShell";

const REGULAR_STYLES = ["storytelling", "motivation", "funny", "devotional", "business", "news", "cinematic", "asmr", "ugc", "marketing"];
const INFLUENCER_STYLES = ["daily_routine", "outfit_check", "dance_trend", "travel_vlog", "product_review"];
const LANGUAGES = [
  { value: "hi",       label: "हिंदी" },
  { value: "en",       label: "English" },
  { value: "hinglish", label: "Hinglish" },
  { value: "kn",       label: "ಕನ್ನಡ" },
];
const VOICES = [
  { value: "rohit_m",  label: "Rohit (M) — Hindi" },
  { value: "priya_f",  label: "Priya (F) — Hindi" },
  { value: "arjun_m",  label: "Arjun (M) — English" },
  { value: "ananya_f", label: "Ananya (F) — English" },
  { value: "vikram_m", label: "Vikram (M) — ಕನ್ನಡ" },
  { value: "kavya_f",  label: "Kavya (F) — ಕನ್ನಡ" },
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
    is_serialized: true,
  });

  const [seriesType, setSeriesType] = useState<"regular" | "ai_influencer">("regular");
  const [characterProfile, setCharacterProfile] = useState({
    gender: "female",
    age: "23",
    ethnicity: "Indian",
    hair_style: "long wavy",
    hair_color: "black",
    eye_color: "brown",
    facial_features: "sharp jawline",
    clothing_style: "casual hoodie",
    expression: "smiling warmly",
    custom_description: "",
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }));
  const updateProfile = (k: string, v: string) => setCharacterProfile((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        series_type: seriesType,
        character_profile: seriesType === "ai_influencer" ? characterProfile : null,
      };
      const r = await api.post("/series", payload);
      router.push(`/series/${r.data.id}`);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? (detail as { msg?: string }[]).map(d => d.msg || JSON.stringify(d)).join(", ")
        : typeof detail === "string" ? detail : "Failed to create series";
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
    <AppShell>
      <div style={{ padding: "32px 24px", maxWidth: 650, margin: "0 auto" }}>
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

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Story Mode</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => update("is_serialized", true)}
                  style={{
                    padding: "10px 14px", borderRadius: "var(--r-sm)", cursor: "pointer",
                    fontFamily: "var(--font-body)", textAlign: "left" as const,
                    border: "2px solid var(--ink)",
                    background: form.is_serialized ? "var(--bg-3)" : "var(--bg-2)",
                    boxShadow: form.is_serialized ? "2px 2px 0 var(--ink)" : "none",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>
                    <span style={{ color: form.is_serialized ? "var(--orange)" : "var(--muted)", marginRight: 6 }}>●</span> Continuous
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-2)", marginTop: 4 }}>
                    Episodes build chronologically on previous context.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => update("is_serialized", false)}
                  style={{
                    padding: "10px 14px", borderRadius: "var(--r-sm)", cursor: "pointer",
                    fontFamily: "var(--font-body)", textAlign: "left" as const,
                    border: "2px solid var(--ink)",
                    background: !form.is_serialized ? "var(--bg-3)" : "var(--bg-2)",
                    boxShadow: !form.is_serialized ? "2px 2px 0 var(--ink)" : "none",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>
                    <span style={{ color: !form.is_serialized ? "var(--orange)" : "var(--muted)", marginRight: 6 }}>●</span> Standalone
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-2)", marginTop: 4 }}>
                    Independent episodes with auto-derived pillars.
                  </div>
                </button>
              </div>
            </div>

            {/* Series Type selector hidden — AI Influencer coming soon */}
          </div>

          {seriesType === "ai_influencer" && (
            <div style={{
              border: "2px solid var(--ink)", borderRadius: "var(--r-md)",
              padding: "20px 24px", background: "var(--card)",
              boxShadow: "3px 3px 0 var(--ink)", display: "flex", flexDirection: "column", gap: 16
            }}>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>

              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)", margin: "0 0 4px" }}>
                  ✨ AI Influencer Character Profile
                </h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-2)", margin: 0 }}>
                  Define the visual traits of your virtual influencer. These are injected into every scene prompt to ensure facial consistency.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Gender</label>
                      <select style={inputStyle} value={characterProfile.gender} onChange={(e) => updateProfile("gender", e.target.value)}>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="non-binary">Non-Binary</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Age</label>
                      <input style={inputStyle} type="text" placeholder="e.g. 23" value={characterProfile.age} onChange={(e) => updateProfile("age", e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Ethnicity</label>
                    <select style={inputStyle} value={characterProfile.ethnicity} onChange={(e) => updateProfile("ethnicity", e.target.value)}>
                      <option value="Indian">Indian</option>
                      <option value="East Asian">East Asian</option>
                      <option value="Caucasian">Caucasian</option>
                      <option value="Hispanic">Hispanic</option>
                      <option value="Black">Black</option>
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Hair Style</label>
                      <input style={inputStyle} type="text" placeholder="e.g. long wavy" value={characterProfile.hair_style} onChange={(e) => updateProfile("hair_style", e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>Hair Color</label>
                      <input style={inputStyle} type="text" placeholder="e.g. black" value={characterProfile.hair_color} onChange={(e) => updateProfile("hair_color", e.target.value)} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Eye Color</label>
                      <input style={inputStyle} type="text" placeholder="e.g. brown" value={characterProfile.eye_color} onChange={(e) => updateProfile("eye_color", e.target.value)} />
                    </div>
                    <div>
                      <label style={labelStyle}>Expression</label>
                      <input style={inputStyle} type="text" placeholder="e.g. smiling warmly" value={characterProfile.expression} onChange={(e) => updateProfile("expression", e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Clothing Style</label>
                    <input style={inputStyle} type="text" placeholder="e.g. casual hoodie" value={characterProfile.clothing_style} onChange={(e) => updateProfile("clothing_style", e.target.value)} />
                  </div>

                  <div>
                    <label style={labelStyle}>Facial Features</label>
                    <input style={inputStyle} type="text" placeholder="e.g. sharp jawline, dimples" value={characterProfile.facial_features} onChange={(e) => updateProfile("facial_features", e.target.value)} />
                  </div>

                  <div>
                    <label style={labelStyle}>Custom Description Override (Optional)</label>
                    <textarea
                      style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
                      placeholder="If provided, this overrides the traits above. e.g. A gorgeous 22 year old Indian girl with green eyes, short pixie hair, wearing traditional saree."
                      value={characterProfile.custom_description}
                      onChange={(e) => updateProfile("custom_description", e.target.value)}
                    />
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  alignItems: "center",
                  justifyContent: "flex-start",
                  border: "2px solid var(--ink)",
                  borderRadius: "var(--r-md)",
                  padding: 16,
                  background: "var(--bg-2)",
                  position: "relative",
                }}>
                  <div style={labelStyle}>Character Face Preview</div>
                  <div style={{
                    width: "100%",
                    aspectRatio: "9/16",
                    background: "var(--bg-3)",
                    border: "2px solid var(--ink)",
                    borderRadius: "var(--r-sm)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    position: "relative",
                    boxShadow: "inset 0 0 10px rgba(0,0,0,0.1)",
                  }}>
                    {previewLoading ? (
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(255, 255, 255, 0.7)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        zIndex: 10,
                      }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          border: "4px solid var(--muted)",
                          borderTopColor: "var(--orange)",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }} />
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink)", textTransform: "uppercase" }}>Generating...</div>
                      </div>
                    ) : null}

                    {previewUrl ? (
                      <img
                        src={resolveMediaUrl(previewUrl)}
                        alt="Character Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{
                        textAlign: "center",
                        padding: 16,
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        color: "var(--ink-2)",
                      }}>
                        No preview generated yet. Configure traits and generate.
                      </div>
                    )}
                  </div>

                  {previewError && (
                    <div style={{
                      color: "#EF4444",
                      fontFamily: "var(--font-body)",
                      fontSize: 12,
                      textAlign: "center",
                      marginTop: 4,
                    }}>
                      {previewError}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={previewLoading}
                    onClick={async () => {
                      setPreviewLoading(true);
                      setPreviewError("");
                      setPreviewUrl(null);
                      try {
                        const response = await api.post("/series/character-preview", {
                          character_profile: characterProfile,
                        });
                        setPreviewUrl(response.data.preview_url);
                      } catch (err: any) {
                        setPreviewError(err.response?.data?.detail || "Failed to generate preview.");
                      } finally {
                        setPreviewLoading(false);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontFamily: "var(--font-body)",
                      fontWeight: 700,
                      fontSize: 13,
                      color: "#fff",
                      background: "var(--orange)",
                      border: "2px solid var(--ink)",
                      borderRadius: "var(--r-sm)",
                      boxShadow: "2px 2px 0 var(--ink)",
                      cursor: previewLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    {previewUrl ? "Regenerate Face 🔄" : "Generate Character Face ✨"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Style</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {(seriesType === "ai_influencer" ? INFLUENCER_STYLES : REGULAR_STYLES).map((s) => (
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
                  {s.replace("_", " ")}
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
    </AppShell>
  );
}
