"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/lib/api";
import AppShell from "@/components/AppShell";

export default function CreatePage() {
  const router = useRouter();
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const user = getStoredUser();
    if (!user) { router.push("/login"); }
  }, [router]);

  return (
    <AppShell>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px", display: "flex", flexDirection: "column", gap: 32, alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,3vw,38px)", color: "var(--ink)", marginBottom: 8 }}>
            WHAT TO CREATE?
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 15 }}>Choose your format — AI does the rest</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, width: "100%" }}>
          {[
            { type: "video",    emoji: "🎬", title: "Video Reel",   desc: "MP4 with AI voice + music", sub: "~45 seconds to generate" },
            { type: "image",    emoji: "📸", title: "Image Post",   desc: "1 hero JPG for Instagram",  sub: "~15 seconds to generate" },
            { type: "carousel", emoji: "🎠", title: "Carousel",     desc: "2–5 slides for Instagram",  sub: "~20 seconds to generate" },
          ].map((opt) => (
            <button
              key={opt.type}
              onClick={() => router.push(`/create/${opt.type}`)}
              style={{
                padding: "28px 20px", borderRadius: "var(--r-sm)", cursor: "pointer",
                border: "2px solid var(--ink)", background: "var(--card)",
                boxShadow: "3px 3px 0 var(--ink)", textAlign: "center",
                fontFamily: "var(--font-body)", transition: "all 0.08s ease",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translate(-1px,-1px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "4px 4px 0 var(--ink)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "3px 3px 0 var(--ink)";
              }}
            >
              <span style={{ fontSize: 40 }}>{opt.emoji}</span>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{opt.title}</div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 600 }}>{opt.desc}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
