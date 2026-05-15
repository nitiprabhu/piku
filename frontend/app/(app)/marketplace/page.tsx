"use client";
import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { MP_BRIEFS } from "@/lib/marketplace-data";

const HOW_IT_WORKS = [
  { step: "01", emoji: "🙋", title: "Set up profile", desc: "Add your niches, rate, and verify your socials in 5 minutes." },
  { step: "02", emoji: "📨", title: "Receive briefs", desc: "Brands matching your niche send collaboration briefs directly." },
  { step: "03", emoji: "🤝", title: "Accept & create", desc: "Accept the deal — 50% escrow locked before you start." },
  { step: "04", emoji: "💸", title: "Get paid", desc: "Deliver reels, brand approves, and the remaining 50% releases instantly." },
];

const STAT_CHIPS = [
  { label: "< 24h avg brief response", emoji: "⚡" },
  { label: "100% escrow protected", emoji: "🔒" },
  { label: "Early access", emoji: "🚀" },
  { label: "Free setup", emoji: "✅" },
];

export default function MarketplacePage() {
  const [mode, setMode] = useState<"creator" | "brand">("creator");

  return (
    <AppShell>
      <div style={{ padding: "32px 28px", maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{
              background: "var(--pink)", color: "#fff",
              fontSize: 11, fontWeight: 800, border: "2px solid var(--ink)",
              borderRadius: 999, padding: "3px 10px", letterSpacing: "0.05em",
            }}>
              Early access · onboarding first creators 🚀
            </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,42px)", color: "var(--ink)", marginBottom: 6 }}>
            INFLUENCER MARKETPLACE 💼
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 15, fontWeight: 600 }}>
            Brand deals without the DM hustle. Escrow-protected collab payments.
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: "inline-flex", border: "2px solid var(--ink)", borderRadius: 14,
          boxShadow: "3px 3px 0 var(--ink)", overflow: "hidden", marginBottom: 32,
        }}>
          {(["creator", "brand"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "10px 28px",
              fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 15,
              background: mode === m ? "var(--orange)" : "var(--card)",
              color: mode === m ? "#fff" : "var(--ink)",
              border: "none", cursor: "pointer",
              borderRight: m === "creator" ? "2px solid var(--ink)" : "none",
              transition: "all 0.1s ease",
            }}>
              {m === "creator" ? "🎥 I'm a Creator" : "🏢 I'm a Brand"}
            </button>
          ))}
        </div>

        {/* Creator mode hero */}
        {mode === "creator" && (
          <div style={{ marginBottom: 36 }}>
            <div style={{
              background: "var(--card)", border: "2px solid var(--ink)",
              borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-md)",
              padding: "32px", marginBottom: 20,
            }}>
              <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--ink)", marginBottom: 8 }}>
                    BRAND DEALS,<br />WITHOUT THE DM HUSTLE
                  </h2>
                  <p style={{ color: "var(--ink-2)", fontSize: 15, marginBottom: 20, lineHeight: 1.6 }}>
                    Set up your creator profile once. Brands whose products match your niche
                    find you and send briefs directly. 86% take-home, escrow protection on every deal.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
                    {STAT_CHIPS.map((c) => (
                      <span key={c.label} style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        background: "var(--bg-2)", border: "2px solid var(--ink)",
                        borderRadius: 999, padding: "6px 12px",
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {c.emoji} {c.label}
                      </span>
                    ))}
                  </div>
                  <Link href="/marketplace/profile/setup" className="btn-hard" style={{ fontSize: 15 }}>
                    Set up creator profile →
                  </Link>
                </div>

                {/* Stacked brief cards preview */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 260, flex: 1 }}>
                  {MP_BRIEFS.slice(0, 3).map((b, i) => (
                    <div key={b.id} style={{
                      background: "var(--bg-2)", border: "2px solid var(--ink)",
                      borderRadius: "var(--r-md)", padding: "14px 16px",
                      display: "flex", alignItems: "center", gap: 12,
                      boxShadow: "3px 3px 0 var(--ink)",
                      transform: `rotate(${[-1, 1, -0.5][i]}deg)`,
                    }}>
                      <span style={{
                        width: 40, height: 40, borderRadius: 10, background: b.color,
                        border: "2px solid var(--ink)", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 20, flexShrink: 0,
                      }}>{b.logo}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.title}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-2)" }}>{b.brand} · ₹{b.budget.toLocaleString("en-IN")}/reel</div>
                      </div>
                      <span style={{
                        background: "var(--green)", color: "#fff",
                        fontSize: 11, fontWeight: 800, borderRadius: 999,
                        border: "1.5px solid var(--ink)", padding: "2px 8px",
                      }}>{b.match}% match</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Brand mode hero */}
        {mode === "brand" && (
          <div style={{ marginBottom: 36 }}>
            <div style={{
              background: "var(--ink)", border: "2px solid var(--ink)",
              borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-md)",
              padding: "36px", marginBottom: 20,
            }}>
              <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "#fff", marginBottom: 10 }}>
                    FIND CREATORS<br />BY NICHE
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, marginBottom: 20, lineHeight: 1.6 }}>
                    Browse verified Indian creators by niche, language, followers, and rate.
                    Post a brief — matched creators apply within 24 hours.
                  </p>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
                    {[
                      { label: "Launching soon", val: "Brands" },
                      { label: "Early access", val: "Marketplace" },
                      { label: "Escrow protected", val: "Every deal" },
                    ].map((s) => (
                      <div key={s.val} style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--saffron)" }}>{s.val}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href="/marketplace/search" style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: "var(--orange)", color: "#fff",
                      fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 15,
                      border: "2px solid rgba(255,255,255,0.3)", borderRadius: 12,
                      boxShadow: "3px 3px 0 rgba(255,255,255,0.15)", padding: "12px 20px",
                      textDecoration: "none",
                    }}>
                      Browse creators →
                    </Link>
                    <Link href="/marketplace/brief/new" style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: "transparent", color: "#fff",
                      fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15,
                      border: "2px solid rgba(255,255,255,0.4)", borderRadius: 12,
                      padding: "12px 20px", textDecoration: "none",
                    }}>
                      Post a brief
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--orange-dark)", marginBottom: 16 }}>
            How it works
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {HOW_IT_WORKS.map((s) => (
              <div key={s.step} style={{
                background: "var(--card)", border: "2px solid var(--ink)",
                borderRadius: "var(--r-md)", padding: "20px",
                boxShadow: "3px 3px 0 var(--ink)",
              }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--orange)", marginBottom: 8 }}>{s.step}</div>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.emoji}</div>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
