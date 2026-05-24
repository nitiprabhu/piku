"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api, { getStoredUser } from "@/lib/api";
import AppShell from "@/components/AppShell";
import UpgradeModal from "@/components/UpgradeModal";

const CHARACTERS = [
  { id: "raju_bhaiya", emoji: "🤣", name: "Raju Bhaiya", desc: "Desi uncle comedy", lang: "Hindi" },
  { id: "priya_di", emoji: "💪", name: "Priya Didi", desc: "Big sis motivation", lang: "Hinglish" },
  { id: "professor_sharma", emoji: "🎓", name: "Prof. Sharma", desc: "Patient teacher", lang: "Hindi" },
  { id: "rohit_anchor", emoji: "📺", name: "Rohit Anchor", desc: "News dramatic", lang: "Hindi" },
  { id: "dev_startup", emoji: "🚀", name: "Dev Bhai", desc: "Startup founder", lang: "Hinglish" },
  { id: "pandit_gyani", emoji: "🙏", name: "Pandit Ji", desc: "Spiritual guru", lang: "Hindi" },
];

const STYLES = [
  { value: "funny", emoji: "😂", label: "Funny" },
  { value: "devotional", emoji: "🙏", label: "Devotional" },
  { value: "motivation", emoji: "🔥", label: "Motivation" },
  { value: "business", emoji: "💼", label: "Business" },
  { value: "news", emoji: "📰", label: "News" },
  { value: "storytelling", emoji: "📖", label: "Story" },
];

// P2: Visual niche cards — maps to style + suggested language
const NICHES = [
  { id: "mythology", label: "Mythology", emoji: "⚔️", style: "storytelling", lang: "hi", bg: "linear-gradient(135deg,#2D1B4E,#6B21A8)", color: "#E9D5FF" },
  { id: "devotional", label: "Devotional", emoji: "🪔", style: "devotional", lang: "hi", bg: "linear-gradient(135deg,#78350F,#D97706)", color: "#FEF3C7" },
  { id: "motivation", label: "Motivation", emoji: "🔥", style: "motivation", lang: "hinglish", bg: "linear-gradient(135deg,#7F1D1D,#DC2626)", color: "#FEE2E2" },
  { id: "scary", label: "Scary Stories", emoji: "👻", style: "storytelling", lang: "hi", bg: "linear-gradient(135deg,#111827,#374151)", color: "#D1FAE5" },
  { id: "business", label: "Business", emoji: "💼", style: "business", lang: "hinglish", bg: "linear-gradient(135deg,#0C4A6E,#0284C7)", color: "#E0F2FE" },
  { id: "funny", label: "Funny / Comedy", emoji: "😂", style: "funny", lang: "hi", bg: "linear-gradient(135deg,#7C2D12,#EA580C)", color: "#FFEDD5" },
  { id: "anime", label: "Anime Stories", emoji: "🗡️", style: "storytelling", lang: "en", bg: "linear-gradient(135deg,#4C1D95,#7C3AED)", color: "#EDE9FE" },
  { id: "news", label: "News / Updates", emoji: "📰", style: "news", lang: "hi", bg: "linear-gradient(135deg,#1E3A5F,#2563EB)", color: "#DBEAFE" },
  { id: "relationship", label: "Relationships", emoji: "💕", style: "funny", lang: "hinglish", bg: "linear-gradient(135deg,#831843,#DB2777)", color: "#FCE7F3" },
  { id: "heist", label: "Heist / Crime", emoji: "🔫", style: "storytelling", lang: "en", bg: "linear-gradient(135deg,#1C1917,#44403C)", color: "#D6D3D1" },
];

const VOICES = [
  { id: "rohit_m", label: "Rohit", emoji: "🧔", lang: "Hindi", gender: "Heavy Male", speechText: "नमस्कार! मैं रोहित हूँ।" },
  { id: "priya_f", label: "Priya", emoji: "👩", lang: "Hindi", gender: "Female", speechText: "नमस्ते! मैं प्रिया हूँ।" },
  { id: "arjun_m", label: "Arjun", emoji: "🧔", lang: "English", gender: "Heavy Male", speechText: "Hello! I am Arjun." },
  { id: "ananya_f", label: "Ananya", emoji: "👩‍💼", lang: "English", gender: "Female", speechText: "Hi! I am Ananya." },
];

const LANGUAGES = [
  { value: "hi", label: "हिंदी", flag: "🇮🇳" },
  { value: "en", label: "English", flag: "🌐" },
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

interface Template {
  id: string;
  name: string;
  category: string | null;
  language: string | null;
  prompt_examples: string[] | null;
}

function getRandomPrompt(examples: string[] | null) {
  if (!examples || examples.length === 0) return "";
  return examples[Math.floor(Math.random() * examples.length)];
}

export default function CreatePage() {
  const router = useRouter();

  // Read URL search params directly — avoids useSearchParams + Suspense requirement
  const [initParams] = useState(() => {
    if (typeof window === "undefined") return { prompt: "", character: null as string | null, style: "motivation", lang: "", tplId: "" };
    const p = new URLSearchParams(window.location.search);
    return {
      prompt:    p.get("prompt") || "",
      character: p.get("character") || null,
      style:     p.get("style") || "motivation",
      lang:      p.get("language") || "",
      tplId:     p.get("template_id") || "",
    };
  });

  const initPrompt    = initParams.prompt;
  const initCharacter = initParams.character;
  const initStyle     = initParams.style;
  const initLang      = initParams.lang;
  const initTplId     = initParams.tplId;

  const [form, setForm] = useState(() => {
    const savedLang = typeof window !== "undefined" ? localStorage.getItem("rc_lang") : null;
    const defaultLang = initLang || (savedLang && savedLang !== "all" ? savedLang : "hi");
    return {
      prompt: initPrompt,
      language: defaultLang,
      style: initStyle,
      voice_id: "rohit_m",
      duration: 30,
      template_id: initTplId,
    };
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTplId, setSelectedTplId] = useState(initTplId);
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(initCharacter);
  const [credits, setCredits] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [aiIdeas, setAiIdeas] = useState<string[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [ideaMode, setIdeaMode] = useState<"ai" | "type">("type");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const user = getStoredUser();
    if (!user) { router.push("/login"); return; }
    setTimeout(() => {
      if (user.plan) setUserPlan(user.plan);
    }, 0);
    api.get("/user/credits").then((r) => { setCredits(r.data.remaining); setUserPlan(r.data.plan || "free"); }).catch(() => { });
    api.get("/templates").then((r) => setTemplates(r.data)).catch(() => { });
    const audio = audioRef.current;
    return () => { audio?.pause(); };
  }, [router]);

  const selectTemplate = (tpl: Template) => {
    const prompt = getRandomPrompt(tpl.prompt_examples);
    setSelectedTplId(tpl.id);
    setAiIdeas([]);
    setForm({ ...form, style: tpl.category || "motivation", language: tpl.language || "hi", prompt, template_id: tpl.id });
  };

  const fetchAiIdeas = async () => {
    if (!selectedTplId) return;
    setIdeasLoading(true);
    try {
      const { data } = await api.get(`/templates/${selectedTplId}/ideas`);
      setAiIdeas(data.ideas || []);
    } catch {
      // silently fail — ideas are non-critical
    } finally {
      setIdeasLoading(false);
    }
  };

  const generateAiPrompt = async () => {
    setGeneratingPrompt(true);
    try {
      const { data } = await api.post("/generate/idea", { style: form.style, language: form.language });
      setForm(f => ({ ...f, prompt: data.prompt }));
      setAiIdeas([]);
      setSelectedTplId("");
    } catch {
      // silently fail
    } finally {
      setGeneratingPrompt(false);
    }
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
      const isHindi = v.lang === "Hindi";
      u.lang = isHindi ? "hi-IN" : "en-US";

      if (typeof window !== "undefined" && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        const langCode = isHindi ? "hi" : "en";
        const langVoices = voices.filter(voice =>
          voice.lang.toLowerCase().startsWith(langCode)
        );

        const isMale = v.gender.toLowerCase().includes("male");
        let matchedVoice: SpeechSynthesisVoice | undefined;

        if (isMale) {
          const maleKeywords = [
            "male", "guy", "man", "boy", "rishi", "ravi", "hemant",
            "david", "mark", "george", "daniel", "oliver", "harry",
            "thomas", "nathan", "evan", "russel", "james", "alex"
          ];
          // Try to find a voice that matches male keywords
          matchedVoice = langVoices.find(voice => {
            const nameLower = voice.name.toLowerCase();
            return maleKeywords.some(kw => nameLower.includes(kw));
          });

          // If no specific male keyword matches, try to exclude known female voices/keywords
          if (!matchedVoice) {
            const femaleKeywords = [
              "female", "girl", "woman", "lady", "samantha", "priya",
              "ananya", "lekha", "zira", "heera", "kavita", "tessa",
              "moira", "karen", "veena", "sangeeta", "hazel", "susan"
            ];
            matchedVoice = langVoices.find(voice => {
              const nameLower = voice.name.toLowerCase();
              return !femaleKeywords.some(kw => nameLower.includes(kw));
            });
          }
        } else {
          // Female voice matching
          const femaleKeywords = [
            "female", "girl", "woman", "lady", "samantha", "priya",
            "ananya", "lekha", "zira", "heera", "kavita", "tessa",
            "moira", "karen", "veena", "sangeeta", "hazel", "susan", "siri"
          ];
          matchedVoice = langVoices.find(voice => {
            const nameLower = voice.name.toLowerCase();
            return femaleKeywords.some(kw => nameLower.includes(kw));
          });
        }

        if (matchedVoice) {
          u.voice = matchedVoice;
        } else if (langVoices.length > 0) {
          u.voice = langVoices[0];
        }
      }

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
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Failed to start generation");
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
          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 0, marginBottom: 14, border: "2px solid var(--ink)", borderRadius: "var(--r-sm)", overflow: "hidden", width: "fit-content" }}>
            {(["type", "ai"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setIdeaMode(mode)}
                style={{
                  padding: "6px 16px", fontSize: 12, fontWeight: 800,
                  fontFamily: "var(--font-body)", cursor: "pointer", border: "none",
                  background: ideaMode === mode ? "var(--ink)" : "transparent",
                  color: ideaMode === mode ? "var(--bg)" : "var(--ink)",
                  transition: "all 0.1s ease",
                }}
              >
                {mode === "type" ? "✍️ Type Yourself" : "✨ Generate with AI"}
              </button>
            ))}
          </div>

          {ideaMode === "ai" && (
            <div style={{ marginBottom: 12 }}>
              <button
                onClick={generateAiPrompt}
                disabled={generatingPrompt}
                style={{
                  display: "flex", alignItems: "center", gap: 6, width: "100%",
                  justifyContent: "center", background: "var(--orange)", color: "#fff",
                  border: "2px solid var(--ink)", borderRadius: "var(--r-sm)",
                  padding: "10px 16px", fontSize: 13, fontWeight: 800,
                  fontFamily: "var(--font-body)", cursor: generatingPrompt ? "default" : "pointer",
                  opacity: generatingPrompt ? 0.7 : 1, marginBottom: 10,
                }}
              >
                {generatingPrompt
                  ? <><span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Generating idea...</>
                  : <>✨ Generate idea based on {STYLES.find(s => s.value === form.style)?.label || "selected"} style</>}
              </button>
              {selectedTplId && (
                <button onClick={fetchAiIdeas} disabled={ideasLoading || generatingPrompt}
                  style={{ background: "none", border: "none", cursor: ideasLoading ? "default" : "pointer", fontSize: 12, fontWeight: 700, color: "var(--orange)", fontFamily: "var(--font-body)", opacity: ideasLoading ? 0.6 : 1, display: "block", marginBottom: 8 }}>
                  {ideasLoading ? "⏳ Getting ideas..." : "🔄 Get template ideas instead"}
                </button>
              )}
            </div>
          )}
          {ideaMode === "type" && (
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>Describe your reel in Hindi or English</p>
          )}
          {aiIdeas.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {aiIdeas.map((idea, i) => (
                <button key={i} onClick={() => setForm({ ...form, prompt: idea })}
                  style={{
                    background: form.prompt === idea ? "var(--orange)" : "var(--card-hover, #f5f5f5)",
                    color: form.prompt === idea ? "#fff" : "var(--ink)",
                    border: "1.5px solid var(--ink)",
                    borderRadius: "var(--r-sm)",
                    padding: "10px 14px",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}>
                  {idea}
                </button>
              ))}
            </div>
          )}
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

        {/* Niche visual cards (P2) */}
        <SectionCard label="Pick Your Niche" sublabel="Auto-fills style and language for you">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
            {NICHES.map((n) => {
              const active = selectedNiche === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    setSelectedNiche(active ? null : n.id);
                    if (!active) {
                      setForm(f => ({ ...f, style: n.style, language: n.lang, template_id: "" }));
                      setSelectedTplId("");
                    }
                  }}
                  style={{
                    padding: 0, border: active ? "3px solid var(--orange)" : "2px solid var(--ink)",
                    borderRadius: "var(--r-sm)", cursor: "pointer", overflow: "hidden",
                    boxShadow: active ? "3px 3px 0 var(--orange)" : "2px 2px 0 var(--ink)",
                    transition: "all 0.08s ease", background: "none",
                  }}
                >
                  <div style={{
                    background: n.bg, padding: "14px 6px 10px",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  }}>
                    <span style={{ fontSize: 22 }}>{n.emoji}</span>
                    <span style={{
                      fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 11,
                      color: n.color, textAlign: "center", lineHeight: 1.2,
                    }}>{n.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Style — fine-tune after niche */}
        <SectionCard label="Style" sublabel="Override niche default if needed">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}>
            {STYLES.map((s) => (
              <button key={s.value} onClick={() => { setForm({ ...form, style: s.value, template_id: "" }); setSelectedTplId(""); setSelectedNiche(null); }}
                style={{ padding: "10px 4px", borderRadius: "var(--r-sm)", textAlign: "center", cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.08s ease", ...sel(form.style === s.value) }}>
                <div style={{ fontSize: 20, marginBottom: 3 }}>{s.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{s.label}</div>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Language + Duration */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <SectionCard label="Language">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {LANGUAGES.map((l) => (
                <button key={l.value} onClick={() => { setForm({ ...form, language: l.value, template_id: "" }); setSelectedTplId(""); if (typeof window !== "undefined") localStorage.setItem("rc_lang", l.value); }}
                  style={{ padding: "10px 12px", borderRadius: "var(--r-sm)", textAlign: "left", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, transition: "all 0.08s ease", ...sel(form.language === l.value) }}>
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard label="Duration">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DURATIONS.map((d) => {
                const isFree = userPlan === "free";
                const locked = isFree && d.value > 30;
                return (
                  <button key={d.value}
                    onClick={() => { if (!locked) setForm({ ...form, duration: d.value }); }}
                    style={{
                      padding: "10px 12px", borderRadius: "var(--r-sm)", textAlign: "left",
                      cursor: locked ? "default" : "pointer",
                      fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700,
                      transition: "all 0.08s ease", opacity: locked ? 0.5 : 1,
                      ...(locked ? { background: "var(--bg-2)", color: "var(--muted)", border: "2px solid var(--ink)", boxShadow: "none" } : sel(form.duration === d.value)),
                    }}>
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>{d.label} <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.6 }}>{d.desc}</span></span>
                      {locked && (
                        <span style={{ fontSize: 9, fontWeight: 800, background: "var(--orange)", color: "#fff", borderRadius: 999, padding: "2px 7px", letterSpacing: "0.08em", border: "1.5px solid var(--ink)" }}>
                          PAID
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            {userPlan === "free" && (
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, fontWeight: 600 }}>
                Free plan: 30s max. <a href="/pricing" style={{ color: "var(--orange)", textDecoration: "none", fontWeight: 800 }}>Upgrade →</a>
              </p>
            )}
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
