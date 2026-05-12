"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api, { getStoredUser } from "@/lib/api";
import AppShell from "@/components/AppShell";

const CATEGORY_META: Record<string, { emoji: string; label: string; gradClass: string }> = {
  funny:       { emoji: "😂", label: "Funny & Comedy",        gradClass: "reel-grad-6" },
  devotional:  { emoji: "🙏", label: "Devotional & Spiritual", gradClass: "reel-grad-3" },
  motivation:  { emoji: "🔥", label: "Motivation & Hustle",    gradClass: "reel-grad-1" },
  business:    { emoji: "💼", label: "Business & Startup",     gradClass: "reel-grad-5" },
  news:        { emoji: "📰", label: "News & Affairs",         gradClass: "reel-grad-7" },
};

const CHARACTER_TEMPLATES = [
  { id: "raju_bhaiya",     emoji: "🤣", name: "Raju Bhaiya",   category: "funny",      lang: "Hindi",    desc: "Desi uncle comedy in pure Hindi.", example: "Aaj market mein bhaav itne badh gaye ki pocket rone lagi...", tags: ["comedy","desi","hindi"] },
  { id: "priya_di",        emoji: "💪", name: "Priya Didi",    category: "motivation", lang: "Hinglish", desc: "Big sister energy — real talk for youth.", example: "Bhai, 5 AM uthna mushkil hai but success aur bhi mushkil hai...", tags: ["motivation","youth"] },
  { id: "professor_sharma",emoji: "🎓", name: "Prof. Sharma",  category: "business",   lang: "Hindi",    desc: "Patient teacher explaining concepts simply.", example: "Aaj hum samjhenge ki compound interest kaise kaam karta hai...", tags: ["education","tips"] },
  { id: "rohit_anchor",    emoji: "📺", name: "Rohit Anchor",  category: "news",       lang: "Hindi",    desc: "Breaking news anchor — dramatic and punchy.", example: "Badi khabar! Aaj ki taaza khabar yeh hai ki...", tags: ["news","breaking"] },
  { id: "dev_startup",     emoji: "🚀", name: "Dev Bhai",      category: "business",   lang: "Hinglish", desc: "Startup founder sharing hustle tips.", example: "Yaar, ek crore ka idea hai mere paas. Sun meri baat...", tags: ["startup","founder"] },
  { id: "pandit_gyani",    emoji: "🙏", name: "Pandit Ji",     category: "devotional", lang: "Hindi",    desc: "Spiritual guru sharing timeless wisdom.", example: "Ye jo dukh hai, ye sab maya hai. Bhagwan ka naam lo...", tags: ["spiritual","vedic"] },
];

const CATEGORIES = ["all", ...Object.keys(CATEGORY_META)];

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
  const [templates, setTemplates] = useState<any[]>([]);
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

  const useTemplate = (tpl: any) => {
    const examples = tpl.prompt_examples || [];
    const prompt = examples.length > 0 ? examples[Math.floor(Math.random() * examples.length)] : "";
    router.push(`/create?${new URLSearchParams({ template_id: tpl.id, style: tpl.category || "motivation", language: tpl.language || "hi", prompt })}`);
  };

  const tryInspiration = (v: InspirationVideo) => {
    router.push(`/create?${new URLSearchParams({
      prompt: v.prompt,
      style: v.category,
      language: v.language,
    })}`);
  };

  const filteredInspirations = active === "all" ? inspirations : inspirations.filter((v) => v.category === active);

  const useCharacter = (char: typeof CHARACTER_TEMPLATES[0]) => {
    router.push(`/create?${new URLSearchParams({
      character: char.id,
      style: char.category,
      language: char.lang === "Hinglish" ? "hinglish" : char.lang === "Hindi" ? "hi" : "en",
      prompt: char.example,
    })}`);
  };

  const filteredTemplates = active === "all" ? templates : templates.filter((t) => t.category === active);
  const filteredChars = active === "all" ? CHARACTER_TEMPLATES : CHARACTER_TEMPLATES.filter((c) => c.category === active);

  return (
    <AppShell>
      <div style={{ padding: "32px 28px", maxWidth: 1100 }}>
        {/* Heading */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,40px)", color: "var(--ink)", marginBottom: 4 }}>
            TEMPLATE GALLERY
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 15 }}>Pick a template, customize your idea, generate in seconds</p>
        </div>

        {/* Category tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_META[cat];
            const isActive = active === cat;
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
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
          <>
          {/* Inspiration Gallery */}
          {filteredInspirations.length > 0 && (
            <section style={{ marginBottom: 48 }}>
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
          </>
        )}
        {!loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            {/* API templates by category */}
            {(active === "all" ? Object.keys(CATEGORY_META) : [active]).map((cat) => {
              const catTpls = filteredTemplates.filter((t) => t.category === cat);
              if (catTpls.length === 0) return null;
              const meta = CATEGORY_META[cat];
              return (
                <section key={cat}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "var(--r-sm)",
                      border: "2px solid var(--ink)", boxShadow: "var(--shadow-sm)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                      background: "var(--card)",
                    }}>{meta.emoji}</div>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)" }}>{meta.label.toUpperCase()}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
                    {catTpls.map((tpl) => (
                      <button key={tpl.id} onClick={() => useTemplate(tpl)} style={{ textAlign: "left", cursor: "pointer", background: "none", border: "none", padding: 0 }}>
                        <TemplateCard emoji={meta.emoji} gradClass={meta.gradClass} title={tpl.name} desc={tpl.description} badge={tpl.language === "hi" ? "Hindi" : tpl.language === "hinglish" ? "Hinglish" : tpl.language} />
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
                  {filteredChars.map((char) => (
                    <button key={char.id} onClick={() => useCharacter(char)} style={{ textAlign: "left", cursor: "pointer", background: "none", border: "none", padding: 0 }}>
                      <CharacterCard char={char} />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {filteredTemplates.length === 0 && filteredChars.length === 0 && (
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

const INSPO_GRAD: Record<string, string> = {
  funny: "linear-gradient(135deg,#FF6B35,#FFD700)",
  motivation: "linear-gradient(135deg,#1A1A2E,#E94560)",
  business: "linear-gradient(135deg,#0F3460,#533483)",
  devotional: "linear-gradient(135deg,#B7791F,#F6E05E)",
  news: "linear-gradient(135deg,#1A365D,#2B6CB0)",
};
const INSPO_EMOJI: Record<string, string> = {
  funny: "😂", motivation: "🔥", business: "💼", devotional: "🙏", news: "📰",
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
        {!video.thumbnail_url && !video.video_url && (
          <span style={{ fontSize: 44, position: "relative", zIndex: 1 }}>{emoji}</span>
        )}
        {/* play icon overlay when no video */}
        {!video.video_url && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.15)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14, marginLeft: 3 }}>▶</span>
            </div>
          </div>
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

function TemplateCard({ emoji, gradClass, title, desc, badge }: { emoji: string; gradClass: string; title: string; desc: string; badge: string }) {
  return (
    <div style={{
      borderRadius: "var(--r-md)", border: "2px solid var(--ink)",
      boxShadow: "var(--shadow-sm)", overflow: "hidden",
      background: "var(--card)", transition: "transform 0.08s ease, box-shadow 0.08s ease",
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translate(-2px,-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "6px 6px 0 var(--ink)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)"; }}
    >
      <div className={gradClass} style={{ aspectRatio: "9/16", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, position: "relative" }}>
        <span style={{ fontSize: 40 }}>{emoji}</span>
        <div style={{
          position: "absolute", bottom: 8, right: 8,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          borderRadius: 999, padding: "2px 8px",
          fontSize: 10, fontWeight: 800, color: "#fff",
        }}>{badge}</div>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: "var(--ink)", marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--ink-2)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{desc}</div>
      </div>
    </div>
  );
}

function CharacterCard({ char }: { char: typeof CHARACTER_TEMPLATES[0] }) {
  const meta = CATEGORY_META[char.category];
  return (
    <div style={{
      borderRadius: "var(--r-md)", border: "2px solid var(--ink)",
      boxShadow: "var(--shadow-sm)", overflow: "hidden",
      background: "var(--card)", transition: "transform 0.08s ease, box-shadow 0.08s ease",
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translate(-2px,-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "6px 6px 0 var(--ink)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)"; }}
    >
      <div style={{ background: "linear-gradient(135deg,#7B2CBF,#C77DFF)", aspectRatio: "9/16", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, position: "relative" }}>
        <span style={{ fontSize: 48 }}>{char.emoji}</span>
        <div style={{
          position: "absolute", bottom: 8, left: 8, right: 8,
          display: "flex", gap: 4, flexWrap: "wrap",
        }}>
          {char.tags.map((tag) => (
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
        }}>{char.lang}</div>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: "var(--ink)", marginBottom: 2 }}>{char.name}</div>
        <div style={{ fontSize: 11, color: "var(--ink-2)", marginBottom: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{char.desc}</div>
        {meta && (
          <div style={{ fontSize: 10, color: "var(--purple)", fontWeight: 700 }}>{meta.emoji} {meta.label}</div>
        )}
      </div>
    </div>
  );
}
