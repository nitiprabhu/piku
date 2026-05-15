"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const TIMELINE_STEPS = [
  { label: "Brief sent", emoji: "📋" },
  { label: "Accepted + 50% escrow", emoji: "🤝" },
  { label: "Reels delivered", emoji: "🎬" },
  { label: "Brand approval", emoji: "✅" },
  { label: "Final 50% released", emoji: "💸" },
  { label: "Rated", emoji: "⭐" },
];

const TABS = ["Conversation", "Deliverables", "Brief details"];

interface Deal {
  id: string;
  brief_id: string;
  creator_user_id: string;
  brand_user_id: string;
  total_amount: number;
  creator_payout: number;
  num_reels: number;
  delivered_reels: number;
  status: string;
  deadline: string | null;
  created_at: string;
  deliverables: Deliverable[];
}

interface Message {
  id: string;
  sender_user_id: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
}

interface Deliverable {
  id: string;
  project_id: string | null;
  status: string;
  review_note: string | null;
  submitted_at: string;
}

function statusStyle(status: string) {
  const map: Record<string, { bg: string; color: string }> = {
    approved: { bg: "var(--green)", color: "#fff" },
    revision_requested: { bg: "var(--pink)", color: "#fff" },
    submitted: { bg: "var(--saffron)", color: "var(--ink)" },
  };
  return map[status] || { bg: "var(--bg-2)", color: "var(--muted)" };
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DealRoomPage() {
  const params = useParams();
  const id = params.id as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const headers: Record<string, string> = { "Content-Type": "application/json", ...authHeader };

  const fetchDeal = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/marketplace/deals/${id}`, { headers });
      if (res.ok) setDeal(await res.json());
    } finally {
      setLoading(false);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`${API}/api/v1/marketplace/deals/${id}/messages`, { headers });
    if (res.ok) setMessages(await res.json());
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMe = useCallback(async () => {
    const res = await fetch(`${API}/api/v1/user/me`, { headers });
    if (res.ok) {
      const u = await res.json();
      setMyUserId(u.id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchDeal(); fetchMessages(); fetchMe(); }, [fetchDeal, fetchMessages, fetchMe]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/api/v1/marketplace/deals/${id}/messages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message }),
      });
      if (res.ok) {
        setMessage("");
        fetchMessages();
      }
    } finally {
      setSending(false);
    }
  };

  const currentStep = !deal ? 0 : deal.status === "completed" ? 5 : deal.status === "review" ? 3 : deal.delivered_reels > 0 ? 2 : 1;

  if (loading) {
    return (
      <AppShell>
        <div style={{ padding: "60px 28px", textAlign: "center", color: "var(--muted)" }}>Loading deal…</div>
      </AppShell>
    );
  }

  if (!deal) {
    return (
      <AppShell>
        <div style={{ padding: "60px 28px", textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 8 }}>DEAL NOT FOUND</div>
          <p style={{ color: "var(--ink-2)" }}>You may not have access to this deal.</p>
        </div>
      </AppShell>
    );
  }

  const escrowAmount = Math.round(deal.creator_payout * 0.5);

  return (
    <AppShell>
      <div style={{ padding: "32px 28px", maxWidth: 1000 }}>
        {/* Deal header */}
        <div style={{
          background: "var(--card)", border: "2px solid var(--ink)",
          borderRadius: "var(--r-lg)", padding: "24px",
          boxShadow: "var(--shadow-md)", marginBottom: 24,
        }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink)" }}>
                DEAL #{deal.id.slice(0, 8).toUpperCase()}
              </div>
              <div style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 2 }}>
                Deadline: {fmtDate(deal.deadline)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>₹{(deal.creator_payout / 100).toLocaleString("en-IN")}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Your payout</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--saffron)" }}>₹{(escrowAmount / 100).toLocaleString("en-IN")}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>In escrow</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>{deal.delivered_reels}/{deal.num_reels}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Reels</div>
              </div>
            </div>
          </div>
        </div>

        {/* Escrow timeline */}
        <div style={{
          background: "var(--card)", border: "2px solid var(--ink)",
          borderRadius: "var(--r-md)", padding: "20px",
          boxShadow: "3px 3px 0 var(--ink)", marginBottom: 24,
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--orange-dark)", marginBottom: 14 }}>
            Deal progress
          </div>
          <div style={{ display: "flex", gap: 0, alignItems: "flex-start", overflowX: "auto" }}>
            {TIMELINE_STEPS.map((s, i) => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 80 }}>
                <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                  {i > 0 && <div style={{ flex: 1, height: 3, background: i <= currentStep ? "var(--orange)" : "var(--bg-2)", border: "1px solid var(--ink)" }} />}
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    border: "2px solid var(--ink)",
                    background: i <= currentStep ? "var(--orange)" : "var(--bg-2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, flexShrink: 0,
                    boxShadow: i === currentStep ? "0 0 0 4px rgba(255,87,34,0.2)" : "none",
                  }}>
                    {i <= currentStep ? "✓" : s.emoji}
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && <div style={{ flex: 1, height: 3, background: i < currentStep ? "var(--orange)" : "var(--bg-2)", border: "1px solid var(--ink)" }} />}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, textAlign: "center", marginTop: 6, color: i <= currentStep ? "var(--orange-dark)" : "var(--muted)", lineHeight: 1.3 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid var(--line)" }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding: "10px 18px", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14,
              background: "none", border: "none", cursor: "pointer",
              color: tab === i ? "var(--orange)" : "var(--ink-2)",
              borderBottom: tab === i ? "3px solid var(--orange)" : "3px solid transparent",
              marginBottom: -2,
            }}>
              {t}
            </button>
          ))}
        </div>

        {/* Conversation */}
        {tab === 0 && (
          <div style={{ background: "var(--card)", border: "2px solid var(--ink)", borderRadius: "var(--r-md)", boxShadow: "3px 3px 0 var(--ink)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", maxHeight: 400, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: "var(--muted)", padding: "20px 0" }}>No messages yet. Start the conversation!</div>
              )}
              {messages.map((m) => {
                const isMe = m.sender_user_id === myUserId;
                return (
                  <div key={m.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 10 }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{isMe ? "🧔🏽" : "🏢"}</span>
                    <div style={{
                      maxWidth: "70%", padding: "10px 14px",
                      borderRadius: isMe ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                      border: "2px solid var(--ink)",
                      background: isMe ? "var(--orange)" : "var(--bg-2)",
                      color: isMe ? "#fff" : "var(--ink)",
                      boxShadow: "2px 2px 0 var(--ink)",
                    }}>
                      <div style={{ fontSize: 14, lineHeight: 1.5 }}>{m.message}</div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: "right" }}>{fmtTime(m.created_at)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={msgEndRef} />
            </div>
            <div style={{ borderTop: "2px solid var(--ink)", padding: "14px 16px", display: "flex", gap: 10 }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message…"
                rows={2}
                style={{
                  flex: 1, background: "var(--bg-2)", border: "2px solid var(--ink)",
                  borderRadius: 10, padding: "8px 12px", fontFamily: "var(--font-body)",
                  fontWeight: 600, fontSize: 14, outline: "none", resize: "none", color: "var(--ink)",
                }}
              />
              <button onClick={sendMessage} disabled={sending || !message.trim()} style={{
                padding: "0 18px", background: "var(--orange)", color: "#fff",
                border: "2px solid var(--ink)", borderRadius: 10,
                boxShadow: "2px 2px 0 var(--ink)", cursor: "pointer",
                fontWeight: 800, fontSize: 14,
                opacity: sending || !message.trim() ? 0.6 : 1,
              }}>Send</button>
            </div>
          </div>
        )}

        {/* Deliverables */}
        {tab === 1 && (
          <div>
            {deal.deliverables.length === 0 ? (
              <div style={{
                background: "var(--card)", border: "2px solid var(--ink)",
                borderRadius: "var(--r-md)", padding: "40px 20px", textAlign: "center",
                boxShadow: "3px 3px 0 var(--ink)",
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🎬</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 8 }}>NO DELIVERABLES YET</div>
                <p style={{ color: "var(--ink-2)", fontSize: 14 }}>Submit your reels to start the review process.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
                {deal.deliverables.map((dv, i) => {
                  const s = statusStyle(dv.status);
                  return (
                    <div key={dv.id} style={{
                      background: "var(--card)", border: "2px solid var(--ink)",
                      borderRadius: "var(--r-md)", overflow: "hidden",
                      boxShadow: "3px 3px 0 var(--ink)",
                    }}>
                      <div style={{
                        background: "var(--bg-2)", height: 100,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 36, borderBottom: "2px solid var(--ink)",
                      }}>🎬</div>
                      <div style={{ padding: "10px 12px" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>
                          Reel {i + 1}
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 800, borderRadius: 999,
                          border: "1.5px solid var(--ink)", padding: "2px 8px",
                          background: s.bg, color: s.color,
                        }}>
                          {dv.status.replace("_", " ")}
                        </span>
                        {dv.review_note && (
                          <div style={{ fontSize: 11, color: "var(--ink-2)", marginTop: 6 }}>{dv.review_note}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Brief details */}
        {tab === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "var(--card)", border: "2px solid var(--ink)", borderRadius: "var(--r-md)", overflow: "hidden", boxShadow: "3px 3px 0 var(--ink)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {[
                    ["Deal ID", `#${deal.id.slice(0, 8)}`],
                    ["Deliverables", `${deal.num_reels} reels`],
                    ["Total value", `₹${(deal.total_amount / 100).toLocaleString("en-IN")}`],
                    ["Your payout (86%)", `₹${(deal.creator_payout / 100).toLocaleString("en-IN")}`],
                    ["Escrow (50% upfront)", `₹${(escrowAmount / 100).toLocaleString("en-IN")}`],
                    ["Deadline", fmtDate(deal.deadline)],
                    ["Status", deal.status],
                  ].map(([k, v], i, arr) => (
                    <tr key={k} style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none" }}>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "var(--ink-2)", width: "40%" }}>{k}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
