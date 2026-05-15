"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { MP_NICHES, MP_LANGUAGES, MP_CREATORS } from "@/lib/marketplace-data";

const PLATFORMS = ["Instagram", "YouTube", "Facebook"];
const DURATIONS = ["15s", "30s", "60s"];

function matchScore(creator: typeof MP_CREATORS[0], niches: string[], langs: string[], budget: number) {
  const nicheOverlap = niches.filter((n) => creator.niches.includes(n)).length;
  const langOverlap = langs.filter((l) => creator.languages.includes(l)).length;
  const budgetFit = creator.rate <= budget ? 20 : Math.max(0, 20 - Math.round((creator.rate - budget) / budget * 10));
  return nicheOverlap * 30 + langOverlap * 15 + budgetFit + creator.rating * 4;
}

export default function BriefNewPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [numReels, setNumReels] = useState(3);
  const [timeline, setTimeline] = useState(7);
  const [platforms, setPlatforms] = useState<string[]>(["Instagram"]);
  const [durations, setDurations] = useState<string[]>(["30s"]);
  const [niches, setNiches] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>([]);
  const [budgetPerReel, setBudgetPerReel] = useState(10000);
  const [showModal, setShowModal] = useState(false);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);

  const toggleArr = (arr: string[], setArr: (v: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const total = budgetPerReel * numReels;
  const escrow50 = Math.round(total * 0.5);
  const platformFee = Math.round(total * 0.12);
  const razorpayFee = Math.round(total * 0.02);
  const totalWithFees = total + platformFee + razorpayFee;

  const matched = useMemo(() => {
    return [...MP_CREATORS]
      .map((c) => ({ ...c, score: matchScore(c, niches, langs, budgetPerReel) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [niches, langs, budgetPerReel]);

  const chipStyle = (active: boolean) => ({
    display: "inline-flex", alignItems: "center", padding: "6px 12px",
    borderRadius: 999, border: "2px solid var(--ink)",
    background: active ? "var(--orange)" : "var(--bg-2)",
    color: active ? "#fff" : "var(--ink)",
    fontWeight: 700, fontSize: 12, cursor: "pointer",
    boxShadow: active ? "2px 2px 0 var(--ink)" : "none",
    transition: "all 0.08s ease",
  } as React.CSSProperties);

  const handleSend = () => {
    setSelectedCreators(matched.map((c) => c.id));
    setShowModal(true);
  };

  return (
    <AppShell>
      <div style={{ padding: "32px 28px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--ink)", marginBottom: 4 }}>
            POST A BRIEF 📋
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 15 }}>Describe your campaign — matched creators will apply</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 24, alignItems: "flex-start" }}>
          {/* Left: Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Title */}
            <div style={{ background: "var(--card)", border: "2px solid var(--ink)", borderRadius: "var(--r-md)", padding: "20px", boxShadow: "3px 3px 0 var(--ink)" }}>
              <label style={{ fontWeight: 800, fontSize: 14, display: "block", marginBottom: 8 }}>Campaign title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Funny gym reels for app launch"
                style={{
                  width: "100%", background: "var(--bg-2)", border: "2px solid var(--ink)",
                  borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-body)",
                  fontWeight: 600, fontSize: 15, outline: "none", color: "var(--ink)",
                }}
              />
            </div>

            {/* Description */}
            <div style={{ background: "var(--card)", border: "2px solid var(--ink)", borderRadius: "var(--r-md)", padding: "20px", boxShadow: "3px 3px 0 var(--ink)" }}>
              <label style={{ fontWeight: 800, fontSize: 14, display: "block", marginBottom: 8 }}>Brief description</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Describe the content, tone, messaging, and what you want creators to highlight..."
                rows={4}
                style={{
                  width: "100%", background: "var(--bg-2)", border: "2px solid var(--ink)",
                  borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-body)",
                  fontWeight: 600, fontSize: 14, outline: "none", color: "var(--ink)",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Deliverables */}
            <div style={{ background: "var(--card)", border: "2px solid var(--ink)", borderRadius: "var(--r-md)", padding: "20px", boxShadow: "3px 3px 0 var(--ink)" }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16 }}>Deliverables</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>Number of reels</label>
                  <input type="number" min={1} max={20} value={numReels} onChange={(e) => setNumReels(Number(e.target.value))}
                    style={{ width: "100%", background: "var(--bg-2)", border: "2px solid var(--ink)", borderRadius: 10, padding: "10px 12px", fontWeight: 700, fontSize: 16, outline: "none", color: "var(--ink)" }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>Timeline (days)</label>
                  <input type="number" min={1} max={90} value={timeline} onChange={(e) => setTimeline(Number(e.target.value))}
                    style={{ width: "100%", background: "var(--bg-2)", border: "2px solid var(--ink)", borderRadius: 10, padding: "10px 12px", fontWeight: 700, fontSize: 16, outline: "none", color: "var(--ink)" }} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 8 }}>Durations</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {DURATIONS.map((d) => <span key={d} style={chipStyle(durations.includes(d))} onClick={() => toggleArr(durations, setDurations, d)}>{d}</span>)}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 8 }}>Platforms</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {PLATFORMS.map((p) => <span key={p} style={chipStyle(platforms.includes(p))} onClick={() => toggleArr(platforms, setPlatforms, p)}>{p}</span>)}
                </div>
              </div>
            </div>

            {/* Match by */}
            <div style={{ background: "var(--card)", border: "2px solid var(--ink)", borderRadius: "var(--r-md)", padding: "20px", boxShadow: "3px 3px 0 var(--ink)" }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16 }}>Match creators by</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 8 }}>Niches</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {MP_NICHES.map((n) => <span key={n} style={chipStyle(niches.includes(n))} onClick={() => toggleArr(niches, setNiches, n)}>{n}</span>)}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 8 }}>Languages</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {MP_LANGUAGES.map((l) => <span key={l} style={chipStyle(langs.includes(l))} onClick={() => toggleArr(langs, setLangs, l)}>{l}</span>)}
                </div>
              </div>
            </div>

            {/* Budget */}
            <div style={{ background: "var(--card)", border: "2px solid var(--ink)", borderRadius: "var(--r-md)", padding: "20px", boxShadow: "3px 3px 0 var(--ink)" }}>
              <label style={{ fontWeight: 800, fontSize: 14, display: "block", marginBottom: 8 }}>Budget per reel (₹)</label>
              <input
                type="number" min={1000} step={500}
                value={budgetPerReel}
                onChange={(e) => setBudgetPerReel(Number(e.target.value))}
                style={{ width: "100%", background: "var(--bg-2)", border: "2px solid var(--ink)", borderRadius: 10, padding: "10px 14px", fontWeight: 700, fontSize: 20, outline: "none", color: "var(--ink)" }}
              />
              <input type="range" min={1000} max={100000} step={500} value={budgetPerReel} onChange={(e) => setBudgetPerReel(Number(e.target.value))}
                style={{ width: "100%", marginTop: 8, accentColor: "var(--orange)" }} />
            </div>
          </div>

          {/* Right: Sticky rail */}
          <div style={{ position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Escrow math */}
            <div style={{ background: "var(--card)", border: "2px solid var(--ink)", borderRadius: "var(--r-md)", padding: "20px", boxShadow: "3px 3px 0 var(--ink)" }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14 }}>💰 Escrow breakdown</div>
              {[
                { label: `Total (${numReels} reels × ₹${budgetPerReel.toLocaleString("en-IN")})`, val: total, color: "var(--ink)" },
                { label: "50% on deal start (escrow)", val: escrow50, color: "var(--saffron)" },
                { label: "50% on delivery", val: escrow50, color: "var(--green)" },
                { label: "Platform fee (12%)", val: platformFee, color: "var(--muted)" },
                { label: "Razorpay (2%)", val: razorpayFee, color: "var(--muted)" },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                  <span style={{ color: "var(--ink-2)" }}>{r.label}</span>
                  <span style={{ color: r.color, fontWeight: 800 }}>₹{r.val.toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div style={{ borderTop: "2px solid var(--ink)", paddingTop: 10, marginTop: 6, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 800, fontSize: 14 }}>You pay total</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--orange)" }}>₹{totalWithFees.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Send button */}
            <button onClick={handleSend} className="btn-hard" style={{ width: "100%", justifyContent: "center", fontSize: 15 }}>
              Send to creators →
            </button>

            {/* Matched creators */}
            <div style={{ background: "var(--card)", border: "2px solid var(--ink)", borderRadius: "var(--r-md)", padding: "16px", boxShadow: "3px 3px 0 var(--ink)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--orange-dark)", marginBottom: 12 }}>
                Top {matched.length} matches
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {matched.map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{c.avatar}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.followers} · ₹{(c.rate / 1000).toFixed(0)}K</div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 800, borderRadius: 999,
                      border: "1.5px solid var(--ink)", padding: "2px 7px",
                      background: c.score >= 60 ? "var(--green)" : "var(--saffron)", color: "#fff",
                    }}>{Math.min(99, Math.round(c.score))}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(26,20,16,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div style={{
            background: "var(--card)", border: "2px solid var(--ink)",
            borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-lg)",
            padding: "28px", maxWidth: 480, width: "100%",
          }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginBottom: 8 }}>SEND TO CREATORS</div>
            <div style={{ fontSize: 14, color: "var(--ink-2)", marginBottom: 16 }}>Deselect any creators you don't want to include:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {matched.map((c) => {
                const selected = selectedCreators.includes(c.id);
                return (
                  <div key={c.id}
                    onClick={() => setSelectedCreators(selected ? selectedCreators.filter((x) => x !== c.id) : [...selectedCreators, c.id])}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                      padding: "10px 14px", borderRadius: 12,
                      border: `2px solid ${selected ? "var(--orange)" : "var(--line)"}`,
                      background: selected ? "var(--orange-lt)" : "var(--bg-2)",
                      transition: "all 0.1s ease",
                    }}>
                    <span style={{ fontSize: 24 }}>{c.avatar}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{c.handle} · {c.followers}</div>
                    </div>
                    <span style={{ fontSize: 18 }}>{selected ? "✅" : "⬜"}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowModal(false)} className="btn-hard ghost" style={{ flex: 1, justifyContent: "center", fontSize: 14 }}>
                Cancel
              </button>
              <button
                onClick={() => { setShowModal(false); router.push("/marketplace/deals/d1"); }}
                className="btn-hard"
                style={{ flex: 2, justifyContent: "center", fontSize: 14, background: "var(--green)" }}
                disabled={selectedCreators.length === 0}
              >
                Send + lock escrow ({selectedCreators.length}) →
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
