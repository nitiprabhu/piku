"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import api, { getStoredUser } from "@/lib/api";
import AppShell from "@/components/AppShell";
import UpgradeModal from "@/components/UpgradeModal";

const CATEGORY_META: Record<string, { emoji: string; label: string; gradient: string }> = {
  funny:        { emoji: "😂", label: "Funny & Comedy",       gradient: "linear-gradient(135deg,#FF6B35,#FFD700)" },
  devotional:   { emoji: "🙏", label: "Devotional & Spiritual", gradient: "linear-gradient(135deg,#B7791F,#F6E05E)" },
  motivation:   { emoji: "🔥", label: "Motivation & Hustle",  gradient: "linear-gradient(135deg,#7F1D1D,#DC2626)" },
  business:     { emoji: "💼", label: "Business & Startup",   gradient: "linear-gradient(135deg,#0C4A6E,#0284C7)" },
  news:         { emoji: "📰", label: "News & Affairs",       gradient: "linear-gradient(135deg,#1A365D,#2B6CB0)" },
  storytelling: { emoji: "📖", label: "Storytelling",         gradient: "linear-gradient(135deg,#6D28D9,#8B5CF6)" },
};

const LANGUAGES = [
  { value: "hi",       label: "हिंदी",   flag: "🇮🇳" },
  { value: "en",       label: "English",  flag: "🌐" },
  { value: "hinglish", label: "Hinglish", flag: "✨" },
  { value: "kn",       label: "ಕನ್ನಡ",   flag: "🇮🇳" },
];

const DEFAULT_VOICE: Record<string, string> = {
  hi: "rohit_m", hinglish: "rohit_m", en: "arjun_m", kn: "vikram_m",
};

// Character id → voice id (overrides language default)
const CHARACTER_VOICE: Record<string, string> = {
  priya_di:          "priya_f",
  raju_bhaiya:       "rohit_m",
  professor_sharma:  "rohit_m",
  rohit_anchor:      "anchor_m",
  dev_startup:       "startup_m",
  pandit_gyani:      "rohit_m",
};

type Template = {
  id: string;
  name: string;
  category: string | null;
  language: string | null;
  description: string | null;
  template_type: string;
  prompt_examples: string[] | null;
  style_config: { gradient?: string; emoji?: string; tags?: string[]; character_id?: string } | null;
};

function randomPick<T>(arr: T[] | null): T | null {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function TemplateCreatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.template_id as string;

  const [tpl, setTpl] = useState<Template | null>(null);
  const [tplError, setTplError] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("hi");
  const [langLocked, setLangLocked] = useState(true);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const user = getStoredUser();
    if (!user) { router.push("/login"); return; }
    api.get("/user/credits").then((r) => { setCredits(r.data.remaining); setUserPlan(r.data.plan || "free"); }).catch(() => {});
    api.get(`/templates/${templateId}`)
      .then((r) => {
        const t: Template = r.data;
        setTpl(t);
        const lang = t.language || "hi";
        setLanguage(lang);
        const ex = randomPick(t.prompt_examples);
        if (ex) setPrompt(ex);
      })
      .catch(() => setTplError(true));
  }, [router, templateId]);

  const fetchIdeas = async () => {
    setIdeasLoading(true);
    try {
      const { data } = await api.get(`/templates/${templateId}/ideas`);
      setIdeas(data.ideas || []);
    } catch {
      // non-critical
    } finally {
      setIdeasLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (prompt.length < 10) { setError("Write at least 10 characters"); return; }
    if (credits !== null && credits <= 0) { setShowUpgrade(true); return; }
    if (!tpl) return;
    setLoading(true); setError(null);
    try {
      const charId = tpl.template_type === "character" ? tpl.style_config?.character_id : undefined;
      const voice_id = (charId && CHARACTER_VOICE[charId]) || DEFAULT_VOICE[language] || "rohit_m";
      const body: Record<string, unknown> = {
        prompt,
        language,
        style: tpl.category || "motivation",
        voice_id,
        enable_captions: true,
        duration: userPlan === "free" ? 30 : 60,
        template_id: tpl.id,
      };
      if (charId) {
        body.character = charId;
      }
      const { data } = await api.post("/generate", body);
      router.push(`/projects/${data.project_id}?job_id=${data.job_id}`);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Failed to start generation");
      setLoading(false);
    }
  };

  if (tplError) {
    return (
      <AppShell>
        <div style={{ maxWidth: 560, margin: "60px auto", padding: "0 24px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <p style={{ color: "var(--ink)", fontWeight: 700, marginBottom: 16 }}>Template not found.</p>
          <button onClick={() => router.push("/templates")} className="btn-hard" style={{ padding: "10px 24px" }}>
            ← Back to Templates
          </button>
        </div>
      </AppShell>
    );
  }

  if (!tpl) {
    return (
      <AppShell>
        <div style={{ maxWidth: 560, margin: "60px auto", padding: "0 24px" }}>
          <div style={{ height: 180, borderRadius: "var(--r-md)", border: "2px solid var(--ink)" }} className="shimmer" />
          <div style={{ height: 24, borderRadius: 8, border: "2px solid var(--ink)", marginTop: 20 }} className="shimmer" />
          <div style={{ height: 120, borderRadius: "var(--r-sm)", border: "2px solid var(--ink)", marginTop: 16 }} className="shimmer" />
        </div>
      </AppShell>
    );
  }

  const isChar = tpl.template_type === "character";
  const sc = tpl.style_config || {};
  const catMeta = CATEGORY_META[tpl.category || ""] || null;
  const headerGradient = sc.gradient || catMeta?.gradient || "linear-gradient(135deg,#374151,#6B7280)";
  const headerEmoji = isChar ? (sc.emoji || "🎭") : (catMeta?.emoji || "🎬");
  const langLabel = (v: string) => LANGUAGES.find(l => l.value === v)?.label || v;

  return (
    <AppShell>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Back */}
        <button
          onClick={() => router.push("/templates")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-2)", fontSize: 13, fontWeight: 700, textAlign: "left", padding: 0, fontFamily: "var(--font-body)" }}
        >
          ← Template Gallery
        </button>

        {/* Template header card */}
        <div style={{ borderRadius: "var(--r-md)", border: "2px solid var(--ink)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
          <div style={{ background: headerGradient, padding: "28px 24px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "var(--r-sm)", border: "2px solid rgba(255,255,255,0.4)",
              background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0,
            }}>
              {headerEmoji}
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>{tpl.name.toUpperCase()}</div>
              {tpl.description && (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4, lineHeight: 1.4 }}>{tpl.description}</div>
              )}
            </div>
          </div>
          {/* Locked settings strip */}
          <div style={{ background: "var(--card)", padding: "10px 16px", display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid var(--ink-faint, rgba(0,0,0,0.08))" }}>
            {catMeta && (
              <span style={{ fontSize: 11, fontWeight: 800, background: "var(--bg-2, #f5f5f5)", border: "1.5px solid var(--ink)", borderRadius: 999, padding: "3px 10px", color: "var(--ink)" }}>
                {catMeta.emoji} {catMeta.label}
              </span>
            )}
            {isChar && (
              <span style={{ fontSize: 11, fontWeight: 800, background: "var(--bg-2, #f5f5f5)", border: "1.5px solid var(--ink)", borderRadius: 999, padding: "3px 10px", color: "var(--ink)" }}>
                🎭 Character Voice
              </span>
            )}
            <span style={{ fontSize: 11, fontWeight: 800, background: "var(--bg-2, #f5f5f5)", border: "1.5px solid var(--ink)", borderRadius: 999, padding: "3px 10px", color: "var(--ink)" }}>
              🔒 Auto-configured
            </span>
          </div>
        </div>

        {/* Language */}
        <div style={{ border: "2px solid var(--ink)", borderRadius: "var(--r-md)", background: "var(--card)", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ink-faint, rgba(0,0,0,0.08))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--ink)" }}>LANGUAGE</div>
            {langLocked && (
              <button
                onClick={() => setLangLocked(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "var(--orange)", fontFamily: "var(--font-body)" }}
              >
                Change ↓
              </button>
            )}
          </div>
          {langLocked ? (
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{LANGUAGES.find(l => l.value === language)?.flag}</span>
              <span style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>{langLabel(language)}</span>
              <span style={{ fontSize: 11, color: "var(--ink-2)", marginLeft: "auto" }}>from template</span>
            </div>
          ) : (
            <div style={{ padding: "12px 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {LANGUAGES.map((l) => {
                const active = language === l.value;
                return (
                  <button key={l.value} onClick={() => setLanguage(l.value)} style={{
                    padding: "8px 14px", borderRadius: 999, cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13,
                    border: "2px solid var(--ink)",
                    background: active ? "var(--orange)" : "var(--bg-2, #f5f5f5)",
                    color: active ? "#fff" : "var(--ink)",
                    boxShadow: active ? "var(--shadow-sm)" : "none",
                    transition: "all 0.08s ease",
                  }}>
                    {l.flag} {l.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Prompt */}
        <div style={{ border: "2px solid var(--ink)", borderRadius: "var(--r-md)", background: "var(--card)", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ink-faint, rgba(0,0,0,0.08))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--ink)" }}>YOUR IDEA</div>
            <button
              onClick={fetchIdeas}
              disabled={ideasLoading}
              style={{
                background: "var(--orange)", color: "#fff", border: "2px solid var(--ink)",
                borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 800,
                cursor: ideasLoading ? "default" : "pointer", fontFamily: "var(--font-body)",
                opacity: ideasLoading ? 0.7 : 1,
              }}
            >
              {ideasLoading ? "..." : "✨ AI Ideas"}
            </button>
          </div>

          {ideas.length > 0 && (
            <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 6, borderBottom: "1px solid var(--ink-faint, rgba(0,0,0,0.08))" }}>
              {ideas.map((idea, i) => (
                <button key={i} onClick={() => { setPrompt(idea); setIdeas([]); }} style={{
                  background: "var(--bg-2, #f5f5f5)", border: "1.5px solid var(--ink)", borderRadius: "var(--r-sm)",
                  padding: "10px 12px", textAlign: "left", cursor: "pointer", fontFamily: "var(--font-body)",
                  fontSize: 13, lineHeight: 1.5, fontWeight: 500, color: "var(--ink)",
                  transition: "background 0.08s",
                }}>
                  {idea}
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: "14px 16px" }}>
            <textarea
              placeholder="Describe your specific idea for this reel..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="input-field"
              style={{ height: 130, resize: "none", lineHeight: 1.6, border: "none", padding: 0, borderRadius: 0, background: "transparent", width: "100%", outline: "none" }}
              maxLength={500}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
              <span style={{ color: prompt.length < 10 ? "var(--pink)" : "var(--green)", fontWeight: 700 }}>
                {prompt.length < 10 ? `${10 - prompt.length} more chars needed` : "✓ Ready"}
              </span>
              <span>{prompt.length}/500</span>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: "var(--orange-lt)", border: "2px solid var(--orange)", borderRadius: "var(--r-sm)", padding: "12px 16px", fontSize: 14, color: "var(--orange-dark)", fontWeight: 600 }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading || prompt.length < 10} className="btn-hard"
          style={{ width: "100%", padding: "16px", fontSize: 18, justifyContent: "center", opacity: prompt.length < 10 ? 0.5 : 1 }}>
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
