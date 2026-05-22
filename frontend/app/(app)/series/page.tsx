"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface Series {
  id: string;
  name: string;
  topic: string;
  style: string;
  language: string;
  episode_count: number;
  created_at: string;
}

const STYLE_COLORS: Record<string, string> = {
  storytelling: "#8B5CF6",
  motivation: "#F59E0B",
  funny: "#EC4899",
  devotional: "#F97316",
  business: "#3B82F6",
  news: "#10B981",
};

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/series").then((r) => setSeriesList(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, color: "var(--ink)", margin: 0 }}>
            Series
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink-2)", marginTop: 6 }}>
            Generate episodic content with narrative continuity
          </p>
        </div>
        <Link
          href="/series/new"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 15,
            color: "#fff", background: "var(--orange)",
            border: "2px solid var(--ink)", borderRadius: "var(--r-sm)",
            boxShadow: "3px 3px 0 var(--ink)", padding: "10px 20px",
            textDecoration: "none",
          }}
        >
          + New Series
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, fontFamily: "var(--font-body)", color: "var(--ink-2)" }}>
          Loading...
        </div>
      ) : seriesList.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 24px",
          border: "2px dashed var(--ink)", borderRadius: "var(--r-md)",
          background: "var(--card)",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📺</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--ink)", marginBottom: 8 }}>
            No series yet
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink-2)", marginBottom: 24 }}>
            Create a series to generate episodic reels with connected story arcs
          </div>
          <Link
            href="/series/new"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 15,
              color: "#fff", background: "var(--orange)",
              border: "2px solid var(--ink)", borderRadius: "var(--r-sm)",
              boxShadow: "3px 3px 0 var(--ink)", padding: "10px 24px",
              textDecoration: "none",
            }}
          >
            Create First Series
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {seriesList.map((s) => (
            <Link
              key={s.id}
              href={`/series/${s.id}`}
              style={{ textDecoration: "none" }}
            >
              <div style={{
                background: "var(--card)", border: "2px solid var(--ink)",
                borderRadius: "var(--r-md)", boxShadow: "3px 3px 0 var(--ink)",
                padding: "20px 24px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                transition: "transform 0.08s ease, box-shadow 0.08s ease",
                cursor: "pointer",
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translate(-1px,-1px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "5px 5px 0 var(--ink)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "3px 3px 0 var(--ink)";
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink)" }}>
                      {s.name}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 800, fontFamily: "var(--font-mono)",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                      background: STYLE_COLORS[s.style] || "var(--orange)",
                      color: "#fff", padding: "2px 8px", borderRadius: 999,
                      border: "1.5px solid var(--ink)",
                    }}>
                      {s.style}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-2)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {s.topic}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--ink)" }}>
                    {s.episode_count}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>
                    episodes
                  </div>
                </div>
                <div style={{ color: "var(--ink-2)", fontSize: 20, flexShrink: 0 }}>→</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
