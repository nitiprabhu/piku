"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
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
  { value: "mystery", emoji: "🔮", label: "Mystery" },
  { value: "facts", emoji: "🧠", label: "Facts" },
  { value: "cinematic", emoji: "🎥", label: "Cinematic" },
  { value: "asmr", emoji: "🤤", label: "ASMR" },
  { value: "ugc", emoji: "🤳", label: "UGC" },
  { value: "marketing", emoji: "📈", label: "Marketing" },
];

// Image-specific content types
const IMAGE_NICHES = [
  { id: "motivation_quote", label: "Motivation Quotes", emoji: "✨", style: "motivation_quote", lang: "en", bg: "linear-gradient(135deg,#B45309,#F59E0B)", color: "#FEF3C7", desc: "Inspirational quote cards" },
  { id: "did_you_know",    label: "Did You Know",     emoji: "🧠", style: "did_you_know",    lang: "hi", bg: "linear-gradient(135deg,#1D4ED8,#06B6D4)", color: "#E0F2FE", desc: "Fact & trivia cards" },
  { id: "meme",            label: "Memes",             emoji: "😂", style: "meme",            lang: "en", bg: "linear-gradient(135deg,#7C2D12,#EA580C)", color: "#FFEDD5", desc: "Funny relatable images" },
  { id: "politics",        label: "Politics",          emoji: "🏛️", style: "politics",        lang: "hi", bg: "linear-gradient(135deg,#1E3A5F,#FF6B00)", color: "#FFF", desc: "Political opinion posts" },
  { id: "news_image",      label: "News",              emoji: "📰", style: "news_image",      lang: "hi", bg: "linear-gradient(135deg,#1C1917,#DC2626)", color: "#FEE2E2", desc: "Breaking news headlines" },
  { id: "education_story", label: "Education",         emoji: "📚", style: "education_story", lang: "en", bg: "linear-gradient(135deg,#065F46,#059669)", color: "#D1FAE5", desc: "Illustrated learning stories" },
];

const IMAGE_STYLES = [
  { value: "motivation_quote", emoji: "✨", label: "Quote" },
  { value: "did_you_know",     emoji: "🧠", label: "Facts" },
  { value: "meme",             emoji: "😂", label: "Meme" },
  { value: "politics",         emoji: "🏛️", label: "Politics" },
  { value: "news_image",       emoji: "📰", label: "News" },
  { value: "education_story",  emoji: "📚", label: "Education" },
];

const COLOR_THEMES = [
  { id: "dark_space",  label: "Dark Space",  bg: "#0A0E1A", accent: "#C9A84C", text: "#FFFFFF" },
  { id: "clean_white", label: "Clean White", bg: "#FFFFFF", accent: "#E94560", text: "#1A1A2E" },
  { id: "deep_purple", label: "Deep Purple", bg: "#16213E", accent: "#A8DADC", text: "#FFFFFF" },
  { id: "warm_cream",  label: "Warm Cream",  bg: "#FFF8E7", accent: "#D4870A", text: "#2D1B00" },
  { id: "bold_orange", label: "Bold Orange", bg: "#FF6B35", accent: "#FFFFFF", text: "#1A1A1A" },
];

const NICHES = [
  { id: "devotional", label: "Devotional", emoji: "🪔", style: "devotional", lang: "hi", bg: "linear-gradient(135deg,#78350F,#D97706)", color: "#FEF3C7" },
  { id: "motivation", label: "Motivation", emoji: "🔥", style: "motivation", lang: "hinglish", bg: "linear-gradient(135deg,#7F1D1D,#DC2626)", color: "#FEE2E2" },
  { id: "rahasya", label: "Rahasya / Mystery", emoji: "🔮", style: "mystery", lang: "hi", bg: "linear-gradient(135deg,#1C1917,#7C3AED)", color: "#DDD6FE" },
  { id: "business", label: "Business", emoji: "💼", style: "business", lang: "hinglish", bg: "linear-gradient(135deg,#0C4A6E,#0284C7)", color: "#E0F2FE" },
  { id: "funny", label: "Funny / Comedy", emoji: "😂", style: "funny", lang: "hi", bg: "linear-gradient(135deg,#7C2D12,#EA580C)", color: "#FFEDD5" },
  { id: "news", label: "News / Updates", emoji: "📰", style: "news", lang: "hi", bg: "linear-gradient(135deg,#1E3A5F,#2563EB)", color: "#DBEAFE" },
  { id: "cinematic", label: "Cinematic Epic", emoji: "🎥", style: "cinematic", lang: "en", bg: "linear-gradient(135deg,#1F2937,#111827)", color: "#F3F4F6" },
  { id: "asmr", label: "ASMR / Sensory", emoji: "🤤", style: "asmr", lang: "en", bg: "linear-gradient(135deg,#F472B6,#BE185D)", color: "#FDF2F8" },
  { id: "ugc", label: "UGC / Authentic", emoji: "🤳", style: "ugc", lang: "hinglish", bg: "linear-gradient(135deg,#10B981,#047857)", color: "#ECFDF5" },
  { id: "marketing", label: "Marketing Ad", emoji: "📈", style: "marketing", lang: "en", bg: "linear-gradient(135deg,#F59E0B,#B45309)", color: "#FEF3C7" },
];

function getDynamicVoice(lang: string, style: string): string {
  if (lang === "kn") return "vikram_m";
  if (lang === "en") return style === "motivation" ? "ananya_f" : "arjun_m";
  if (style === "motivation" || style === "funny" || style === "relationship") return "priya_f";
  return "rohit_m"; // devotional, mystery, business, news
}

const VOICES = [
  { id: "rohit_m",  label: "Rohit",  emoji: "🧔",    lang: "Hindi",    gender: "Heavy Male", speechText: "नमस्कार! मैं रोहित हूँ।",        langKeys: ["hi", "hinglish"], previewLang: "hi-IN" },
  { id: "priya_f",  label: "Priya",  emoji: "👩",    lang: "Hindi",    gender: "Female",     speechText: "नमस्ते! मैं प्रिया हूँ।",         langKeys: ["hi", "hinglish"], previewLang: "hi-IN" },
  { id: "arjun_m",  label: "Arjun",  emoji: "🧔",    lang: "English",  gender: "Heavy Male", speechText: "Hello! I am Arjun.",              langKeys: ["en"],             previewLang: "en-US" },
  { id: "ananya_f", label: "Ananya", emoji: "👩‍💼", lang: "English",  gender: "Female",     speechText: "Hi! I am Ananya.",                langKeys: ["en"],             previewLang: "en-US" },
  { id: "vikram_m", label: "Vikram", emoji: "🧔",    lang: "Kannada",  gender: "Male",       speechText: "ನಮಸ್ಕಾರ! ನಾನು ವಿಕ್ರಮ್.",        langKeys: ["kn"],             previewLang: "kn-IN" },
  { id: "kavya_f",  label: "Kavya",  emoji: "👩",    lang: "Kannada",  gender: "Female",     speechText: "ನಮಸ್ಕಾರ! ನಾನು ಕಾವ್ಯ.",          langKeys: ["kn"],             previewLang: "kn-IN" },
];

const DEFAULT_VOICE: Record<string, string> = {
  hi: "rohit_m", hinglish: "rohit_m", en: "arjun_m", kn: "vikram_m",
};

const LANGUAGES = [
  { value: "hi",       label: "हिंदी",   flag: "🇮🇳" },
  { value: "en",       label: "English",  flag: "🌐" },
  { value: "hinglish", label: "Hinglish", flag: "✨" },
  { value: "kn",       label: "ಕನ್ನಡ",   flag: "🇮🇳" },
];

const DURATIONS = [
  { value: 30, label: "30s", desc: "Best for Reels" },
  { value: 60, label: "60s", desc: "Standard" },
  { value: 90, label: "90s", desc: "Long form" },
];

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

export default function CreateFormPage() {
  const router = useRouter();
  const params = useParams();
  const contentType = (params.type as string) || "video"; // "video" | "image" | "carousel"

  const isVideo    = contentType === "video";
  const isImage    = contentType === "image";
  const isCarousel = contentType === "carousel";

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

  const [form, setForm] = useState(() => {
    const savedLang = typeof window !== "undefined" ? localStorage.getItem("rc_lang") : null;
    const defaultLang = initParams.lang || (savedLang && savedLang !== "all" ? savedLang : "hi");
    return {
      prompt: initParams.prompt,
      language: defaultLang,
      style: initParams.style,
      voice_id: "rohit_m",
      enable_captions: true,
      duration: 60,
      template_id: initParams.tplId,
    };
  });
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(initParams.character);
  const [credits, setCredits] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [imageCount, setImageCount] = useState(3);
  const [colorTheme, setColorTheme] = useState("dark_space");
  const [brandHandle, setBrandHandle] = useState(() => {
    if (typeof window === "undefined") return "";
    // Auto-populate from stored user's instagram handle, then localStorage fallback
    try {
      const user = JSON.parse(localStorage.getItem("rc_user") || "{}");
      return user.instagram_handle || localStorage.getItem("rc_brand_handle") || "";
    } catch { return localStorage.getItem("rc_brand_handle") || ""; }
  });
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [aiIdeas, setAiIdeas] = useState<string[]>([]);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [ideaMode, setIdeaMode] = useState<"ai" | "type">("type");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const didInit = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (didInit.current) return;
    didInit.current = true;

    const user = getStoredUser();
    if (!user) { router.push("/login"); return; }
    setTimeout(() => {
      if (user.plan) setUserPlan(user.plan);
    }, 0);
    api.get("/user/credits").then((r) => { setCredits(r.data.remaining); setUserPlan(r.data.plan || "free"); }).catch(() => {});
    const audio = audioRef.current;
    return () => { audio?.pause(); };
  }, [router]);

  const selectTemplate = (tpl: Template) => {
    const prompt = getRandomPrompt(tpl.prompt_examples);
    setAiIdeas([]);
    setForm({ ...form, style: tpl.category || "motivation", language: tpl.language || "hi", prompt, template_id: tpl.id, voice_id: getDynamicVoice(tpl.language || "hi", tpl.category || "motivation") });
  };

  const generateAiPrompt = async () => {
    setGeneratingPrompt(true);
    try {
      const { data } = await api.post("/generate/idea", { style: form.style, language: form.language });
      setForm(f => ({ ...f, prompt: data.prompt }));
      setAiIdeas([]);
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
      u.lang = v.previewLang;
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        const langCode = v.previewLang.split("-")[0];
        const langVoices = voices.filter(voice => voice.lang.toLowerCase().startsWith(langCode));
        const isMale = v.gender.toLowerCase().includes("male");
        const maleKw = ["male","guy","man","boy","rishi","ravi","hemant","david","mark","george","daniel","oliver","harry","thomas","nathan","evan","russel","james","alex"];
        const femaleKw = ["female","girl","woman","lady","samantha","priya","ananya","lekha","zira","heera","kavita","tessa","moira","karen","veena","sangeeta","hazel","susan","siri"];
        let matched: SpeechSynthesisVoice | undefined;
        if (isMale) {
          matched = langVoices.find(v => maleKw.some(kw => v.name.toLowerCase().includes(kw)));
          if (!matched) matched = langVoices.find(v => !femaleKw.some(kw => v.name.toLowerCase().includes(kw)));
        } else {
          matched = langVoices.find(v => femaleKw.some(kw => v.name.toLowerCase().includes(kw)));
        }
        if (matched) u.voice = matched;
        else if (langVoices.length > 0) u.voice = langVoices[0];
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
      const apiContentType = isImage ? "image_post" : isCarousel ? "carousel_post" : "video";
      const { data } = await api.post("/generate", {
        ...form,
        character: isVideo ? selectedCharacter : null,
        content_type: apiContentType,
        image_count: isCarousel ? imageCount : 1,
        brand_handle: (isImage || isCarousel) && brandHandle ? brandHandle : null,
        color_theme: (isImage || isCarousel) ? colorTheme : null,
      });
      router.push(`/projects/${data.project_id}?job_id=${data.job_id}`);
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
      const msg = typeof detail === "string"
        ? detail
        : Array.isArray(detail)
        ? detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(", ")
        : "Failed to start generation";
      setError(msg);
      setLoading(false);
    }
  };

  const sel = (active: boolean) => ({
    background: active ? "var(--orange)" : "var(--card)",
    color: active ? "#fff" : "var(--ink)",
    border: "2px solid var(--ink)",
    boxShadow: active ? "var(--shadow-sm)" : "none",
  });

  if (!isMounted) return null;

  return (
    <AppShell>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Back link */}
        <button
          onClick={() => router.push("/create")}
          style={{ alignSelf: "flex-start", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--muted)", fontFamily: "var(--font-body)", padding: 0 }}
        >
          ← Change type
        </button>

        {/* Heading */}
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,38px)", color: "var(--ink)", marginBottom: 4 }}>
            {isImage ? "CREATE IMAGE POST 📸" : isCarousel ? "CREATE CAROUSEL 🎠" : "CREATE YOUR REEL 🎬"}
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 15 }}>
            {isImage
              ? "Describe your idea — AI writes caption and generates a 9:16 hero image"
              : isCarousel
              ? "Describe your idea — AI generates multiple slides for Instagram"
              : "Describe your idea — AI writes, voices & composes it"}
          </p>
        </div>

        {/* Quick starters for Image ONLY (removed Video DB templates) */}
        {!isVideo && (
          <SectionCard label="⚡ Quick Starters" sublabel="Tap to auto-fill your prompt">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              {[
                { emoji: "✨", label: "Monday Motivation", lang: "EN", style: "motivation_quote", prompt: "Write a powerful Monday morning motivation quote about never giving up on your dreams, with a short context line below the quote" },
                { emoji: "🧠", label: "Brain Fact",        lang: "EN", style: "did_you_know",    prompt: "Share a surprising scientific fact about the human brain that most people don't know, in simple language" },
                { emoji: "😂", label: "Desi Meme",        lang: "HI", style: "meme",            prompt: "Create a funny relatable meme about Indian office life, chai breaks, and working from home struggles" },
                { emoji: "🏛️", label: "India Politics",   lang: "HI", style: "politics",        prompt: "Bold opinion post about India's youth power and their role in shaping the nation's future" },
                { emoji: "📰", label: "Tech News",        lang: "EN", style: "news_image",      prompt: "Breaking news style post about India's booming startup and tech ecosystem in 2025" },
                { emoji: "📚", label: "Story Lesson",     lang: "EN", style: "education_story", prompt: "Tell the story of how Elon Musk went from nearly bankrupt to the world's richest person — 4-panel visual story" },
              ].map((t) => {
                const active = form.prompt === t.prompt;
                return (
                  <button key={t.label} onClick={() => {
                    setForm(f => ({ ...f, prompt: t.prompt, style: t.style }));
                    setSelectedNiche(null);
                  }} style={{
                    padding: "14px 12px", borderRadius: "var(--r-sm)", textAlign: "left", cursor: "pointer",
                    fontFamily: "var(--font-body)", transition: "all 0.08s ease", ...sel(active),
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{t.emoji}</div>
                    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>{t.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, textTransform: "uppercase" }}>{t.lang}</div>
                  </button>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Language + Duration (Duration hidden for image/carousel) */}
        <div style={{ display: "grid", gridTemplateColumns: isVideo ? "1fr 1fr" : "1fr", gap: 16 }}>
          <SectionCard label="Language">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {LANGUAGES.map((l) => (
                <button key={l.value} onClick={() => { setForm({ ...form, language: l.value, voice_id: getDynamicVoice(l.value, form.style), template_id: "" }); if (typeof window !== "undefined") localStorage.setItem("rc_lang", l.value); }}
                  style={{ padding: "10px 12px", borderRadius: "var(--r-sm)", textAlign: "left", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, transition: "all 0.08s ease", ...sel(form.language === l.value) }}>
                  {l.flag} {l.label}
                </button>
              ))}
            </div>
          </SectionCard>

          {isVideo && (
            <SectionCard label="Duration">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DURATIONS.map((d) => {
                  const locked = userPlan === "free" && d.value > 30;
                  return (
                    <button key={d.value} onClick={() => { if (!locked) setForm({ ...form, duration: d.value }); }}
                      style={{
                        padding: "10px 12px", borderRadius: "var(--r-sm)", textAlign: "left",
                        cursor: locked ? "default" : "pointer", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700,
                        transition: "all 0.08s ease", opacity: locked ? 0.5 : 1,
                        ...(locked ? { background: "var(--bg-2)", color: "var(--muted)", border: "2px solid var(--ink)", boxShadow: "none" } : sel(form.duration === d.value)),
                      }}>
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span>{d.label} <span style={{ fontWeight: 400, fontSize: 12, opacity: 0.6 }}>{d.desc}</span></span>
                        {locked && <span style={{ fontSize: 9, fontWeight: 800, background: "var(--orange)", color: "#fff", borderRadius: 999, padding: "2px 7px", letterSpacing: "0.08em", border: "1.5px solid var(--ink)" }}>PAID</span>}
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
          )}
        </div>

        {/* Niche — video niches for video, image niches for image/carousel */}
        {isVideo ? (
          <SectionCard label="Pick Your Niche" sublabel="Auto-fills style and language for you">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 }}>
              {NICHES.map((n) => {
                const active = selectedNiche === n.id;
                return (
                  <button key={n.id} onClick={() => {
                    setSelectedNiche(active ? null : n.id);
                    if (!active) { setForm(f => ({ ...f, style: n.style, language: n.lang, voice_id: getDynamicVoice(n.lang, n.style), template_id: "" })); }
                  }} style={{
                    padding: 0, border: active ? "3px solid var(--orange)" : "2px solid var(--ink)",
                    borderRadius: "var(--r-sm)", cursor: "pointer", overflow: "hidden",
                    boxShadow: active ? "3px 3px 0 var(--orange)" : "2px 2px 0 var(--ink)",
                    transition: "all 0.08s ease", background: "none",
                  }}>
                    <div style={{ background: n.bg, padding: "14px 6px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 22 }}>{n.emoji}</span>
                      <span style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 11, color: n.color, textAlign: "center", lineHeight: 1.2 }}>{n.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </SectionCard>
        ) : (
          <SectionCard label="Content Type" sublabel="Choose what kind of image post to create">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {IMAGE_NICHES.map((n) => {
                const active = selectedNiche === n.id;
                return (
                  <button key={n.id} onClick={() => {
                    setSelectedNiche(active ? null : n.id);
                    if (!active) { setForm(f => ({ ...f, style: n.style, language: n.lang, template_id: "" })); }
                  }} style={{
                    padding: 0, border: active ? "3px solid var(--orange)" : "2px solid var(--ink)",
                    borderRadius: "var(--r-sm)", cursor: "pointer", overflow: "hidden",
                    boxShadow: active ? "3px 3px 0 var(--orange)" : "2px 2px 0 var(--ink)",
                    transition: "all 0.08s ease", background: "none",
                  }}>
                    <div style={{ background: n.bg, padding: "18px 12px 14px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 28 }}>{n.emoji}</span>
                      <span style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 13, color: n.color, textAlign: "center", lineHeight: 1.2 }}>{n.label}</span>
                      <span style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 10, color: n.color, opacity: 0.75, textAlign: "center" }}>{n.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Prompt */}
        <SectionCard label="Your Idea">
          <div style={{ display: "flex", gap: 0, marginBottom: 14, border: "2px solid var(--ink)", borderRadius: "var(--r-sm)", overflow: "hidden", width: "fit-content" }}>
            {(["type", "ai"] as const).map((mode) => (
              <button key={mode} onClick={() => setIdeaMode(mode)} style={{
                padding: "6px 16px", fontSize: 12, fontWeight: 800,
                fontFamily: "var(--font-body)", cursor: "pointer", border: "none",
                background: ideaMode === mode ? "var(--ink)" : "transparent",
                color: ideaMode === mode ? "var(--bg)" : "var(--ink)",
                transition: "all 0.1s ease",
              }}>
                {mode === "type" ? "✍️ Type Yourself" : "✨ Generate with AI"}
              </button>
            ))}
          </div>
          {ideaMode === "ai" && (
            <div style={{ marginBottom: 12 }}>
              <button onClick={generateAiPrompt} disabled={generatingPrompt} style={{
                display: "flex", alignItems: "center", gap: 6, width: "100%",
                justifyContent: "center", background: "var(--orange)", color: "#fff",
                border: "2px solid var(--ink)", borderRadius: "var(--r-sm)",
                padding: "10px 16px", fontSize: 13, fontWeight: 800,
                fontFamily: "var(--font-body)", cursor: generatingPrompt ? "default" : "pointer",
                opacity: generatingPrompt ? 0.7 : 1, marginBottom: 10,
              }}>
                {generatingPrompt
                  ? <><span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} /> Generating idea...</>
                  : <>✨ Generate idea based on <strong style={{ marginLeft: 4 }}>{STYLES.find(s => s.value === form.style)?.label || "selected"} style</strong></>}
              </button>
            </div>
          )}
          {ideaMode === "type" && <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>Describe your idea in Hindi or English</p>}
          {aiIdeas.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {aiIdeas.map((idea, i) => (
                <button key={i} onClick={() => setForm({ ...form, prompt: idea })} style={{
                  background: form.prompt === idea ? "var(--orange)" : "var(--card-hover, #f5f5f5)",
                  color: form.prompt === idea ? "#fff" : "var(--ink)",
                  border: "1.5px solid var(--ink)", borderRadius: "var(--r-sm)",
                  padding: "10px 14px", textAlign: "left", cursor: "pointer",
                  fontFamily: "var(--font-body)", fontSize: 13, lineHeight: 1.5, fontWeight: 500,
                }}>{idea}</button>
              ))}
            </div>
          )}
          <textarea
            placeholder="Aaj ka thought kya hai? Describe your idea..."
            value={form.prompt}
            onChange={(e) => { setForm({ ...form, prompt: e.target.value }); }}
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

        {/* Style — video only (image uses Content Type niche which sets style automatically) */}
        {isVideo && (selectedNiche ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", border: "2px solid var(--ink)", borderRadius: "var(--r-sm)", background: "var(--bg-2)", fontFamily: "var(--font-body)" }}>
            <span style={{ fontSize: 13, color: "var(--ink-2)" }}>
              Style: <strong style={{ color: "var(--ink)" }}>{STYLES.find(s => s.value === form.style)?.emoji} {STYLES.find(s => s.value === form.style)?.label}</strong>
              <span style={{ opacity: 0.5, marginLeft: 6 }}>(set by niche)</span>
            </span>
            <button onClick={() => setSelectedNiche(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "var(--orange)", fontFamily: "var(--font-body)" }}>Change ↓</button>
          </div>
        ) : (
          <SectionCard label="Style" sublabel="Set your content style">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}>
              {STYLES.map((s) => (
                <button key={s.value} onClick={() => { setForm({ ...form, style: s.value, template_id: "", voice_id: getDynamicVoice(form.language, s.value) }); setSelectedNiche(null); }}
                  style={{ padding: "10px 4px", borderRadius: "var(--r-sm)", textAlign: "center", cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.08s ease", ...sel(form.style === s.value) }}>
                  <div style={{ fontSize: 20, marginBottom: 3 }}>{s.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{s.label}</div>
                </button>
              ))}
            </div>
          </SectionCard>
        ))}



        {/* Carousel slide count */}
        {isCarousel && (
          <SectionCard label="Number of Slides" sublabel="How many images in your carousel?">
            <div style={{ display: "flex", gap: 10 }}>
              {[2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setImageCount(n)} style={{
                  flex: 1, padding: "14px 0", borderRadius: "var(--r-sm)", textAlign: "center",
                  cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 18,
                  transition: "all 0.08s ease", ...sel(imageCount === n),
                }}>{n}</button>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Voice (video only) */}
        {isVideo && (
          <SectionCard label="Voice">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
              {VOICES.filter(v => v.langKeys.includes(form.language)).map((v) => {
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
                    }}>{playing ? "■" : "▶"}</button>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {/* Character — video only */}
        {isVideo && (
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
        )}

        {/* Color theme + Brand handle — image/carousel only */}
        {(isImage || isCarousel) && (<>
          <SectionCard label="Color Theme" sublabel="Pick your card's color palette">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              {COLOR_THEMES.map((t) => (
                <button key={t.id} onClick={() => setColorTheme(t.id)} style={{
                  padding: "16px 6px 12px", borderRadius: "var(--r-sm)", cursor: "pointer",
                  border: colorTheme === t.id ? "3px solid var(--orange)" : "2px solid var(--ink)",
                  boxShadow: colorTheme === t.id ? "3px 3px 0 var(--orange)" : "2px 2px 0 var(--ink)",
                  background: t.bg, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  transition: "all 0.08s ease",
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: t.accent, border: "2px solid rgba(255,255,255,0.3)" }} />
                  <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 9, color: t.text, textAlign: "center", lineHeight: 1.3 }}>{t.label}</span>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard label="Brand Handle (Optional)" sublabel="Your @handle will appear on top-right of the image">
            <input
              type="text"
              placeholder="@yourhandle"
              value={brandHandle}
              onChange={(e) => {
                setBrandHandle(e.target.value);
                if (typeof window !== "undefined") localStorage.setItem("rc_brand_handle", e.target.value);
              }}
              className="input-field"
              style={{ fontSize: 14 }}
              maxLength={50}
            />
          </SectionCard>
        </>)}

        {/* Captions (video only) */}
        {isVideo && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: "2px solid var(--ink)", borderRadius: "var(--r-sm)", background: "var(--card)", cursor: "pointer" }}
            onClick={() => setForm(f => ({ ...f, enable_captions: !f.enable_captions }))}>
            <div style={{ width: 22, height: 22, borderRadius: 4, border: "2px solid var(--ink)", background: form.enable_captions ? "var(--orange)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.1s" }}>
              {form.enable_captions && <span style={{ color: "#fff", fontSize: 14, fontWeight: 900, lineHeight: 1 }}>✓</span>}
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 14 }}>Show Captions on Video</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                {form.enable_captions ? "Captions will be burned into video" : "No captions — clean video"}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "var(--orange-lt)", border: "2px solid var(--orange)", borderRadius: "var(--r-sm)", padding: "12px 16px", fontSize: 14, color: "var(--orange-dark)", fontWeight: 600 }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading || form.prompt.length < 10} className="btn-hard"
          style={{ width: "100%", padding: "16px", fontSize: 18, justifyContent: "center", opacity: form.prompt.length < 10 ? 0.5 : 1 }}>
          {loading
            ? <><span className="spin" style={{ width: 22, height: 22, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} /> Starting…</>
            : isImage ? "📸 Image Banao!" : isCarousel ? "🎠 Carousel Banao!" : "🎬 Video Banao!"}
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
          {isImage ? "Takes ~15 seconds" : isCarousel ? `Takes ~20 seconds · ${imageCount} slides` : "Takes ~45 seconds"} · Uses 1 credit
        </p>
      </div>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} onUpgraded={() => { setCredits(9999); setShowUpgrade(false); }} />}
      <audio ref={audioRef} style={{ display: "none" }} />
    </AppShell>
  );
}
