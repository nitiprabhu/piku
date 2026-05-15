"use client";
import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearAuth, getStoredUser } from "@/lib/api";
import api from "@/lib/api";

const LANG_OPTIONS = [
  { value: "all",      flag: "🌍", label: "All" },
  { value: "hi",       flag: "🇮🇳", label: "हिंदी" },
  { value: "en",       flag: "🌐", label: "English" },
  { value: "hinglish", flag: "✨", label: "Hinglish" },
];

export const LangContext = createContext<{ lang: string; setLang: (l: string) => void }>({ lang: "all", setLang: () => {} });
export function useLang() { return useContext(LangContext); }

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState("all");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("rc_lang") : null;
    if (saved) setLangState(saved);
  }, []);
  const setLang = (l: string) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("rc_lang", l);
  };
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

const NAV = [
  { href: "/dashboard",   emoji: "🏠", label: "Dashboard",   badge: "" },
  { href: "/create",      emoji: "✨", label: "Create",       badge: "" },
  { href: "/templates",   emoji: "🎬", label: "Templates",    badge: "" },
  { href: "/marketplace", emoji: "💼", label: "Marketplace",  badge: "NEW" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser();
  const [credits, setCredits] = useState<{ remaining: number; plan: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { lang, setLang } = useLang();

  useEffect(() => {
    api.get("/user/credits").then((r) => setCredits(r.data)).catch(() => {});
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      style={{
        width: mobile ? "100%" : 240,
        background: "var(--card)",
        borderRight: mobile ? "none" : "2px solid var(--ink)",
        display: "flex",
        flexDirection: "column",
        height: mobile ? "auto" : "100vh",
        position: mobile ? "relative" : "sticky",
        top: 0,
        flexShrink: 0,
        padding: "24px 16px",
        gap: 8,
      }}
    >
      {/* Logo */}
      <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, textDecoration: "none" }}>
        <span style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 40, height: 40, fontSize: 20,
          background: "var(--orange)", borderRadius: 10,
          border: "2px solid var(--ink)", boxShadow: "2px 2px 0 var(--ink)",
          transform: "rotate(-4deg)", flexShrink: 0,
        }}>🎬</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          ReelCraft
        </span>
      </Link>

      {/* Nav items */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: "var(--r-sm)",
                textDecoration: "none",
                fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15,
                color: active ? "#fff" : "var(--ink)",
                background: active ? "var(--orange)" : "transparent",
                border: active ? "2px solid var(--ink)" : "2px solid transparent",
                boxShadow: active ? "3px 3px 0 var(--ink)" : "none",
                transition: "all 0.08s ease",
              }}
            >
              <span style={{ fontSize: 18 }}>{item.emoji}</span>
              {item.label}
              {item.badge && (
                <span style={{
                  marginLeft: "auto", background: "var(--pink)", color: "#fff",
                  fontSize: 9, fontWeight: 800, border: "1.5px solid var(--ink)",
                  borderRadius: 999, padding: "1px 6px", letterSpacing: "0.05em",
                }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <Link
          href="/pricing"
          onClick={() => setSidebarOpen(false)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: "var(--r-sm)",
            textDecoration: "none",
            fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 15,
            color: "var(--ink)", background: "transparent",
            border: "2px solid transparent",
          }}
        >
          <span style={{ fontSize: 18 }}>💎</span>Plans
        </Link>
      </nav>

      {/* Language picker */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 8, paddingLeft: 4 }}>
          Content Language
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {LANG_OPTIONS.map((l) => {
            const active = lang === l.value;
            return (
              <button key={l.value} onClick={() => setLang(l.value)} style={{
                padding: "7px 6px", borderRadius: "var(--r-sm)", cursor: "pointer",
                fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 12,
                border: "2px solid var(--ink)",
                background: active ? "var(--orange)" : "var(--bg-2)",
                color: active ? "#fff" : "var(--ink)",
                boxShadow: active ? "2px 2px 0 var(--ink)" : "none",
                transition: "all 0.08s ease",
              }}>
                {l.flag} {l.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Credits card */}
      {credits && (
        <div style={{
          background: "var(--bg-2)", border: "2px solid var(--ink)",
          borderRadius: "var(--r-md)", boxShadow: "3px 3px 0 var(--ink)",
          padding: "16px", marginTop: 8,
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--orange-dark)", marginBottom: 4 }}>
            Credits left
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 36, color: "var(--ink)", lineHeight: 1 }}>
            {credits.remaining}
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-2)", marginTop: 4, textTransform: "uppercase", fontWeight: 700 }}>
            {credits.plan} plan
          </div>
          {credits.plan === "free" && (
            <Link href="/pricing" style={{
              display: "block", marginTop: 10, textAlign: "center",
              fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 13,
              color: "#fff", background: "var(--orange)",
              border: "2px solid var(--ink)", borderRadius: "var(--r-sm)",
              boxShadow: "2px 2px 0 var(--ink)", padding: "6px 12px",
              textDecoration: "none",
            }}>
              Upgrade ↗
            </Link>
          )}
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14,
          color: "var(--muted)", padding: "8px 14px", textAlign: "left",
          borderRadius: "var(--r-sm)",
        }}
      >
        Logout →
      </button>
    </aside>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile header */}
      <div
        className="md:hidden"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "var(--card)", borderBottom: "2px solid var(--ink)",
          height: 60, display: "flex", alignItems: "center",
          padding: "0 16px", justifyContent: "space-between",
        }}
      >
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, fontSize: 16,
            background: "var(--orange)", borderRadius: 8,
            border: "2px solid var(--ink)", boxShadow: "2px 2px 0 var(--ink)",
            transform: "rotate(-4deg)",
          }}>🎬</span>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)" }}>ReelCraft</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "var(--ink)" }}
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div
          className="md:hidden"
          style={{
            position: "fixed", top: 60, left: 0, right: 0, bottom: 0,
            zIndex: 99, background: "var(--card)", borderTop: "2px solid var(--ink)",
            overflowY: "auto",
          }}
        >
          <Sidebar mobile />
        </div>
      )}

      {/* Main content */}
      <main
        style={{ flex: 1, minWidth: 0 }}
        className="md:pt-0 pt-[60px]"
      >
        {children}
      </main>
    </div>
  );
}
