"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { MP_NICHES, MP_LANGUAGES } from "@/lib/marketplace-data";

const STEPS = ["Bio & Niches", "Pricing", "Verify Socials", "Portfolio"];

export default function ProfileSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [bio, setBio] = useState("");
  const [niches, setNiches] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [ratePerVideo, setRatePerVideo] = useState(10000);
  const [ratePerCollab, setRatePerCollab] = useState(50000);
  const [igVerified, setIgVerified] = useState(false);
  const [ytVerified, setYtVerified] = useState(false);
  const [openForWork, setOpenForWork] = useState(true);

  const toggleNiche = (n: string) => setNiches((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]);
  const toggleLang = (l: string) => setLanguages((p) => p.includes(l) ? p.filter((x) => x !== l) : [...p, l]);

  const chipStyle = (active: boolean, color = "var(--orange)") => ({
    display: "inline-flex", alignItems: "center", padding: "7px 14px",
    borderRadius: 999, border: "2px solid var(--ink)",
    background: active ? color : "var(--bg-2)",
    color: active ? "#fff" : "var(--ink)",
    fontWeight: 700, fontSize: 13, cursor: "pointer",
    boxShadow: active ? "2px 2px 0 var(--ink)" : "none",
    transition: "all 0.08s ease",
  } as React.CSSProperties);

  return (
    <AppShell>
      <div style={{ padding: "32px 28px", maxWidth: 760 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--ink)", marginBottom: 4 }}>
            CREATOR PROFILE SETUP
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 15 }}>Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>

        {/* Step progress */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 6, borderRadius: 999, background: i <= step ? "var(--orange)" : "var(--bg-2)", border: "1.5px solid var(--ink)", transition: "background 0.2s ease" }} />
          ))}
        </div>

        {/* Step 1: Bio & Niches */}
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <label style={{ fontWeight: 800, fontSize: 14, display: "block", marginBottom: 8 }}>Creator bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 100))}
                placeholder="Tell brands about yourself in 100 characters..."
                style={{
                  width: "100%", minHeight: 80, background: "var(--card)", border: "2px solid var(--ink)",
                  borderRadius: 12, padding: "12px 14px", fontFamily: "var(--font-body)",
                  fontWeight: 600, fontSize: 15, resize: "vertical", outline: "none",
                  color: "var(--ink)",
                }}
              />
              <div style={{ textAlign: "right", fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{bio.length}/100</div>
            </div>

            <div>
              <label style={{ fontWeight: 800, fontSize: 14, display: "block", marginBottom: 8 }}>Content niches</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {MP_NICHES.map((n) => (
                  <span key={n} style={chipStyle(niches.includes(n))} onClick={() => toggleNiche(n)}>{n}</span>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontWeight: 800, fontSize: 14, display: "block", marginBottom: 8 }}>Languages</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {MP_LANGUAGES.map((l) => (
                  <span key={l} style={chipStyle(languages.includes(l), "var(--pink)")} onClick={() => toggleLang(l)}>{l}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <label style={{ fontWeight: 800, fontSize: 14, display: "block", marginBottom: 8 }}>Rate per video (₹)</label>
              <input
                type="number"
                value={ratePerVideo}
                onChange={(e) => setRatePerVideo(Number(e.target.value))}
                style={{
                  width: "100%", background: "var(--card)", border: "2px solid var(--ink)",
                  borderRadius: 12, padding: "12px 14px", fontFamily: "var(--font-body)",
                  fontWeight: 700, fontSize: 20, outline: "none", color: "var(--ink)",
                }}
              />
              <input
                type="range" min={1000} max={100000} step={500}
                value={ratePerVideo}
                onChange={(e) => setRatePerVideo(Number(e.target.value))}
                style={{ width: "100%", marginTop: 8, accentColor: "var(--orange)" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)" }}>
                <span>₹1,000</span><span>₹1,00,000</span>
              </div>
            </div>

            <div>
              <label style={{ fontWeight: 800, fontSize: 14, display: "block", marginBottom: 8 }}>Rate per collab (package, ₹)</label>
              <input
                type="number"
                value={ratePerCollab}
                onChange={(e) => setRatePerCollab(Number(e.target.value))}
                style={{
                  width: "100%", background: "var(--card)", border: "2px solid var(--ink)",
                  borderRadius: 12, padding: "12px 14px", fontFamily: "var(--font-body)",
                  fontWeight: 700, fontSize: 20, outline: "none", color: "var(--ink)",
                }}
              />
            </div>

            <div style={{
              background: "var(--bg-2)", border: "2px solid var(--ink)",
              borderRadius: "var(--r-md)", padding: "20px",
              boxShadow: "3px 3px 0 var(--ink)",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)", marginBottom: 6 }}>You'll receive (after 12% platform + 2% Razorpay)</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--green)" }}>
                ₹{Math.round(ratePerVideo * 0.86).toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>per video · 86% take-home guaranteed</div>
            </div>
          </div>
        )}

        {/* Step 3: Verify socials */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { key: "ig", label: "Instagram", emoji: "📸", required: true, verified: igVerified, setVerified: setIgVerified },
              { key: "yt", label: "YouTube", emoji: "▶️", required: false, verified: ytVerified, setVerified: setYtVerified },
            ].map((s) => (
              <div key={s.key} style={{
                background: "var(--card)", border: "2px solid var(--ink)",
                borderRadius: "var(--r-md)", padding: "20px",
                boxShadow: "3px 3px 0 var(--ink)",
                display: "flex", alignItems: "center", gap: 16,
              }}>
                <span style={{ fontSize: 32 }}>{s.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{s.label} {s.required && <span style={{ color: "var(--pink)", fontSize: 12 }}>Required</span>}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>{s.verified ? "Connected ✅" : "Not connected"}</div>
                </div>
                <button
                  onClick={() => s.setVerified(!s.verified)}
                  style={{
                    padding: "8px 18px", borderRadius: 10, cursor: "pointer",
                    fontWeight: 700, fontSize: 13,
                    background: s.verified ? "var(--green)" : "var(--orange)",
                    color: "#fff", border: "2px solid var(--ink)",
                    boxShadow: "2px 2px 0 var(--ink)",
                  }}
                >
                  {s.verified ? "Connected" : "Connect"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Portfolio */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>Auto-portfolio (from your reels)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { grad: "reel-grad-1", score: 92, label: "Viral" },
                  { grad: "reel-grad-3", score: 78, label: "Trending" },
                  { grad: "reel-grad-5", score: 65, label: "Good" },
                ].map((r, i) => (
                  <div key={i} style={{ position: "relative", aspectRatio: "9/16", borderRadius: 16, border: "2px solid var(--ink)", overflow: "hidden" }}>
                    <div className={r.grad} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🎬</div>
                    <div style={{
                      position: "absolute", bottom: 8, left: 0, right: 0, display: "flex", justifyContent: "center",
                    }}>
                      <span style={{
                        background: r.score >= 80 ? "var(--green)" : "var(--saffron)",
                        color: "#fff", fontSize: 11, fontWeight: 800,
                        border: "1.5px solid var(--ink)", borderRadius: 999, padding: "2px 8px",
                      }}>
                        {r.score}% {r.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "var(--card)", border: "2px solid var(--ink)",
              borderRadius: "var(--r-md)", padding: "16px 20px",
              boxShadow: "3px 3px 0 var(--ink)",
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>Open for work</div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Brands can see your profile and send briefs</div>
              </div>
              <button
                onClick={() => setOpenForWork(!openForWork)}
                style={{
                  width: 52, height: 28, borderRadius: 999,
                  background: openForWork ? "var(--green)" : "var(--bg-2)",
                  border: "2px solid var(--ink)", cursor: "pointer",
                  position: "relative", transition: "background 0.2s ease",
                }}
              >
                <span style={{
                  position: "absolute", top: 2, left: openForWork ? 24 : 2,
                  width: 20, height: 20, borderRadius: 999,
                  background: "#fff", border: "1.5px solid var(--ink)",
                  transition: "left 0.2s ease",
                }} />
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "space-between" }}>
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="btn-hard ghost" style={{ fontSize: 14 }}>← Back</button>
          ) : <div />}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="btn-hard" style={{ fontSize: 14 }}>Continue →</button>
          ) : (
            <button onClick={() => router.push("/marketplace/creator")} className="btn-hard" style={{ fontSize: 14, background: "var(--green)" }}>
              🚀 Go live
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
