"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function DataDeletionStatus() {
  const params = useSearchParams();
  const id = params.get("id");

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--bg)", borderBottom: "2px solid var(--ink)",
        padding: "0 24px", height: 68, display: "flex", alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <span style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, fontSize: 18,
            background: "var(--orange)", borderRadius: 8,
            border: "2px solid var(--ink)", transform: "rotate(-4deg)",
          }}>🎬</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink)" }}>ReelCraft</span>
        </Link>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 600, margin: "80px auto", padding: "0 24px" }}>
        <div style={{
          background: "#fff", border: "2px solid var(--ink)", borderRadius: 16,
          boxShadow: "4px 4px 0 var(--ink)", padding: "48px 40px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>✅</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--ink)", marginBottom: 12 }}>
            Data Deletion Complete
          </h1>
          <p style={{ color: "var(--ink-muted)", lineHeight: 1.7, marginBottom: 24, fontSize: 15 }}>
            Your ReelCraft account data has been deleted as requested via Instagram. Your social tokens, account information, and generated content have been removed from our systems.
          </p>

          {id && (
            <div style={{
              background: "var(--bg)", border: "2px solid var(--ink)", borderRadius: 10,
              padding: "16px 20px", marginBottom: 24,
            }}>
              <p style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                Confirmation Code
              </p>
              <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, color: "var(--ink)", wordBreak: "break-all" }}>
                {id}
              </p>
            </div>
          )}

          <p style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 32, lineHeight: 1.6 }}>
            Keep your confirmation code for your records. If you have questions, contact us at{" "}
            <a href="mailto:nithishjprabhu@gmail.com" style={{ color: "var(--orange)", fontWeight: 700 }}>
              nithishjprabhu@gmail.com
            </a>
          </p>

          <Link href="/" style={{
            display: "inline-block", padding: "12px 28px",
            background: "var(--orange)", color: "#fff",
            border: "2px solid var(--ink)", borderRadius: 8,
            fontWeight: 800, fontSize: 14, textDecoration: "none",
            boxShadow: "3px 3px 0 var(--ink)",
          }}>
            Back to Home
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: "var(--ink)", padding: "40px 24px", marginTop: 80 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#fff" }}>ReelCraft</span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/privacy" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: 700 }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: 700 }}>Terms</Link>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>© 2026 ReelCraft. Built for Indian creators.</div>
        </div>
      </footer>
    </div>
  );
}

export default function DataDeletionPage() {
  return (
    <Suspense fallback={
      <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--ink-muted)" }}>Loading...</p>
      </div>
    }>
      <DataDeletionStatus />
    </Suspense>
  );
}
