"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api, { getStoredUser } from "@/lib/api";
import AppShell, { useLang } from "@/components/AppShell";

const CATEGORY_META: Record<string, { emoji: string; label: string }> = {
  funny:        { emoji: "😂", label: "Funny & Comedy" },
  devotional:   { emoji: "🙏", label: "Devotional & Spiritual" },
  motivation:   { emoji: "🔥", label: "Motivation & Hustle" },
  business:     { emoji: "💼", label: "Business & Startup" },
  news:         { emoji: "📰", label: "News & Affairs" },
  storytelling: { emoji: "📖", label: "Storytelling" },
};

type Template = {
  id: string;
  name: string;
  category: string | null;
  language: string | null;
  description: string | null;
  template_type: string;
  prompt_examples: string[] | null;
  style_config: Record<string, any> | null;
  thumbnail_url: string | null;
  sort_order: number;
};

type InspirationVideo = {
  id: string;
  title: string;
  prompt: string;
  category: string;
  language: string;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_s: number | null;
};

export default function TemplatesPage() {
  const router = useRouter();
  const user = getStoredUser();
  const { lang } = useLang();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [inspirations, setInspirations] = useState<InspirationVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("all");

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    Promise.all([
      api.get("/templates").then((r) => setTemplates(r.data)),
      api.get("/inspire").then((r) => setInspirations(r.data)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const regularTemplates = templates.filter((t) => t.template_type !== "character");
  const characterTemplates = templates.filter((t) => t.template_type === "character");

  // Derive available categories from actual data
  const availableCategories = ["all", ...Array.from(
    new Set([...regularTemplates, ...characterTemplates].map((t) => t.category).filter(Boolean))
  ).filter((c) => CATEGORY_META[c!])];

  const langMatch = (itemLang: string) =>
    lang === "all" || itemLang === lang ||
    (lang === "hi" && itemLang === "hi") ||
    (lang === "hinglish" && itemLang === "hinglish") ||
    (lang === "en" && itemLang === "en");

  // Only show inspiration cards that have actual media
  const filteredInspirations = inspirations.filter((v) =>
    (active === "all" || v.category === active) &&
    langMatch(v.language) &&
    !!(v.video_url || v.thumbnail_url)
  );

  const filteredRegular = regularTemplates.filter(
    (t) => (active === "all" || t.category === active) && langMatch(t.language || "hi")
  );
  const filteredChars = characterTemplates.filter(
    (t) => active === "all" || t.category === active
  );

  const useTemplate = (tpl: Template) => {
    const examples = tpl.prompt_examples || [];
    const prompt = examples.length > 0 ? examples[Math.floor(Math.random() * examples.length)] : "";
    router.push(`/create?${new URLSearchParams({
      template_id: tpl.id,
      style: tpl.category || "motivation",
      language: tpl.language || "hi",
      prompt,
    })}`);
  };

  const useCharacter = (tpl: Template) => {
    const sc = tpl.style_config || {};
    const prompt = (tpl.prompt_examples || [])[0] || "";
    router.push(`/create?${new URLSearchParams({
      character: sc.character_id || "",
      style: tpl.category || "funny",
      language: tpl.language || "hi",
      prompt,
    })}`);
  };

  const tryInspiration = (v: InspirationVideo) => {
    router.push(`/create?${new URLSearchParams({
      prompt: v.prompt,
      style: v.category,
      language: v.language,
    })}`);
  };

  return (
    <AppShell>
      <div style={{ padding: "32px 28px", maxWidth: 1100 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,40px)", color: "var(--ink)", marginBottom: 4 }}>
            TEMPLATE GALLERY
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 15 }}>Pick a template, customize your idea, generate in seconds</p>
        </div>

        {/* Category tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          {availableCategories.map((cat) => {
            const meta = cat ? CATEGORY_META[cat] : null;
            const isActive = active === cat;
            return (
              <button
                key={cat}
                onClick={() => setActive(cat!)}
                style={{
                  padding: "8px 16px", borderRadius: 999,
                  border: "2px solid var(--ink)",
                  background: isActive ? "var(--orange)" : "var(--card)",
                  color: isActive ? "#fff" : "var(--ink)",
                  fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13,
                  cursor: "pointer",
                  boxShadow: isActive ? "var(--shadow-sm)" : "none",
                  transition: "all 0.08s ease",
                }}
              >
                {meta ? `${meta.emoji} ${meta.label}` : "✨ All"}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ aspectRatio: "9/16", borderRadius: "var(--r-md)", border: "2px solid var(--ink)" }} className="shimmer" />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
            {/* Inspiration Gallery — only renders if there's real media */}
            {filteredInspirations.length > 0 && (
              <section>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "var(--r-sm)",
                    border: "2px solid var(--ink)", boxShadow: "var(--shadow-sm)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                    background: "var(--card)",
                  }}>🎬</div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)" }}>INSPIRATION GALLERY</div>
                    <div style={{ fontSize: 13, color: "var(--ink-2)" }}>Click any reel to use that prompt</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
                  {filteredInspirations.map((v) => (
                    <InspirationCard key={v.id} video={v} onTry={tryInspiration} />
                  ))}
                </div>
              </section>
            )}

            {/* Regular templates grouped by category */}
            {(active === "all" ? Object.keys(CATEGORY_META) : [active]).map((cat) => {
              const catTpls = filteredRegular.filter((t) => t.category === cat);
              if (catTpls.length === 0) return null;
              const meta = CATEGORY_META[cat];
              if (!meta) return null;
              return (
                <section key={cat}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "var(--r-sm)",
                      border: "2px solid var(--ink)", boxShadow: "var(--shadow-sm)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                      background: "var(--card)",
                    }}>{meta.emoji}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)" }}>
                      {meta.label.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
                    {catTpls.map((tpl) => (
                      <button key={tpl.id} onClick={() => useTemplate(tpl)} style={{ textAlign: "left", cursor: "pointer", background: "none", border: "none", padding: 0 }}>
                        <TemplateCard tpl={tpl} />
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Character templates */}
            {filteredChars.length > 0 && (
              <section>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "var(--r-sm)",
                    border: "2px solid var(--ink)", boxShadow: "var(--shadow-sm)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                    background: "var(--card)",
                  }}>🎭</div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)" }}>CHARACTER TEMPLATES</div>
                    <div style={{ fontSize: 13, color: "var(--ink-2)" }}>Iconic Indian characters with unique voices</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
                  {filteredChars.map((tpl) => (
                    <button key={tpl.id} onClick={() => useCharacter(tpl)} style={{ textAlign: "left", cursor: "pointer", background: "none", border: "none", padding: 0 }}>
                      <CharacterCard tpl={tpl} />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {filteredRegular.length === 0 && filteredChars.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎭</div>
                <p>No templates in this category yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function TemplateCard({ tpl }: { tpl: Template }) {
  const sc = tpl.style_config || {};
  const gradient = sc.gradient || "linear-gradient(135deg,#374151,#6B7280)";
  const langLabel = tpl.language === "hi" ? "Hindi" : tpl.language === "hinglish" ? "Hinglish" : tpl.language || "";

  return (
    <div style={{
      borderRadius: "var(--r-md)", border: "2px solid var(--ink)",
      boxShadow: "var(--shadow-sm)", overflow: "hidden",
      background: "var(--card)", transition: "transform 0.08s ease, box-shadow 0.08s ease",
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translate(-2px,-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "6px 6px 0 var(--ink)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)"; }}
    >
      <div style={{ background: gradient, aspectRatio: "9/16", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <span style={{ fontSize: 40 }}>{CATEGORY_META[tpl.category || ""]?.emoji || "🎬"}</span>
        <div style={{
          position: "absolute", bottom: 8, right: 8,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          borderRadius: 999, padding: "2px 8px",
          fontSize: 10, fontWeight: 800, color: "#fff",
        }}>{langLabel}</div>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: "var(--ink)", marginBottom: 2 }}>{tpl.name}</div>
        <div style={{ fontSize: 11, color: "var(--ink-2)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {tpl.description || ""}
        </div>
      </div>
    </div>
  );
}

function CharacterCard({ tpl }: { tpl: Template }) {
  const sc = tpl.style_config || {};
  const gradient = sc.gradient || "linear-gradient(135deg,#7B2CBF,#C77DFF)";
  const tags: string[] = sc.tags || [];
  const meta = CATEGORY_META[tpl.category || ""];

  return (
    <div style={{
      borderRadius: "var(--r-md)", border: "2px solid var(--ink)",
      boxShadow: "var(--shadow-sm)", overflow: "hidden",
      background: "var(--card)", transition: "transform 0.08s ease, box-shadow 0.08s ease",
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translate(-2px,-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "6px 6px 0 var(--ink)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)"; }}
    >
      <div style={{ background: gradient, aspectRatio: "9/16", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, position: "relative" }}>
        <span style={{ fontSize: 48 }}>{sc.emoji || "🎭"}</span>
        <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
          {tags.map((tag) => (
            <span key={tag} style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 999 }}>
              #{tag}
            </span>
          ))}
        </div>
        <div style={{
          position: "absolute", top: 8, right: 8,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          borderRadius: 999, padding: "2px 8px",
          fontSize: 10, fontWeight: 800, color: "#fff",
        }}>
          {tpl.language === "hi" ? "Hindi" : tpl.language === "hinglish" ? "Hinglish" : tpl.language || ""}
        </div>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: "var(--ink)", marginBottom: 2 }}>{tpl.name}</div>
        <div style={{ fontSize: 11, color: "var(--ink-2)", marginBottom: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {tpl.description || ""}
        </div>
        {meta && (
          <div style={{ fontSize: 10, color: "var(--purple)", fontWeight: 700 }}>{meta.emoji} {meta.label}</div>
        )}
      </div>
    </div>
  );
}

const INSPO_GRAD: Record<string, string> = {
  funny: "linear-gradient(135deg,#FF6B35,#FFD700)",
  motivation: "linear-gradient(135deg,#1A1A2E,#E94560)",
  business: "linear-gradient(135deg,#0F3460,#533483)",
  devotional: "linear-gradient(135deg,#B7791F,#F6E05E)",
  news: "linear-gradient(135deg,#1A365D,#2B6CB0)",
  storytelling: "linear-gradient(135deg,#6D28D9,#8B5CF6)",
};
const INSPO_EMOJI: Record<string, string> = {
  funny: "😂", motivation: "🔥", business: "💼", devotional: "🙏", news: "📰", storytelling: "📖",
};

function InspirationCard({ video, onTry }: { video: InspirationVideo; onTry: (v: InspirationVideo) => void }) {
  const [hovered, setHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const grad = INSPO_GRAD[video.category] || "linear-gradient(135deg,#2D3748,#4A5568)";
  const emoji = INSPO_EMOJI[video.category] || "🎬";

  const handleMouseEnter = () => {
    setHovered(true);
    if (videoRef.current && video.video_url) {
      videoRef.current.play().catch(() => {});
    }
  };
  const handleMouseLeave = () => {
    setHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      style={{ borderRadius: "var(--r-md)", border: "2px solid var(--ink)", boxShadow: "var(--shadow-sm)", overflow: "hidden", background: "var(--card)", cursor: "pointer", transition: "transform 0.08s ease, box-shadow 0.08s ease" }}
      onMouseEnter={(e) => { handleMouseEnter(); (e.currentTarget as HTMLDivElement).style.transform = "translate(-2px,-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "6px 6px 0 var(--ink)"; }}
      onMouseLeave={(e) => { handleMouseLeave(); (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)"; }}
      onClick={() => onTry(video)}
    >
      <div style={{ aspectRatio: "9/16", position: "relative", background: grad, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {video.thumbnail_url && !hovered && (
          <img src={video.thumbnail_url} alt={video.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {video.video_url && (
          <video
            ref={videoRef}
            src={video.video_url}
            muted
            loop
            playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: hovered ? "block" : "none" }}
          />
        )}
        {!video.thumbnail_url && (
          <span style={{ fontSize: 44, position: "relative", zIndex: 1 }}>{emoji}</span>
        )}
        <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", borderRadius: 999, padding: "2px 8px", fontSize: 9, fontWeight: 800, color: "#fff" }}>
          {video.language === "hi" ? "Hindi" : video.language === "hinglish" ? "Hinglish" : video.language}
        </div>
        {hovered && (
          <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, background: "var(--orange)", borderRadius: 6, padding: "6px 8px", textAlign: "center", fontWeight: 800, fontSize: 11, color: "#fff", fontFamily: "var(--font-body)" }}>
            ✨ Use this prompt
          </div>
        )}
      </div>
      <div style={{ padding: "8px 10px" }}>
        <div style={{ fontWeight: 800, fontSize: 12, color: "var(--ink)", marginBottom: 3 }}>{video.title}</div>
        <div style={{ fontSize: 10, color: "var(--ink-2)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4 }}>{video.prompt}</div>
      </div>
    </div>
  );
}
