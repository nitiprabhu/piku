"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api, { getStoredUser } from "@/lib/api";
import AppShell from "@/components/AppShell";

interface Project {
  id: string;
  title: string;
  status: string;
  thumbnail_url: string | null;
  viral_score: number | null;
  created_at: string;
  video_url: string | null;
}

const GRAD_CLASSES = [
  "reel-grad-1","reel-grad-2","reel-grad-3","reel-grad-4",
  "reel-grad-5","reel-grad-6","reel-grad-7",
];

function viralColor(score: number | null) {
  if (!score) return "var(--muted)";
  if (score >= 80) return "var(--green)";
  if (score >= 60) return "var(--orange)";
  return "var(--pink)";
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats]       = useState({ total: 0 });
  const [loading, setLoading]   = useState(true);
  const [userName, setUserName] = useState("CREATOR");
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [firstVideoPurchased, setFirstVideoPurchased] = useState(false);

  // Branding state
  const [igHandle, setIgHandle]         = useState("");
  const [ytHandle, setYtHandle]         = useState("");
  const [showOverlay, setShowOverlay]   = useState(true);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingSaved, setBrandingSaved]   = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.push("/login"); return; }
    setTimeout(() => {
      if (user.name) setUserName(user.name.toUpperCase());
      if (user.instagram_handle) setIgHandle(user.instagram_handle);
      if (user.youtube_handle) setYtHandle(user.youtube_handle);
      if (user.show_social_overlay !== undefined) setShowOverlay(user.show_social_overlay);
      if (user.credits !== undefined) setUserCredits(user.credits);
      if (user.plan) setUserPlan(user.plan);
      if (user.first_video_purchased !== undefined) setFirstVideoPurchased(user.first_video_purchased);
    }, 0);
    api.get("/projects?limit=20")
      .then((r) => { setProjects(r.data.items); setStats({ total: r.data.total ?? r.data.items.length }); })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const saveBranding = async () => {
    setBrandingSaving(true);
    try {
      const { data } = await api.patch("/user/me", {
        instagram_handle: igHandle || null,
        youtube_handle: ytHandle || null,
        show_social_overlay: showOverlay,
      });
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        u.instagram_handle = data.instagram_handle;
        u.youtube_handle = data.youtube_handle;
        u.show_social_overlay = data.show_social_overlay;
        localStorage.setItem("user", JSON.stringify(u));
      }
      setBrandingSaved(true);
      setTimeout(() => setBrandingSaved(false), 2000);
    } catch {}
    setBrandingSaving(false);
  };

  return (
    <AppShell>
      <div style={{ padding: "32px 28px", maxWidth: 1100 }}>
        {/* Page heading */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,40px)", color: "var(--ink)", marginBottom: 4 }}>
            HEY {userName} 👋
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 15 }}>Your reels dashboard</p>
        </div>

        {/* Upgrade nudge — free plan with low/zero credits */}
        {userPlan === "free" && userCredits !== null && userCredits <= 1 && (
          <div style={{
            background: userCredits === 0 ? "#fef2f2" : "#fffbeb",
            border: `2px solid ${userCredits === 0 ? "#ef4444" : "var(--orange)"}`,
            borderRadius: "var(--r-md)", padding: "16px 20px", marginBottom: 24,
            display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)", marginBottom: 2 }}>
                {userCredits === 0 ? "Videos khatam ho gaye 😅" : "Sirf 1 video bacha hai"}
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}>
                {!firstVideoPurchased
                  ? "₹29 mein 1 clean reel — no watermark, post today"
                  : "Starter Pack ₹99 — 10 clean videos, no expiry"}
              </div>
            </div>
            <Link href="/pricing" style={{
              background: userCredits === 0 ? "#ef4444" : "var(--orange)",
              color: "#fff", fontFamily: "var(--font-body)", fontWeight: 800,
              fontSize: 14, padding: "10px 20px", borderRadius: "var(--r-sm)",
              border: "2px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)",
              textDecoration: "none", whiteSpace: "nowrap",
            }}>
              {!firstVideoPurchased ? "Post for ₹29 →" : "Buy 10 videos →"}
            </Link>
          </div>
        )}

        {/* Marketplace banner */}
        <div style={{
          background: "var(--orange)", border: "2px solid var(--ink)",
          borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-md)",
          padding: "24px 28px", marginBottom: 28,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "#fff", marginBottom: 4 }}>
              Brand deals chahiye? 💼
            </div>
            <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 600, maxWidth: 480 }}>
              Set up your creator profile. Brands matching your niche send briefs directly.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/marketplace" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#fff", color: "var(--ink)",
              fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 14,
              border: "2px solid var(--ink)", borderRadius: 12,
              boxShadow: "3px 3px 0 var(--ink)", padding: "10px 18px",
              textDecoration: "none",
            }}>
              Set up creator profile →
            </Link>
            <Link href="/marketplace/search" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "transparent", color: "#fff",
              fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14,
              border: "2px solid rgba(255,255,255,0.6)", borderRadius: 12,
              padding: "10px 18px", textDecoration: "none",
            }}>
              Peek at marketplace
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Reels",   value: stats.total, emoji: "🎬" },
            { label: "This Week",     value: projects.filter(p => {
                const d = new Date(p.created_at);
                const w = new Date(); w.setDate(w.getDate()-7);
                return d > w;
              }).length, emoji: "📅" },
            { label: "Completed",     value: projects.filter(p => p.status === "completed").length, emoji: "✅" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "var(--card)", border: "2px solid var(--ink)",
              borderRadius: "var(--r-md)", boxShadow: "var(--shadow-sm)",
              padding: "20px 20px 16px",
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.emoji}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 36, color: "var(--ink)", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-2)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Video Branding card */}
        <div style={{
          background: "var(--card)", border: "2px solid var(--ink)",
          borderRadius: "var(--r-md)", boxShadow: "var(--shadow-sm)",
          padding: "20px 24px", marginBottom: 28,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 15, color: "var(--ink)" }}>📺 VIDEO BRANDING</div>
              <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>Show your social handles on generated videos</div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <span style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>{showOverlay ? "ON" : "OFF"}</span>
              <div
                onClick={() => setShowOverlay(!showOverlay)}
                style={{
                  width: 40, height: 22, borderRadius: 11, border: "2px solid var(--ink)",
                  background: showOverlay ? "var(--orange)" : "var(--bg)",
                  position: "relative", cursor: "pointer", transition: "background 0.15s",
                }}
              >
                <div style={{
                  width: 14, height: 14, borderRadius: "50%", background: "var(--ink)",
                  position: "absolute", top: 2,
                  left: showOverlay ? 20 : 2, transition: "left 0.15s",
                }} />
              </div>
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-2)", marginBottom: 4, textTransform: "uppercase" }}>📷 Instagram</div>
              <input
                value={igHandle}
                onChange={(e) => setIgHandle(e.target.value.replace(/^@/, ""))}
                placeholder="yourhandle"
                style={{
                  width: "100%", padding: "8px 12px", border: "2px solid var(--ink)",
                  borderRadius: 10, fontFamily: "var(--font-body)", fontSize: 14,
                  background: "var(--bg)", color: "var(--ink)", boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-2)", marginBottom: 4, textTransform: "uppercase" }}>▶ YouTube</div>
              <input
                value={ytHandle}
                onChange={(e) => setYtHandle(e.target.value.replace(/^@/, ""))}
                placeholder="yourchannel"
                style={{
                  width: "100%", padding: "8px 12px", border: "2px solid var(--ink)",
                  borderRadius: 10, fontFamily: "var(--font-body)", fontSize: 14,
                  background: "var(--bg)", color: "var(--ink)", boxSizing: "border-box",
                }}
              />
            </div>
            <button
              onClick={saveBranding}
              disabled={brandingSaving}
              style={{
                padding: "8px 18px", border: "2px solid var(--ink)", borderRadius: 10,
                background: brandingSaved ? "#22c55e" : "var(--orange)", color: "#fff",
                fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
                boxShadow: "3px 3px 0 var(--ink)",
              }}
            >
              {brandingSaved ? "✓ Saved" : brandingSaving ? "…" : "Save"}
            </button>
          </div>
        </div>

        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink)" }}>YOUR REELS</div>
          <Link href="/create" className="btn-hard" style={{ fontSize: 14, padding: "8px 18px" }}>
            + New Reel
          </Link>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ aspectRatio: "9/16", borderRadius: "var(--r-md)", border: "2px solid var(--ink)" }} className="shimmer" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎬</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--ink)", marginBottom: 8 }}>NO REELS YET</h2>
            <p style={{ color: "var(--ink-2)", marginBottom: 24, fontSize: 15 }}>Create your first viral reel in under 60 seconds</p>
            <Link href="/create" className="btn-hard" style={{ fontSize: 16, padding: "14px 28px" }}>🚀 Create Your First Reel</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
            {projects.map((project, idx) => (
              <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  aspectRatio: "9/16", borderRadius: "var(--r-md)",
                  border: "2px solid var(--ink)", boxShadow: "var(--shadow-sm)",
                  overflow: "hidden", position: "relative", cursor: "pointer",
                  transition: "transform 0.08s ease, box-shadow 0.08s ease",
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translate(-2px,-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "6px 6px 0 var(--ink)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)"; }}
                >
                  {project.thumbnail_url ? (
                    <img src={project.thumbnail_url} alt={project.title || "Reel"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : project.video_url && project.status === "completed" ? (
                    <video
                      src={project.video_url}
                      muted
                      playsInline
                      preload="metadata"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                      onMouseLeave={(e) => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                    />
                  ) : (
                    <div className={GRAD_CLASSES[idx % 7]} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
                      {project.status === "processing" ? (
                        <>
                          <div className="spin" style={{ width: 32, height: 32, border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
                          <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>Generating…</span>
                        </>
                      ) : project.status === "failed" ? (
                        <span style={{ fontSize: 36 }}>❌</span>
                      ) : (
                        <span style={{ fontSize: 36 }}>🎬</span>
                      )}
                    </div>
                  )}

                  {/* Viral score */}
                  {project.viral_score !== null && (
                    <div style={{
                      position: "absolute", top: 8, right: 8,
                      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
                      borderRadius: 999, padding: "3px 8px",
                      fontSize: 11, fontWeight: 800, color: viralColor(project.viral_score),
                    }}>
                      🔥 {project.viral_score}
                    </div>
                  )}

                  {/* Status */}
                  {project.status !== "completed" && (
                    <div style={{
                      position: "absolute", top: 8, left: 8,
                      background: project.status === "processing" ? "var(--orange)" : "var(--pink)",
                      border: "1px solid var(--ink)", borderRadius: 999,
                      padding: "2px 8px", fontSize: 10, fontWeight: 800, color: "#fff",
                    }}>
                      {project.status}
                    </div>
                  )}

                  {/* Bottom caption overlay */}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                    padding: "24px 10px 10px",
                  }}>
                    <p style={{ color: "#fff", fontSize: 11, fontWeight: 600, lineHeight: 1.3, margin: 0,
                      overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {project.title || "Untitled Reel"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            {/* New reel card */}
            <Link href="/create" style={{ textDecoration: "none" }}>
              <div style={{
                aspectRatio: "9/16", borderRadius: "var(--r-md)",
                border: "2px dashed var(--ink)", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 10, color: "var(--ink-2)", transition: "all 0.08s ease",
                background: "var(--bg-2)",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--orange-lt)"; (e.currentTarget as HTMLDivElement).style.borderColor = "var(--orange)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--bg-2)"; (e.currentTarget as HTMLDivElement).style.borderColor = "var(--ink)"; }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "var(--card)", border: "2px solid var(--ink)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, boxShadow: "var(--shadow-sm)",
                }}>+</div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>New Reel</span>
              </div>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
