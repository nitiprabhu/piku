"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api, { getStoredUser } from "@/lib/api";
import AppShell from "@/components/AppShell";
import UpgradeModal from "@/components/UpgradeModal";

const CHARACTERS = [
  { id: "raju_bhaiya",      emoji: "🤣", name: "Raju Bhaiya",   desc: "Desi uncle comedy",  lang: "Hindi" },
  { id: "priya_di",         emoji: "💪", name: "Priya Didi",     desc: "Big sis motivation", lang: "Hinglish" },
  { id: "professor_sharma", emoji: "🎓", name: "Prof. Sharma",   desc: "Patient teacher",    lang: "Hindi" },
  { id: "rohit_anchor",     emoji: "📺", name: "Rohit Anchor",   desc: "News dramatic",      lang: "Hindi" },
  { id: "dev_startup",      emoji: "🚀", name: "Dev Bhai",       desc: "Startup founder",    lang: "Hinglish" },
  { id: "pandit_gyani",     emoji: "🙏", name: "Pandit Ji",      desc: "Spiritual guru",     lang: "Hindi" },
];

const STYLES = [
  { value: "funny",      emoji: "😂", label: "Funny" },
  { value: "devotional", emoji: "🙏", label: "Devotional" },
  { value: "motivation", emoji: "🔥", label: "Motivation" },
  { value: "business",   emoji: "💼", label: "Business" },
  { value: "news",       emoji: "📰", label: "News" },
];

const VOICES = [
  { id: "rohit_m",  label: "Rohit",  emoji: "👨",    lang: "Hindi",   gender: "Male",   speechText: "नमस्कार! मैं रोहित हूँ।" },
  { id: "priya_f",  label: "Priya",  emoji: "👩",    lang: "Hindi",   gender: "Female", speechText: "नमस्ते! मैं प्रिया हूँ।" },
  { id: "arjun_m",  label: "Arjun",  emoji: "👨‍💼",  lang: "English", gender: "Male",   speechText: "Hello! I am Arjun." },
  { id: "ananya_f", label: "Ananya", emoji: "👩‍💼",  lang: "English", gender: "Female", speechText: "Hi! I am Ananya." },
];

const LANGUAGES = [
  { value: "hi",       label: "हिंदी",   flag: "🇮🇳" },
  { value: "en",       label: "English",  flag: "🌐" },
  { value: "hinglish", label: "Hinglish", flag: "✨" },
];

const DURATIONS = [
  { value: 30, label: "30s", desc: "Best for Reels" },
  { value: 60, label: "60s", desc: "Standard" },
  { value: 90, label: "90s", desc: "Long form" },
];

/* ── Tiny section card wrapper ── */
function SectionCard({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <div className="section-label">{label}</div>
        {sublabel && <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{sublabel}</p>}
      </div>
      {children}
    </div>
  );
}

export default function CreatePage() {
  return <Suspense><CreatePageInner /></Suspense>;
}

function CreatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = getStoredUser();

  const [form, setForm] = useState({
    prompt:      searchParams.get("prompt") || "",
    language:    searchParams.get("language") || "hi",
    style:       searchParams.get("style") || "motivation",
    voice_id:    "rohit_m",
    duration:    60,
    template_id: searchParams.get("template_id") || "",
  });
  const [templates,         setTemplates]         = useState<any[]>([]);
  const [selectedTplId,     setSelectedTplId]      = useState(searchParams.get("template_id") || "");
  const [selectedCharacter, setSelectedCharacter]  = useState<string | null>(searchParams.get("character") || null);
  const [credits,           setCredits]            = useState<number | null>(null);
  const [loading,           setLoading]            = useState(false);
  const [error,             setError]              = useState<string | null>(null);
  const [showUpgrade,       setShowUpgrade]        = useState(false);
  const [playingVoice,      setPlayingVoice]       = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    api.get("/user/credits").then((r) => setCredits(r.data.remaining)).catch(() => {});
    api.get("/templates").then((r) => setTemplates(r.data)).catch(() => {});
    return () => { audioRef.current?.pause(); };
  }, []);

  const selectTemplate = (tpl: any) => {
    const ex = tpl.prompt_examples || [];
    const prompt = ex.length ? ex[Math.floor(Math.random() * ex.length)] : "";
    setSelectedTplId(tpl.id);
    setForm({ ...form, style: tpl.category || "motivation", language: tpl.language || "hi", prompt, template_id: tpl.id });
  };

  const previewVoice = (v: typeof VOICES[0], e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingVoice === v.id) {
      window.speechSynthesis?.cancel();
      setPlayingVoice(null);
    } else {
      window.speechSynthesis?.cancel();
      setPlayingVoice(v.id);
      const u = new SpeechSynthesisUtterance(v.speechText);
      u.lang = v.lang === "Hindi" ? "hi-IN" : "en-US";
      u.onend = u.onerror = () => setPlayingVoice(null);
      window.speechSynthesis?.speak(u);
    }
  };

  const handleSubmit = async () => {
    if (form.prompt.length < 10) { setError("Write at least 10 characters"); return; }
    if (credits !== null && credits <= 0) { setShowUpgrade(true); return; }
    setLoading(true); setError(null);
    try {
      const { data } = await api.post("/generate", { ...form, character: selectedCharacter });
      router.push(`/projects/${data.project_id}?job_id=${data.job_id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to start generation");
      setLoading(false);
    }
  };

  const sel = (active: boolean) => ({
    background: active ? "var(--orange)" : "var(--card)",
    color: active ? "#fff" : "var(--ink)",
    border: "2px solid var(--ink)",
    boxShadow: active ? "var(--shadow-sm)" : "none",
  });

  return (
    <AppShell>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Heading */}
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,38px)", color: "var(--ink)", marginBottom: 4 }}>
            CREATE YOUR REEL 🎬
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 15 }}>Describe your idea — AI writes, voices & composes it</p>
        </div>

        {/* Quick templates */}
        {templates.length > 0 && (
          <SectionCard label="⚡ Quick Templates" sublabel="Click to auto-fill your prompt">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {templates.slice(0, 6).map((tpl) => {
                const active = selectedTplId === tpl.id;
                const emoji = STYLES.find(s => s.value === tpl.category)?.emoji || "✨";
                return (
                  <button key={tpl.id} onClick={() => selectTemplate(tpl)} style={{
                    padding: "12px", borderRadius: "var(--r-sm)", textAlign: "left", cursor: "pointer",
                    fontFamily: "var(--font-body)", transition: "all 0.08s ease",
                    ...sel(active),
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</div>
                    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>{tpl.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, textTransform: "uppercase" }}>
                      {tpl.language === "hi" ? "Hindi" : tpl.language}
                    </div>
                  </button>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Prompt */}
        <SectionCard label="Your Idea">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Describe your reel in Hindi or English</span>
            {selectedTplId && (
              <button onClick={() => { const t = templates.find(t => t.id === selectedTplId); if (t) selectTemplate(t); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--orange)", fontFamily: "var(--font-body)" }}>
                🎲 Alt Prompt
              </button>
            )}
          </div>
          <textarea
            placeholder="Aaj ka thought kya hai? Describe your reel idea..."
            value={form.prompt}
            onChange={(e) => { setForm({ ...form, prompt: e.target.value }); setSelectedTplId(""); }}
            className="input-field"
            style={{ height: 120, resize: "none", lineHeight: 1.6 }}
            maxLength={500}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
            <span style={{ color: form.prompt.length < 10 ? "var(--pink)" : "var(--green)", fontWeight: 700 }}>
              {form.prompt.length < 10 ? `${10 - form.prompt.length} more chars needed` : "✓ Ready"}
            </span>
            <span>{form.prompt.length}/500</span>
          </div>
        </SectionCard>

        {/* Style */}
        <SectionCard label="Style">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
            {STYLES.map((s) => (
              <button key={s.value} onClick={() => { setForm({ ...form, style: s.value, template_id: "" }); setSelectedTplId(""); }}
                style={{ padding: "12px 6px", borderRadius: "var(--r-sm)", textAlign: "center", cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.08s ease", ...sel(form.style === s.value) }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{s.label}</div>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Language + Duration */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <SectionCard label="Language">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {LANGUAGES.map((l) => (
                <button key={l.value} onClick={() => { setForm({ ...form, language: l.value, template_id: "" }); setSelectedTplId(""); }}
                  style={{ padding: "10px 12px", borderRadius: "var(--r-sm)", textAlign: "left", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, transition: "all 0.08s ease", ...sel(form.language === l.value) }}>
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard label="Duration">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DURATIONS.map((d) => (
                <button key={d.value} onClick={() => setForm({ ...form, duration: d.value })}
                  style={{ padding: "10px 12px", borderRadius: "var(--r-sm)", textAlign: "left", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, transition: "all 0.08s ease", ...sel(form.duration === d.value) }}>
                  {d.label} <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.6 }}>{d.desc}</span>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Voice */}
        <SectionCard label="Voice">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {VOICES.map((v) => {
              const active = form.voice_id === v.id;
              const playing = playingVoice === v.id;
              return (
                <div key={v.id} onClick={() => setForm({ ...form, voice_id: v.id })} style={{
                  padding: "14px", borderRadius: "var(--r-sm)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12, position: "relative",
                  transition: "all 0.08s ease", fontFamily: "var(--font-body)", ...sel(active),
                }}>
                  <span style={{ fontSize: 28 }}>{v.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{v.label}</div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>{v.lang} · {v.gender}</div>
                  </div>
                  <button onClick={(e) => previewVoice(v, e)} style={{
                    width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    border: "2px solid var(--ink)", background: playing ? "var(--orange)" : "var(--bg-2)",
                    cursor: "pointer", fontSize: 11, color: playing ? "#fff" : "var(--ink)",
                    boxShadow: playing ? "var(--shadow-sm)" : "none",
                  }}>
                    {playing ? "■" : "▶"}
                  </button>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Character */}
        <SectionCard label="Character (Optional)" sublabel="Character overrides style — GPT writes in their unique voice">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {CHARACTERS.map((c) => {
              const active = selectedCharacter === c.id;
              return (
                <div key={c.id} onClick={() => setSelectedCharacter(active ? null : c.id)} style={{
                  padding: "12px", borderRadius: "var(--r-sm)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10,
                  transition: "all 0.08s ease", fontFamily: "var(--font-body)", ...sel(active),
                }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{c.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{c.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{c.desc}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: active ? "rgba(255,255,255,0.7)" : "var(--orange-dark)", textTransform: "uppercase" }}>{c.lang}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {selectedCharacter && (
            <button onClick={() => setSelectedCharacter(null)} style={{ marginTop: 10, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-body)" }}>
              ✕ Clear character
            </button>
          )}
        </SectionCard>

        {/* Error */}
        {error && (
          <div style={{ background: "var(--orange-lt)", border: "2px solid var(--orange)", borderRadius: "var(--r-sm)", padding: "12px 16px", fontSize: 14, color: "var(--orange-dark)", fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading || form.prompt.length < 10} className="btn-hard"
          style={{ width: "100%", padding: "16px", fontSize: 18, justifyContent: "center", opacity: form.prompt.length < 10 ? 0.5 : 1 }}>
          {loading
            ? <><span className="spin" style={{ width: 22, height: 22, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} /> Starting…</>
            : "🎬 Video Banao!"}
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)" }}>Takes ~45 seconds · Uses 1 credit</p>
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} onUpgraded={() => { setCredits(9999); setShowUpgrade(false); }} />}
    </AppShell>
  );
}
