"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MP_NICHES, MP_LANGUAGES } from "@/lib/marketplace-data";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005";

interface Creator {
  user_id: string;
  name: string | null;
  bio: string | null;
  niches: string[] | null;
  languages: string[] | null;
  rate_per_reel: number | null;   // paise
  instagram_handle: string | null;
  youtube_handle: string | null;
  follower_count: number | null;
  is_verified: boolean;
  avg_rating: number | null;
  total_deals: number;
}

const FOLLOWER_RANGES = [
  { label: "Any", min: undefined, max: undefined },
  { label: "10K+", min: 10000, max: undefined },
  { label: "100K+", min: 100000, max: undefined },
  { label: "500K+", min: 500000, max: undefined },
  { label: "1M+", min: 1000000, max: undefined },
];

const RATE_RANGES = [
  { label: "Any", max: undefined },
  { label: "< ₹10K", max: 1000000 },    // paise
  { label: "< ₹25K", max: 2500000 },
  { label: "< ₹50K", max: 5000000 },
];

function formatFollowers(n: number | null) {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const GRAD_CLASSES = ["reel-grad-1", "reel-grad-2", "reel-grad-3", "reel-grad-4", "reel-grad-5"];
function gradForId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return GRAD_CLASSES[h % GRAD_CLASSES.length];
}

export default function MarketplaceSearchPage() {
  const [nicheFilters, setNicheFilters] = useState<string[]>([]);
  const [langFilters, setLangFilters] = useState<string[]>([]);
  const [minRate, setMinRate] = useState<number | undefined>(undefined);
  const [maxRate, setMaxRate] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"rate" | "rating" | "followers">("rating");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (nicheFilters.length === 1) params.set("niche", nicheFilters[0]);
      if (langFilters.length === 1) params.set("language", langFilters[0]);
      if (minRate !== undefined) params.set("min_rate", String(minRate));
      if (maxRate !== undefined) params.set("max_rate", String(maxRate));
      params.set("limit", "50");
      const res = await fetch(`${API}/api/v1/marketplace/creators?${params}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data: Creator[] = await res.json();
      setCreators(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [nicheFilters, langFilters, minRate, maxRate]);

  useEffect(() => { fetchCreators(); }, [fetchCreators]);

  const toggleNiche = (n: string) =>
    setNicheFilters((p) => p.includes(n) ? p.filter((x) => x !== n) : [...p, n]);
  const toggleLang = (l: string) =>
    setLangFilters((p) => p.includes(l) ? p.filter((x) => x !== l) : [...p, l]);

  // Client-side multi-filter + sort (API only supports single niche/lang)
  const filtered = creators
    .filter((c) => !nicheFilters.length || nicheFilters.some((n) => c.niches?.includes(n)))
    .filter((c) => !langFilters.length || langFilters.some((l) => c.languages?.includes(l)))
    .sort((a, b) => {
      if (sortBy === "rate") return (a.rate_per_reel ?? 0) - (b.rate_per_reel ?? 0);
      if (sortBy === "followers") return (b.follower_count ?? 0) - (a.follower_count ?? 0);
      return (b.avg_rating ?? 0) - (a.avg_rating ?? 0);
    });

  const chipStyle = (active: boolean) => ({
    display: "inline-flex", alignItems: "center", padding: "5px 12px",
    borderRadius: 999, border: "2px solid var(--ink)",
    background: active ? "var(--orange)" : "var(--bg-2)",
    color: active ? "#fff" : "var(--ink)",
    fontWeight: 700, fontSize: 12, cursor: "pointer",
    boxShadow: active ? "2px 2px 0 var(--ink)" : "none",
  } as React.CSSProperties);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--card)", borderBottom: "2px solid var(--ink)",
        padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, fontSize: 18,
            background: "var(--orange)", borderRadius: 8,
            border: "2px solid var(--ink)", boxShadow: "2px 2px 0 var(--ink)",
            transform: "rotate(-4deg)",
          }}>🎬</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink)" }}>ReelCraft</span>
        </Link>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{
            background: "var(--pink)", color: "#fff",
            fontSize: 10, fontWeight: 800, border: "1.5px solid var(--ink)",
            borderRadius: 999, padding: "2px 8px",
          }}>Marketplace</span>
          <Link href="/login" style={{
            fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 14,
            color: "var(--ink)", textDecoration: "none",
            border: "2px solid var(--ink)", borderRadius: 10,
            padding: "6px 16px", background: "var(--bg-2)",
            boxShadow: "2px 2px 0 var(--ink)",
          }}>Log in</Link>
        </div>
      </header>

      <div style={{ display: "flex", maxWidth: 1200, margin: "0 auto", padding: "28px 24px", gap: 24, alignItems: "flex-start" }}>
        {/* Filter sidebar */}
        <aside style={{
          width: 240, flexShrink: 0,
          background: "var(--card)", border: "2px solid var(--ink)",
          borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-md)",
          padding: "24px 18px",
          position: "sticky", top: 80,
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 20 }}>FILTERS</div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--orange-dark)", marginBottom: 10 }}>Niche</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {MP_NICHES.map((n) => (
                <span key={n} style={chipStyle(nicheFilters.includes(n))} onClick={() => toggleNiche(n)}>{n}</span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--orange-dark)", marginBottom: 10 }}>Language</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {MP_LANGUAGES.map((l) => (
                <span key={l} style={chipStyle(langFilters.includes(l))} onClick={() => toggleLang(l)}>{l}</span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--orange-dark)", marginBottom: 10 }}>Rate per video</div>
            {RATE_RANGES.map((r) => (
              <label key={r.label} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                <input type="radio" name="rate" checked={maxRate === r.max} onChange={() => setMaxRate(r.max)} style={{ accentColor: "var(--orange)" }} />
                {r.label}
              </label>
            ))}
          </div>
        </aside>

        {/* Results */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink-2)" }}>
              {loading ? "Loading…" : `${filtered.length} creators found`}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {(["rating", "followers", "rate"] as const).map((s) => (
                  <button key={s} onClick={() => setSortBy(s)} style={{
                    padding: "6px 12px", borderRadius: 8, cursor: "pointer",
                    fontWeight: 700, fontSize: 12, border: "2px solid var(--ink)",
                    background: sortBy === s ? "var(--orange)" : "var(--card)",
                    color: sortBy === s ? "#fff" : "var(--ink)",
                    boxShadow: sortBy === s ? "2px 2px 0 var(--ink)" : "none",
                  }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", border: "2px solid var(--ink)", borderRadius: 10, overflow: "hidden" }}>
                {(["grid", "list"] as const).map((v) => (
                  <button key={v} onClick={() => setViewMode(v)} style={{
                    padding: "6px 10px", cursor: "pointer", border: "none",
                    background: viewMode === v ? "var(--orange)" : "var(--card)",
                    color: viewMode === v ? "#fff" : "var(--ink)",
                    fontSize: 16,
                    borderRight: v === "grid" ? "2px solid var(--ink)" : "none",
                  }}>
                    {v === "grid" ? "▦" : "☰"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: "var(--pink)", color: "#fff", border: "2px solid var(--ink)", borderRadius: "var(--r-sm)", padding: "12px 16px", marginBottom: 16, fontWeight: 700, fontSize: 13 }}>
              Failed to load creators: {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{
              background: "var(--card)", border: "2px solid var(--ink)", borderRadius: "var(--r-md)",
              padding: "48px", textAlign: "center", boxShadow: "3px 3px 0 var(--ink)",
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 8 }}>NO CREATORS YET</div>
              <p style={{ color: "var(--ink-2)", fontSize: 14 }}>Be among the first to create a creator profile on ReelCraft marketplace.</p>
              <Link href="/marketplace/profile/setup" className="btn-hard" style={{ display: "inline-block", marginTop: 16, fontSize: 14, padding: "10px 20px" }}>
                Join as Creator →
              </Link>
            </div>
          )}

          <div style={viewMode === "grid" ? {
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16,
          } : {
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {filtered.map((c) => (
              <CreatorCard key={c.user_id} creator={c} listMode={viewMode === "list"} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatorCard({ creator: c, listMode }: { creator: Creator; listMode: boolean }) {
  const grad = gradForId(c.user_id);
  const displayName = c.name || "Creator";
  const handle = c.instagram_handle ? `@${c.instagram_handle}` : c.youtube_handle ? `@${c.youtube_handle}` : null;
  const rateRupees = c.rate_per_reel ? c.rate_per_reel / 100 : null;
  const niches = c.niches ?? [];
  const languages = c.languages ?? [];

  if (listMode) {
    return (
      <div style={{
        background: "var(--card)", border: "2px solid var(--ink)",
        borderRadius: "var(--r-md)", padding: "16px 20px",
        boxShadow: "3px 3px 0 var(--ink)",
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          border: "2px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 900, color: "#fff", flexShrink: 0,
        }} className={grad}>{displayName[0].toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{displayName}{c.is_verified && " ✓"}</div>
          {handle && <div style={{ fontSize: 13, color: "var(--muted)" }}>{handle}</div>}
          <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>{niches.join(" · ")}</div>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{formatFollowers(c.follower_count)}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>Followers</div>
          </div>
          {c.avg_rating && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{c.avg_rating.toFixed(1)}</div>
              <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>Rating</div>
            </div>
          )}
          {rateRupees && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>₹{(rateRupees / 1000).toFixed(0)}K</div>
              <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>/ video</div>
            </div>
          )}
        </div>
        <Link href="/login" style={{
          display: "inline-flex", alignItems: "center",
          background: "var(--orange)", color: "#fff",
          fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13,
          border: "2px solid var(--ink)", borderRadius: 10,
          boxShadow: "2px 2px 0 var(--ink)", padding: "8px 16px", textDecoration: "none",
        }}>Send brief →</Link>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--card)", border: "2px solid var(--ink)",
      borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-md)",
      overflow: "hidden",
    }}>
      <div className={`${grad} scanlines`} style={{
        height: 140, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 48, position: "relative", fontWeight: 900, color: "rgba(255,255,255,0.3)",
      }}>
        {displayName[0].toUpperCase()}
        <div style={{
          position: "absolute", top: 8, right: 8,
          background: "rgba(0,0,0,0.5)", color: "#fff",
          fontSize: 10, fontWeight: 800, borderRadius: 999, padding: "3px 8px",
          backdropFilter: "blur(4px)",
        }}>{c.is_verified ? "✓ Verified" : "Creator"}</div>
        <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 4 }}>
          {c.instagram_handle && <span style={{ background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "2px 6px" }}>📸 IG</span>}
          {c.youtube_handle && <span style={{ background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "2px 6px" }}>▶️ YT</span>}
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", border: "2px solid var(--ink)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900, flexShrink: 0,
          }} className={grad}>{displayName[0].toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>{displayName}{c.is_verified && " ✓"}</div>
            {handle && <div style={{ fontSize: 12, color: "var(--muted)" }}>{handle}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            {c.avg_rating
              ? <div style={{ fontSize: 13, fontWeight: 800, color: "var(--saffron)" }}>⭐ {c.avg_rating.toFixed(1)}</div>
              : <div style={{ fontSize: 12, color: "var(--muted)" }}>No rating yet</div>
            }
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.total_deals} deals</div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {niches.map((n) => (
            <span key={n} style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, border: "1.5px solid var(--ink)", padding: "2px 8px", background: "var(--bg-2)" }}>{n}</span>
          ))}
          {languages.map((l) => (
            <span key={l} style={{ fontSize: 11, fontWeight: 700, borderRadius: 999, border: "1.5px solid var(--ink)", padding: "2px 8px", background: "var(--orange-lt)", color: "var(--orange-dark)" }}>{l}</span>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          <div style={{ background: "var(--bg-2)", borderRadius: 8, padding: "8px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>{formatFollowers(c.follower_count)}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>Followers</div>
          </div>
          <div style={{ background: "var(--bg-2)", borderRadius: 8, padding: "8px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>{c.total_deals}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>Deals done</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            {rateRupees
              ? <><span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)" }}>₹{rateRupees.toLocaleString("en-IN")}</span><span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 4 }}>/ video</span></>
              : <span style={{ fontSize: 13, color: "var(--muted)" }}>Rate on request</span>
            }
          </div>
          <Link href="/login" style={{
            display: "inline-flex", alignItems: "center",
            background: "var(--orange)", color: "#fff",
            fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13,
            border: "2px solid var(--ink)", borderRadius: 10,
            boxShadow: "2px 2px 0 var(--ink)", padding: "8px 16px", textDecoration: "none",
          }}>Send brief →</Link>
        </div>
      </div>
    </div>
  );
}
