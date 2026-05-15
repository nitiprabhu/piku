import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ReelCraft — Viral Reels in 60 Seconds | AI Video Creator for India",
  description: "Create viral Instagram Reels and YouTube Shorts in Hindi, English, or Hinglish. AI writes the script, voices it, and edits the video. Free to start.",
};

const FEATURES = [
  { emoji: "🤖", title: "GPT-4o Script", desc: "AI writes a viral hook + narration tailored to your niche and audience." },
  { emoji: "🎙️", title: "Hindi AI Voice", desc: "MiniMax TTS in Hindi, Hinglish, or English. Sounds natural, not robotic." },
  { emoji: "🎬", title: "Cinematic Clips", desc: "WAN2.1 / VEO3 generates video clips that match each scene of your script." },
  { emoji: "🎵", title: "Background Music", desc: "Suno AI generates custom background music that fits the mood." },
  { emoji: "📝", title: "Auto Captions", desc: "Burned-in SRT subtitles so viewers can follow along even without sound." },
  { emoji: "📤", title: "1-Click Publish", desc: "Post directly to Instagram Reels or YouTube Shorts from the dashboard." },
];

const STEPS = [
  { n: "01", emoji: "✍️", title: "Type a Prompt", desc: "Describe what you want — \"5 tips for saving money\" or \"funny desi mom jokes\"." },
  { n: "02", emoji: "⚡", title: "AI Does Everything", desc: "Script → voiceover → video clips → music → captions. All in ~45 seconds." },
  { n: "03", emoji: "🚀", title: "Download & Share", desc: "Get a 9:16 MP4 ready for Instagram Reels, YouTube Shorts, or WhatsApp Status." },
];

const PLANS = [
  { name: "FREE", price: "₹0", period: "forever", credits: 5, features: ["5 reels / month", "WAN2.1 video model", "Hindi + English voices", "HD download"], highlight: false },
  { name: "PRO", price: "₹999", period: "/ month", credits: 60, features: ["60 reels / month", "VEO3 premium model", "All languages + Hinglish", "1-click Instagram & YouTube publish", "Priority generation"], highlight: true },
  { name: "CREATOR", price: "₹2499", period: "/ month", credits: 200, features: ["200 reels / month", "VEO3 + HiDream models", "White-label watermark", "Team access (3 seats)", "API access"], highlight: false },
];

const FAQS = [
  { q: "How long does generation take?", a: "Usually 40–60 seconds. Pro plan with VEO3 may take up to 90 seconds for the highest quality clips." },
  { q: "What languages are supported?", a: "Hindi, English, and Hinglish (mixed). The AI adapts slang, expressions, and pacing per language." },
  { q: "Can I edit the script before generating?", a: "Yes — the create page shows the AI's script draft. You can tweak it before generating audio and video." },
  { q: "Is the video ready for Instagram/YouTube?", a: "Yes. Output is a 9:16 MP4 at 1080×1920 with burned-in captions, voiceover, and music mixed in." },
  { q: "What happens if generation fails?", a: "Your credit is refunded automatically. Failures are rare (<2%) but covered." },
];


export default function LandingPage() {

  return (
    <div style={{ background: "var(--bg)", fontFamily: "var(--font-body)", minHeight: "100vh" }}>

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(253,244,227,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "2px solid var(--ink)",
        height: 68, display: "flex", alignItems: "center",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 40, height: 40, fontSize: 20,
              background: "var(--orange)", borderRadius: 10,
              border: "2px solid var(--ink)", boxShadow: "2px 2px 0 var(--ink)",
              transform: "rotate(-4deg)",
            }}>🎬</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--ink)" }}>ReelCraft</span>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link href="/marketplace/search" style={{ color: "var(--ink-2)", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
              💼 Marketplace
              <span style={{ background: "var(--pink)", color: "#fff", fontSize: 9, fontWeight: 900, borderRadius: 999, border: "1.5px solid var(--ink)", padding: "1px 5px" }}>NEW</span>
            </Link>
            <Link href="/marketplace/search" style={{ color: "var(--ink-2)", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>For Brands</Link>
            <Link href="#pricing" style={{ color: "var(--ink-2)", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Pricing</Link>
            <Link href="/login" style={{ color: "var(--ink-2)", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>Log in</Link>
            <Link href="/login" className="btn-hard" style={{ fontSize: 13, padding: "8px 18px" }}>Try Free →</Link>
          </nav>
        </div>
      </header>

      {/* Dark announcement strip */}
      <div style={{
        background: "var(--ink)", color: "#fff",
        padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        flexWrap: "wrap",
      }}>
        <span style={{
          background: "var(--orange)", color: "#fff",
          fontSize: 10, fontWeight: 900, borderRadius: 999,
          border: "1.5px solid rgba(255,255,255,0.3)", padding: "2px 8px",
          letterSpacing: "0.05em",
        }}>NEW</span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>ReelCraft Marketplace is live — get paid to create reels for brands →</span>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/marketplace" style={{
            background: "var(--orange)", color: "#fff",
            border: "2px solid rgba(255,255,255,0.3)", borderRadius: 8,
            padding: "6px 14px", fontSize: 12, fontWeight: 800,
            textDecoration: "none",
          }}>I'm a Creator</Link>
          <Link href="/marketplace/search" style={{
            background: "transparent", color: "#fff",
            border: "2px solid rgba(255,255,255,0.4)", borderRadius: 8,
            padding: "6px 14px", fontSize: 12, fontWeight: 800,
            textDecoration: "none",
          }}>Find Creators</Link>
        </div>
      </div>

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px 60px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 48, alignItems: "center" }}>
        <div>
          {/* Badge */}
          <div className="sticker" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--saffron)", color: "var(--ink)", padding: "6px 16px", fontSize: 13, fontWeight: 800, marginBottom: 28 }}>
            🚀 Early access · onboarding first creators
          </div>

          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(48px,7.6vw,96px)",
            color: "var(--ink)", lineHeight: 0.95,
            marginBottom: 24,
          }}>
            CREATE VIRAL<br />REELS IN<br />60 SECONDS
          </h1>

          <p style={{ fontSize: 18, color: "var(--ink-2)", marginBottom: 36, maxWidth: 480, lineHeight: 1.6 }}>
            AI writes the script, voices it in Hindi or English, adds cinematic video + music. You just share.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/login" className="btn-hard" style={{ fontSize: 16, padding: "14px 28px" }}>
              🚀 Start Free — No CC
            </Link>
            <Link href="/marketplace" style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "14px 28px", fontSize: 16, fontWeight: 700,
              border: "2px solid var(--ink)", borderRadius: "var(--r-sm)",
              color: "var(--ink)", textDecoration: "none",
              background: "transparent", boxShadow: "3px 3px 0 var(--ink)",
            }}>
              💼 I&apos;m a brand →
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 32 }}>
            <div style={{ display: "flex" }}>
              {["🧑‍💻","👩","🧑"].map((e, i) => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: "50%",
                  border: "2px solid var(--ink)", background: "var(--orange-lt)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, marginLeft: i > 0 ? -10 : 0,
                }}>{e}</div>
              ))}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}>
              Be among the first creators on ReelCraft
            </div>
          </div>
        </div>

        {/* Phone mockup */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className="phone-frame" style={{ width: 260 }}>
            <div className="reel-grad-1" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, borderRadius: "calc(var(--r-lg) - 2px)" }}>
              <div style={{ fontSize: 56 }}>🎬</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "#fff", textAlign: "center", padding: "0 20px" }}>
                YOUR NEXT VIRAL REEL
              </div>
              <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 999, padding: "4px 14px", fontSize: 12, color: "#fff", fontWeight: 800 }}>
                ⚡ AI-GENERATED IN 45s
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace section */}
      <section style={{ background: "var(--bg-2)", borderTop: "2px solid var(--ink)", borderBottom: "2px solid var(--ink)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="sticker" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--pink)", color: "#fff", padding: "6px 16px", fontSize: 13, fontWeight: 900, marginBottom: 16 }}>
              💼 MARKETPLACE
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,4vw,52px)", color: "var(--ink)", marginBottom: 8 }}>
              CREATORS MEET BRANDS
            </h2>
            <p style={{ color: "var(--ink-2)", fontSize: 16, maxWidth: 560, margin: "0 auto" }}>
              Get paid to create reels for top Indian brands. Or find the perfect creator for your campaign — with AI matching, escrow payments, and zero hassle.
            </p>
          </div>

          {/* Two-sided cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
            {/* Creator card */}
            <div className="card" style={{ padding: 28, background: "var(--orange-lt)", border: "2px solid var(--ink)", boxShadow: "4px 4px 0 var(--ink)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🧑‍🎨</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--ink)", marginBottom: 8 }}>FOR CREATORS</div>
              <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                Brands post briefs. You accept deals you like. Get paid through secure escrow. Keep 86% of every deal.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {["86% take-home on every deal", "Escrow-secured payments", "AI-match with best-fit brands", "Build your creator profile"].map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--green)", border: "2px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/marketplace" className="btn-hard" style={{ display: "block", textAlign: "center", fontSize: 14, padding: "12px 20px" }}>
                Join as Creator →
              </Link>
            </div>

            {/* Brand card */}
            <div className="card" style={{ padding: 28, background: "#EEF2FF", border: "2px solid var(--ink)", boxShadow: "4px 4px 0 var(--ink)" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏢</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--ink)", marginBottom: 8 }}>FOR BRANDS</div>
              <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                Search verified creators by niche, language, and budget. Post a brief, review pitches, release payment only when satisfied.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {["AI-matched creators for your brief", "Niche × language × budget filters", "50% upfront, 50% on delivery", "Review before releasing payment"].map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--orange)", border: "2px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", flexShrink: 0 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/marketplace/search" style={{
                display: "block", textAlign: "center", fontSize: 14, fontWeight: 800, padding: "12px 20px",
                background: "var(--ink)", color: "#fff", borderRadius: "var(--r-sm)",
                border: "2px solid var(--ink)", boxShadow: "3px 3px 0 var(--orange)", textDecoration: "none",
              }}>
                Find Creators →
              </Link>
            </div>
          </div>

          {/* Join CTA */}
          <div style={{
            background: "var(--card)", border: "2px solid var(--ink)",
            borderRadius: "var(--r-md)", boxShadow: "4px 4px 0 var(--ink)",
            padding: "32px", textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🚀</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink)", marginBottom: 8 }}>
              MARKETPLACE OPENING SOON
            </div>
            <p style={{ color: "var(--ink-2)", fontSize: 14, marginBottom: 24, maxWidth: 480, margin: "0 auto 24px" }}>
              Sign up now to be among the first creators onboarded — or post your first brand brief.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/login" className="btn-hard" style={{ fontSize: 14, padding: "12px 24px" }}>Join as Creator →</Link>
              <Link href="/login" style={{
                display: "inline-flex", alignItems: "center",
                fontSize: 14, fontWeight: 800, padding: "12px 24px",
                background: "var(--ink)", color: "#fff",
                border: "2px solid var(--ink)", borderRadius: "var(--r-sm)",
                boxShadow: "3px 3px 0 var(--orange)", textDecoration: "none",
              }}>Post a Brief →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,4vw,52px)", color: "var(--ink)", marginBottom: 8 }}>HOW IT WORKS</h2>
            <p style={{ color: "var(--ink-2)", fontSize: 16 }}>From idea to published reel in under a minute</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} className="card" style={{ position: "relative", padding: 28 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 44, height: 44, borderRadius: "50%",
                  border: "2px solid var(--ink)", boxShadow: "var(--shadow-sm)",
                  background: "var(--orange)", color: "#fff",
                  fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 900,
                  marginBottom: 16, transform: `rotate(${[-3, 2, -2][i]}deg)`,
                }}>{s.n}</div>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{s.emoji}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink)", marginBottom: 8 }}>{s.title.toUpperCase()}</h3>
                <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: "var(--bg-2)", borderTop: "2px solid var(--ink)", borderBottom: "2px solid var(--ink)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,4vw,52px)", color: "var(--ink)", marginBottom: 8 }}>EVERYTHING INCLUDED</h2>
            <p style={{ color: "var(--ink-2)", fontSize: 16 }}>No plugins. No editors. No headache.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="card" style={{ display: "flex", gap: 16, padding: 24, alignItems: "flex-start" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "var(--r-sm)",
                  border: "2px solid var(--ink)", boxShadow: "var(--shadow-sm)",
                  background: "var(--orange-lt)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                }}>{f.emoji}</div>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)", marginBottom: 4 }}>{f.title.toUpperCase()}</div>
                  <p style={{ color: "var(--ink-2)", fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,4vw,52px)", color: "var(--ink)", marginBottom: 8 }}>SIMPLE PRICING</h2>
            <p style={{ color: "var(--ink-2)", fontSize: 16 }}>Start free. Scale as you grow.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, alignItems: "start" }}>
            {PLANS.map((p) => (
              <div key={p.name} className="card" style={{
                padding: 28,
                transform: p.highlight ? "translateY(-8px)" : "none",
                boxShadow: p.highlight ? "var(--shadow-lg)" : "var(--shadow-md)",
                border: p.highlight ? "2px solid var(--orange)" : "2px solid var(--ink)",
              }}>
                {p.highlight && (
                  <div className="sticker" style={{ display: "inline-block", background: "var(--orange)", color: "#fff", fontSize: 11, fontWeight: 900, padding: "4px 12px", marginBottom: 12 }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--ink)", marginBottom: 4 }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--ink)" }}>{p.price}</span>
                  <span style={{ fontSize: 14, color: "var(--muted)" }}>{p.period}</span>
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {p.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--ink-2)" }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: p.highlight ? "var(--orange)" : "var(--bg-2)",
                        border: "2px solid var(--ink)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 900, flexShrink: 0,
                        color: p.highlight ? "#fff" : "var(--ink)",
                      }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="btn-hard" style={{
                  display: "block", textAlign: "center", fontSize: 15, padding: "12px 24px",
                  background: p.highlight ? "var(--orange)" : "var(--card)",
                  color: p.highlight ? "#fff" : "var(--ink)",
                }}>
                  {p.name === "FREE" ? "Start Free" : `Get ${p.name}`}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: "var(--bg-2)", borderTop: "2px solid var(--ink)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px,4vw,52px)", color: "var(--ink)", marginBottom: 8 }}>FAQ</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {FAQS.map((f) => (
              <div key={f.q} className="card" style={{ padding: "20px 24px" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--ink)", marginBottom: 8 }}>
                  <span style={{ color: "var(--orange)", marginRight: 8 }}>Q.</span>{f.q.toUpperCase()}
                </div>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "var(--orange)", borderTop: "2px solid var(--ink)", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,5vw,64px)", color: "#fff", marginBottom: 16 }}>
            START CREATING TODAY
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.85)", marginBottom: 36 }}>
            5 free reels. No credit card. Hindi + English + Hinglish.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "#fff", color: "var(--orange-dark)",
              border: "2px solid var(--ink)", borderRadius: "var(--r-sm)",
              boxShadow: "5px 5px 0 var(--ink)",
              padding: "16px 36px", fontSize: 18, fontWeight: 900,
              textDecoration: "none",
            }}>
              🚀 Create Your First Reel Free
            </Link>
            <Link href="/marketplace/search" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "var(--ink)", color: "#fff",
              border: "2px solid var(--ink)", borderRadius: "var(--r-sm)",
              boxShadow: "5px 5px 0 rgba(255,255,255,0.3)",
              padding: "16px 36px", fontSize: 18, fontWeight: 900,
              textDecoration: "none",
            }}>
              💼 Browse Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "var(--ink)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 36, height: 36, fontSize: 18,
              background: "var(--orange)", borderRadius: 8,
              border: "2px solid rgba(255,255,255,0.3)",
              transform: "rotate(-4deg)",
            }}>🎬</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#fff" }}>ReelCraft</span>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/marketplace" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: 700 }}>Marketplace</Link>
            <Link href="/marketplace/search" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: 700 }}>For Brands</Link>
            <Link href="#pricing" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: 700 }}>Pricing</Link>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            © 2026 ReelCraft. Built for Indian creators.
          </div>
        </div>
      </footer>
    </div>
  );
}
