"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const TABS = ["New briefs", "Active deals", "Completed", "Payouts"];

interface Brief {
  id: string;
  title: string;
  description: string | null;
  niches: string[] | null;
  languages: string[] | null;
  num_reels: number;
  budget_per_reel: number;
  timeline_days: number;
  creator_payout: number;
  status: string;
  created_at: string;
}

interface Deal {
  id: string;
  brief_id: string;
  total_amount: number;
  creator_payout: number;
  num_reels: number;
  delivered_reels: number;
  status: string;
  deadline: string | null;
  created_at: string;
}

function statusColor(status: string) {
  if (status === "in_progress") return "var(--saffron)";
  if (status === "review") return "var(--pink)";
  if (status === "completed") return "var(--green)";
  return "var(--muted)";
}

function statusLabel(status: string) {
  if (status === "in_progress") return "In Progress";
  if (status === "review") return "In Review";
  if (status === "completed") return "Completed";
  return status;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function CreatorHubPage() {
  const [tab, setTab] = useState(0);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loadingBriefs, setLoadingBriefs] = useState(true);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  const fetchBriefs = useCallback(async () => {
    setLoadingBriefs(true);
    try {
      const res = await fetch(`${API}/api/v1/marketplace/briefs?limit=50`);
      if (res.ok) setBriefs(await res.json());
    } finally {
      setLoadingBriefs(false);
    }
  }, []);

  const fetchDeals = useCallback(async () => {
    setLoadingDeals(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API}/api/v1/marketplace/deals`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) setDeals(await res.json());
    } finally {
      setLoadingDeals(false);
    }
  }, []);

  useEffect(() => { fetchBriefs(); fetchDeals(); }, [fetchBriefs, fetchDeals]);

  const applyToBrief = async (briefId: string) => {
    setApplying(briefId);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API}/api/v1/marketplace/briefs/${briefId}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        fetchBriefs();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail ?? "Failed to apply");
      }
    } finally {
      setApplying(null);
    }
  };

  const activeDeals = deals.filter((d) => d.status !== "completed" && d.status !== "cancelled");
  const completedDeals = deals.filter((d) => d.status === "completed");

  const totalEarned = completedDeals.reduce((sum, d) => sum + d.creator_payout, 0);
  const inEscrow = activeDeals.reduce((sum, d) => sum + Math.round(d.creator_payout * 0.5), 0);

  const statCards = [
    { label: "Lifetime earned", value: totalEarned > 0 ? `₹${(totalEarned / 100).toLocaleString("en-IN")}` : "—", emoji: "🏆", sub: `${completedDeals.length} completed deals` },
    { label: "In escrow", value: inEscrow > 0 ? `₹${(inEscrow / 100).toLocaleString("en-IN")}` : "—", emoji: "🔒", sub: `${activeDeals.length} active deals` },
    { label: "Open briefs", value: briefs.length.toString(), emoji: "📋", sub: "Available to apply" },
    { label: "Avg per reel", value: activeDeals.length > 0 ? `₹${Math.round(activeDeals.reduce((s, d) => s + d.creator_payout / d.num_reels, 0) / activeDeals.length / 100).toLocaleString("en-IN")}` : "—", emoji: "📊", sub: "Across active deals" },
  ];

  return (
    <AppShell>
      <div style={{ padding: "32px 28px", maxWidth: 1100 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 28, flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--ink)", marginBottom: 4 }}>
              CREATOR HUB 💼
            </h1>
            <p style={{ color: "var(--ink-2)", fontSize: 14 }}>Your marketplace dashboard</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/marketplace/search" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "var(--card)", color: "var(--ink)",
              fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13,
              border: "2px solid var(--ink)", borderRadius: 10,
              boxShadow: "2px 2px 0 var(--ink)", padding: "8px 14px",
              textDecoration: "none",
            }}>Browse marketplace</Link>
            <Link href="/marketplace/profile/setup" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "var(--orange)", color: "#fff",
              fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13,
              border: "2px solid var(--ink)", borderRadius: 10,
              boxShadow: "2px 2px 0 var(--ink)", padding: "8px 14px",
              textDecoration: "none",
            }}>Edit profile →</Link>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
          {statCards.map((s) => (
            <div key={s.label} style={{
              background: "var(--card)", border: "2px solid var(--ink)",
              borderRadius: "var(--r-md)", padding: "20px",
              boxShadow: "3px 3px 0 var(--ink)",
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{s.emoji}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--ink)", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--green)", marginTop: 2, fontWeight: 600 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid var(--line)" }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding: "10px 18px", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14,
              background: "none", border: "none", cursor: "pointer",
              color: tab === i ? "var(--orange)" : "var(--ink-2)",
              borderBottom: tab === i ? "3px solid var(--orange)" : "3px solid transparent",
              marginBottom: -2, transition: "all 0.1s ease",
            }}>
              {t}
              {t === "New briefs" && briefs.length > 0 && (
                <span style={{
                  marginLeft: 6, background: "var(--pink)", color: "#fff",
                  fontSize: 10, fontWeight: 800, borderRadius: 999,
                  border: "1.5px solid var(--ink)", padding: "1px 6px",
                }}>{briefs.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* New briefs */}
        {tab === 0 && (
          loadingBriefs ? (
            <div style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>Loading briefs…</div>
          ) : briefs.length === 0 ? (
            <div style={{
              background: "var(--card)", border: "2px solid var(--ink)",
              borderRadius: "var(--r-md)", padding: "40px 20px", textAlign: "center",
              boxShadow: "3px 3px 0 var(--ink)",
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 8 }}>NO OPEN BRIEFS</div>
              <p style={{ color: "var(--ink-2)", fontSize: 14 }}>Brands haven&apos;t posted briefs yet. Check back soon!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {briefs.map((b) => (
                <div key={b.id} style={{
                  background: "var(--card)", border: "2px solid var(--ink)",
                  borderRadius: "var(--r-md)", padding: "20px",
                  boxShadow: "3px 3px 0 var(--ink)",
                }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontSize: 15 }}>{b.title}</span>
                      </div>
                      {b.description && (
                        <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 6 }}>{b.description}</div>
                      )}
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {b.num_reels} reels · {b.timeline_days} days · ₹{(b.budget_per_reel / 100).toLocaleString("en-IN")}/reel
                        {b.niches && b.niches.length > 0 && ` · ${b.niches.join(", ")}`}
                        {b.languages && b.languages.length > 0 && ` · ${b.languages.join(", ")}`}
                        {" · "}{fmtDate(b.created_at)}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, color: "var(--green)", fontWeight: 700 }}>
                        Your payout: ₹{(b.creator_payout / 100).toLocaleString("en-IN")} (86%)
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                      <button
                        onClick={() => applyToBrief(b.id)}
                        disabled={applying === b.id}
                        style={{
                          padding: "8px 16px", borderRadius: 10, cursor: applying === b.id ? "wait" : "pointer",
                          fontWeight: 700, fontSize: 13, background: "var(--green)", color: "#fff",
                          border: "2px solid var(--ink)", boxShadow: "2px 2px 0 var(--ink)",
                          opacity: applying === b.id ? 0.7 : 1,
                        }}
                      >{applying === b.id ? "Applying…" : "Apply"}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Active deals */}
        {tab === 1 && (
          loadingDeals ? (
            <div style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>Loading deals…</div>
          ) : activeDeals.length === 0 ? (
            <div style={{
              background: "var(--card)", border: "2px solid var(--ink)",
              borderRadius: "var(--r-md)", padding: "40px 20px", textAlign: "center",
              boxShadow: "3px 3px 0 var(--ink)",
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🤝</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 8 }}>NO ACTIVE DEALS</div>
              <p style={{ color: "var(--ink-2)", fontSize: 14 }}>Apply to briefs to get started!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {activeDeals.map((d) => (
                <Link key={d.id} href={`/marketplace/deals/${d.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "var(--card)", border: "2px solid var(--ink)",
                    borderRadius: "var(--r-md)", padding: "20px",
                    boxShadow: "3px 3px 0 var(--ink)", cursor: "pointer",
                  }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "var(--ink)", marginBottom: 2 }}>
                          Deal #{d.id.slice(0, 8)}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ink-2)" }}>
                          {d.delivered_reels}/{d.num_reels} reels · Deadline: {fmtDate(d.deadline)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink)" }}>
                          ₹{(d.creator_payout / 100).toLocaleString("en-IN")}
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 800, borderRadius: 999,
                          border: "1.5px solid var(--ink)", padding: "2px 8px",
                          background: statusColor(d.status), color: "#fff",
                        }}>{statusLabel(d.status)}</span>
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <div style={{ height: 6, background: "var(--bg-2)", borderRadius: 999, border: "1.5px solid var(--ink)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.round((d.delivered_reels / d.num_reels) * 100)}%`, background: "var(--orange)", transition: "width 0.3s ease" }} />
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, textAlign: "right" }}>
                        {Math.round((d.delivered_reels / d.num_reels) * 100)}% complete
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Completed deals */}
        {tab === 2 && (
          loadingDeals ? (
            <div style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>Loading…</div>
          ) : completedDeals.length === 0 ? (
            <div style={{
              background: "var(--card)", border: "2px solid var(--ink)",
              borderRadius: "var(--r-md)", padding: "40px 20px", textAlign: "center",
              boxShadow: "3px 3px 0 var(--ink)",
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 8 }}>NO COMPLETED DEALS YET</div>
              <p style={{ color: "var(--ink-2)", fontSize: 14 }}>Complete your first deal to see it here.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {completedDeals.map((d) => (
                <Link key={d.id} href={`/marketplace/deals/${d.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "var(--card)", border: "2px solid var(--ink)",
                    borderRadius: "var(--r-md)", padding: "20px",
                    boxShadow: "3px 3px 0 var(--ink)", opacity: 0.85,
                  }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>Deal #{d.id.slice(0, 8)}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-2)" }}>{d.num_reels} reels delivered</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>₹{(d.creator_payout / 100).toLocaleString("en-IN")}</div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--green)" }}>✅ Completed</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}

        {/* Payouts */}
        {tab === 3 && (
          <div style={{
            background: "var(--card)", border: "2px solid var(--ink)",
            borderRadius: "var(--r-md)", overflow: "hidden",
            boxShadow: "3px 3px 0 var(--ink)",
          }}>
            {deals.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>💸</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 8 }}>NO PAYOUTS YET</div>
                <p style={{ color: "var(--ink-2)", fontSize: 14 }}>Payout history will appear once deals are completed.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--bg-2)", borderBottom: "2px solid var(--ink)" }}>
                    {["Date", "Deal", "Amount", "Status"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "var(--ink-2)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deals.map((d, i) => (
                    <tr key={d.id} style={{ borderBottom: i < deals.length - 1 ? "1px solid var(--line)" : "none" }}>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "var(--ink-2)" }}>{fmtDate(d.created_at)}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700 }}>#{d.id.slice(0, 8)} · {d.num_reels} reels</td>
                      <td style={{ padding: "12px 16px", fontFamily: "var(--font-display)", fontSize: 16 }}>₹{(d.creator_payout / 100).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 800, borderRadius: 999, padding: "2px 8px",
                          border: "1.5px solid var(--ink)",
                          background: d.status === "completed" ? "var(--green)" : "var(--saffron)",
                          color: d.status === "completed" ? "#fff" : "var(--ink)",
                        }}>{statusLabel(d.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
