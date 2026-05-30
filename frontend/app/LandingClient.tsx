"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

/* ── Scroll fade hook ───────────────────────────────────────────────────── */
function useFadeIn(delay = 0) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return {
    ref,
    style: {
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : "translateY(24px)",
      transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
    } as React.CSSProperties,
  };
}

/* ── Mobile detect ──────────────────────────────────────────────────────── */
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

/* ── Sample data ────────────────────────────────────────────────────────── */
const SAMPLE_REELS = [
  { id: "r1", emoji: "💪", cap: "Mehnat ka phal meetha hota hai", grad: "reel-grad-1" },
  { id: "r2", emoji: "🕉️", cap: "Karmanye vadhikaraste...", grad: "reel-grad-3" },
  { id: "r3", emoji: "🪔", cap: "50% off — sirf aaj!", grad: "reel-grad-6" },
  { id: "r4", emoji: "😂", cap: "Beta jaldi karo!", grad: "reel-grad-2" },
  { id: "r5", emoji: "🚀", cap: "Crore kaise banaye", grad: "reel-grad-4" },
  { id: "r6", emoji: "📰", cap: "BREAKING: aaj ki khabar", grad: "reel-grad-5" },
  { id: "r7", emoji: "🇮🇳", cap: "Apna desh, apni shaan", grad: "reel-grad-6" },
  { id: "r8", emoji: "🍛", cap: "Aaj ka special: butter chicken", grad: "reel-grad-7" },
];

const HERO_COPY = [
  { kicker: "Reels se kamao", big: "Ek prompt → viral reel, abhi", sub: "AI script likhta hai, voice deta hai, video banata hai. Aap bas share karo.", emoji: "💰" },
  { kicker: "Followers badhao", big: "0 se viral, 60 second mein", sub: "AI-optimized hooks aur scripts se reach 10x karo. Hindi, English, Hinglish, Kannada.", emoji: "📈" },
  { kicker: "Time bachao", big: "Reel banao — editing nahi", sub: "Koi software nahi, koi stock footage nahi. Bas idea bolo — baki AI sambhal lega.", emoji: "⚡" },
  { kicker: "Business chamkao", big: "Daily promo reels, zero effort", sub: "Kirana, restaurant, salon — roz ek reel. Sales aur footfall badhao.", emoji: "🛍️" },
];

const TESTIMONIALS = [
  { name: "Rahul Sharma", handle: "@rahul.motivation", avatar: "🧔🏽", body: "Pehle 3 ghante lagte the ek reel banane mein. Ab 1 minute! Followers 2X ho gaye.", followers: "480K", tag: "Motivation" },
  { name: "Priya Didi", handle: "@priya.kitchen", avatar: "👩🏽‍🍳", body: "Mere recipe reels ab har din viral ho rahe hain. Brand deals bhi 5x increase 🔥", followers: "1.2M", tag: "Food" },
  { name: "Pandit Vinay", handle: "@daily.shloka", avatar: "🧔🏽‍♂️", body: "Shloka ka pronunciation perfect aata hai AI se. Devotional content ke liye game-changer.", followers: "890K", tag: "Devotional" },
  { name: "Karan Mehta", handle: "@karan.kirana", avatar: "🧑🏽‍💼", body: "Apni dukaan ke liye daily promo banata hu. Sales 40% badh gayi pichle 2 mahine mein.", followers: "34K", tag: "Business" },
  { name: "Anjali Rao", handle: "@anjali.fashion", avatar: "👩🏽", body: "Hinglish caption auto-generate hota hai. Itna time bachta hai ki ab 4 reels/day post karti hu.", followers: "230K", tag: "Fashion" },
  { name: "Dev Bhai", handle: "@dev.startup", avatar: "🧑🏽‍💻", body: "Founder huu aur khud edit karta tha. Ab AI sab kuch karta hai — focus on business.", followers: "92K", tag: "Startup" },
];

const FAQS = [
  { q: "Kya English bhi support karta hai?", a: "Haan! Hindi, English, Hinglish, aur Kannada (ಕನ್ನಡ) — char languages mein script + voiceover. Native accent Sarvam AI se." },
  { q: "Free plan mein kya milega?", a: "2 reels bilkul free — credit card ki zaroorat nahi. 4 AI scenes, Hindi + English + Hinglish + Kannada, download + share." },
  { q: "Watermark hatega?", a: "Pro plan (₹499/mo) ya First Reel (₹29 one-time) mein no watermark, plus 7 scenes per reel aur direct publish." },
  { q: "Mera business chhota hai, kaam aayega?", a: "Bilkul. Daily promo reels banao for kirana, restaurant, salon. Ek prompt — ek reel. Roz." },
  { q: "Generation kitni baar fail hoti hai?", a: "Bahut kam (<2%). Fail hone par credit automatic refund hota hai. WhatsApp support Hindi mein." },
];

/* ── Mobile Nav ─────────────────────────────────────────────────────────── */
function MobileNav() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  const links = [
    { href: "/marketplace", label: "💼 Marketplace", badge: "NEW" },
    { href: "/marketplace/search", label: "For Brands" },
    { href: "/pricing", label: "Pricing" },
    { href: "/login", label: "Log in" },
  ];
  return (
    <>
      <button onClick={() => setOpen(!open)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5 }} aria-label="Menu">
        <span style={{ display: "block", width: 24, height: 2.5, background: "var(--ink)", borderRadius: 2, transition: "all .2s", transform: open ? "rotate(45deg) translate(5px,5px)" : "none" }} />
        <span style={{ display: "block", width: 24, height: 2.5, background: "var(--ink)", borderRadius: 2, opacity: open ? 0 : 1, transition: "all .2s" }} />
        <span style={{ display: "block", width: 24, height: 2.5, background: "var(--ink)", borderRadius: 2, transition: "all .2s", transform: open ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
      </button>
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--bg)", display: "flex", flexDirection: "column", padding: "80px 24px 40px" }}>
          <button onClick={() => setOpen(false)} style={{ position: "absolute", top: 20, right: 20, background: "transparent", border: "none", fontSize: 28, cursor: "pointer", color: "var(--ink)" }}>✕</button>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            {links.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "18px 0", borderBottom: "1px solid var(--line)", fontSize: 22, fontWeight: 800, color: "var(--ink)", textDecoration: "none" }}>
                {l.label}
                {l.badge && <span style={{ fontSize: 10, fontWeight: 900, background: "var(--pink)", color: "#fff", padding: "2px 7px", borderRadius: 999 }}>{l.badge}</span>}
              </Link>
            ))}
          </div>
          <Link href="/login" className="btn-hard" style={{ fontSize: 18, padding: "16px", textAlign: "center" }} onClick={() => setOpen(false)}>
            🚀 Try Free — No CC
          </Link>
        </div>
      )}
    </>
  );
}

/* ── Hero section with dots ─────────────────────────────────────────────── */
const HERO_INTERVAL = 4500;

function HeroSection() {
  const [idx, setIdx] = useState(0);
  const [progress, setProgress] = useState(0); // phone reel progress
  const [dotProgress, setDotProgress] = useState(0); // 0–100 per hero slide
  const isMobile = useIsMobile();

  // Phone reel animation
  useEffect(() => {
    const t = setInterval(() => setProgress(p => p >= 100 ? 0 : p + 1.2), 80);
    return () => clearInterval(t);
  }, []);

  // Hero rotation
  useEffect(() => {
    setDotProgress(0);
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      setDotProgress(Math.min(100, (elapsed / HERO_INTERVAL) * 100));
    }, 50);
    const rotate = setTimeout(() => {
      setIdx(i => (i + 1) % HERO_COPY.length);
    }, HERO_INTERVAL);
    return () => { clearInterval(tick); clearTimeout(rotate); };
  }, [idx]);

  const hero = HERO_COPY[idx];

  return (
    <section style={{ position: "relative", overflow: "hidden", paddingTop: isMobile ? 24 : 32, paddingBottom: isMobile ? 40 : 64 }}>
      <span className="star" style={{ top: 60, left: "8%", color: "var(--orange)", fontSize: 24, display: isMobile ? "none" : "block" }}>✦</span>
      <span className="star" style={{ top: 200, right: "6%", color: "var(--pink)", fontSize: 24, animationDelay: ".4s", display: isMobile ? "none" : "block" }}>✦</span>
      <span className="caveat" style={{ position: "absolute", top: "12%", left: "46%", fontSize: 24, color: "var(--orange-dark)", transform: "rotate(-8deg)", pointerEvents: "none", display: isMobile ? "none" : "block" }}>
        ↗ try this!
      </span>

      <div className="container" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr", gap: isMobile ? 32 : 40, alignItems: "center", position: "relative", zIndex: 2 }}>
        <div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 22 }}>
            <span className="sticker sticker--orange wiggle">🇮🇳 Banaya Bharat ke creators ke liye</span>
            {!isMobile && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 999, background: "var(--card)", border: "2px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)", fontWeight: 800, fontSize: 13 }}>
                <span className="pulse-dot" />
                <span className="mono" style={{ color: "var(--orange-dark)", fontSize: 11 }}>EARLY ACCESS</span>
                <span style={{ color: "var(--ink-2)", fontSize: 12 }}>onboarding first creators 🚀</span>
              </div>
            )}
          </div>

          {/* Rotating headline */}
          <div key={idx} className="fade-up" style={{ minHeight: isMobile ? 200 : 260 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--orange-dark)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
              {hero.emoji} {hero.kicker}
            </div>
            <h1 className="display" style={{ fontSize: isMobile ? "clamp(40px,12vw,60px)" : "clamp(48px,7.6vw,88px)", margin: "0 0 18px", lineHeight: 0.95 }}>
              {hero.big}
            </h1>
            <p style={{ fontSize: isMobile ? 16 : 19, color: "var(--ink-2)", maxWidth: 520, lineHeight: 1.5, margin: 0 }}>
              {hero.sub}
            </p>
          </div>

          {/* Dot indicators */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 20, marginBottom: 24 }}>
            {HERO_COPY.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} style={{ padding: 0, background: "transparent", cursor: "pointer", width: i === idx ? 48 : 10, height: 10, borderRadius: 999, overflow: "hidden", position: "relative", border: "2px solid var(--ink)", transition: "width .3s ease", flexShrink: 0 } as React.CSSProperties}>
                <div style={{ position: "absolute", inset: 0, background: i < idx ? "var(--ink)" : "var(--bg-2)" }} />
                {i === idx && (
                  <div style={{ position: "absolute", inset: 0, background: "var(--orange)", width: `${dotProgress}%`, transition: "width .05s linear" }} />
                )}
              </button>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/login" className="btn-hard" style={{ fontSize: isMobile ? 16 : 17, padding: "14px 24px" }}>
              🚀 Try free — 2 reels
            </Link>
            <Link href="/marketplace/search" className="btn-hard ghost" style={{ fontSize: 14 }}>
              💼 I&apos;m a brand →
            </Link>
            {!isMobile && (
              <span className="caveat" style={{ fontSize: 18, color: "var(--ink-2)", position: "relative", paddingLeft: 24 }}>
                <span style={{ position: "absolute", left: 0, top: -4 }}>↙</span>
                no credit card!
              </span>
            )}
          </div>

          {/* Avatar strip */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24 }}>
            <div style={{ display: "flex" }}>
              {["🧔🏽","👩🏽‍🍳","🧑🏽‍💼","👩🏽","🧑🏽‍💻"].map((a, i) => (
                <div key={i} style={{ width: 34, height: 34, borderRadius: 999, background: ["var(--orange)","var(--saffron)","var(--pink)","var(--green)","#7B2CBF"][i], border: "2px solid var(--bg)", display: "grid", placeItems: "center", fontSize: 16, marginLeft: i === 0 ? 0 : -10 }}>{a}</div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 700 }}>
              Be among the first creators on ReelCraft
            </div>
          </div>
        </div>

        {/* Phone mockup — hidden on mobile, shown below */}
        {!isMobile && (
          <div style={{ display: "grid", placeItems: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: -16, right: 10, transform: "rotate(8deg)", zIndex: 3 }}>
              <span className="sticker sticker--pink wiggle" style={{ fontSize: 12 }}>made in 47 sec ⚡</span>
            </div>
            <div style={{ position: "absolute", bottom: 40, left: -10, transform: "rotate(-6deg)", zIndex: 3 }}>
              <span className="sticker sticker--green" style={{ fontSize: 12 }}>viral score 92 🔥</span>
            </div>
            <PhoneMock reelProgress={progress} />
          </div>
        )}
      </div>

      {/* Phone below on mobile */}
      {isMobile && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
          <PhoneMock reelProgress={progress} compact />
        </div>
      )}
    </section>
  );
}

function PhoneMock({ reelProgress, compact }: { reelProgress: number; compact?: boolean }) {
  const size = compact ? { w: 200, h: 380, br: 32, pad: 8 } : { w: 280, h: 560, br: 44, pad: 10 };
  return (
    <div style={{ width: size.w, height: size.h, borderRadius: size.br, background: "#0e0a06", padding: size.pad, position: "relative", overflow: "hidden", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.06), 0 30px 60px rgba(26,20,16,.28), 0 12px 24px rgba(255,87,34,.18)" }}>
      <div style={{ position: "absolute", top: compact ? 10 : 14, left: "50%", transform: "translateX(-50%)", width: compact ? 70 : 100, height: compact ? 16 : 24, background: "#000", borderRadius: compact ? 10 : 14, zIndex: 4 }} />
      <div style={{ position: "absolute", inset: compact ? 8 : 10, borderRadius: compact ? 26 : 36, overflow: "hidden", background: "#111" }}>
        <div className="stripes scanlines reel-grad-1" style={{ width: "100%", height: "100%", position: "relative" }}>
          <div style={{ position: "absolute", top: compact ? 24 : 32, left: 8, right: 8, display: "flex", justifyContent: "space-between", color: "#fff", fontWeight: 700, fontSize: compact ? 10 : 12 }}>
            <span style={{ borderBottom: "2px solid #fff", paddingBottom: 2, opacity: .9 }}>For You</span>
            <span style={{ opacity: .8 }}>🔍</span>
          </div>
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
            <span style={{ fontSize: compact ? 52 : 72, filter: "drop-shadow(0 4px 16px rgba(0,0,0,.4))" }}>🎬</span>
          </div>
          <div style={{ position: "absolute", left: 8, right: compact ? 44 : 56, bottom: compact ? 50 : 70, color: "#fff" }}>
            <div style={{ fontWeight: 800, fontSize: compact ? 10 : 13, marginBottom: 3 }}>@reelcraft.ai</div>
            <div className="hindi" style={{ fontSize: compact ? 9 : 11, lineHeight: 1.3, opacity: .9 }}>AI se banao viral reels ⚡</div>
          </div>
          <div style={{ position: "absolute", right: 6, bottom: compact ? 50 : 70, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", color: "#fff", fontSize: compact ? 8 : 10, fontWeight: 700 }}>
            {[["❤️","184K"],["💬","3.2K"],["↗️",""]].map(([e,c]) => (
              <div key={e} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <div style={{ width: compact ? 24 : 32, height: compact ? 24 : 32, borderRadius: 999, background: "rgba(0,0,0,.3)", display: "grid", placeItems: "center", fontSize: compact ? 12 : 16 }}>{e}</div>
                {c && <span>{c}</span>}
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", bottom: compact ? 10 : 12, left: 8, right: 8, height: 2.5, background: "rgba(255,255,255,.2)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${reelProgress}%`, background: "#fff", transition: "width .1s linear" }} />
          </div>
          <div style={{ position: "absolute", top: compact ? 44 : 64, right: 6, background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)", padding: "2px 5px", borderRadius: 4, color: "#fff", fontSize: compact ? 7 : 9, fontWeight: 800 }}>
            ✨ ReelCraft
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stats strip ────────────────────────────────────────────────────────── */
function StatsStrip() {
  const { ref, style } = useFadeIn();
  const stats = [
    { n: "~60s", l: "generation time" },
    { n: "4", l: "Indian languages" },
    { n: "8", l: "content styles" },
    { n: "7", l: "AI scenes (Pro)" },
    { n: "9:16", l: "native vertical" },
    { n: "₹29", l: "to start" },
  ];
  return (
    <section ref={ref as React.RefObject<HTMLElement>} style={{ ...style, background: "var(--ink)", borderTop: "2px solid var(--line)", borderBottom: "2px solid var(--line)", padding: "24px 0" }}>
      <div className="container">
        <div style={{ display: "flex", gap: 0, justifyContent: "space-between", flexWrap: "wrap" }}>
          {stats.map((s, i) => (
            <div key={s.l} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 16px", flex: "1 1 100px", borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
              <span className="display" style={{ fontSize: 32, color: "var(--orange)", lineHeight: 1 }}>{s.n}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4, textAlign: "center" }}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Marquee ────────────────────────────────────────────────────────────── */
function MiniReelCard({ reel }: { reel: typeof SAMPLE_REELS[0] }) {
  return (
    <div className={`stripes ${reel.grad}`} style={{ width: 144, height: 256, borderRadius: 16, border: "2px solid var(--ink)", boxShadow: "4px 4px 0 var(--ink)", flexShrink: 0, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 56 }}>{reel.emoji}</div>
      <div style={{ position: "absolute", bottom: 12, left: 10, right: 10, color: "#fff" }}>
        <div className="hindi" style={{ fontSize: 11, lineHeight: 1.3, fontWeight: 800, textShadow: "0 1px 4px rgba(0,0,0,.6)" }}>{reel.cap}</div>
      </div>
    </div>
  );
}

function ReelMarquee({ speed = "60s" }: { speed?: string }) {
  const doubled = [...SAMPLE_REELS, ...SAMPLE_REELS];
  return (
    <div className="marquee">
      <div className="marquee__track" style={{ "--speed": speed } as never}>
        {doubled.map((r, i) => <MiniReelCard key={i} reel={r} />)}
      </div>
      <div className="marquee__track" style={{ "--speed": speed } as never} aria-hidden>
        {doubled.map((r, i) => <MiniReelCard key={"b"+i} reel={r} />)}
      </div>
    </div>
  );
}

/* ── FAQ accordion ──────────────────────────────────────────────────────── */
function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ background: "var(--card)", borderRadius: 14, border: "2px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)", padding: "16px 20px" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", padding: 0, fontSize: 16, fontWeight: 800, textAlign: "left", cursor: "pointer", fontFamily: "var(--font-body)", color: "var(--ink)", gap: 12 }}>
        <span>{q}</span>
        <span style={{ fontSize: 22, color: "var(--orange)", flexShrink: 0 }}>{open ? "−" : "+"}</span>
      </button>
      {open && <p style={{ margin: "12px 0 0", color: "var(--ink-2)", lineHeight: 1.6, fontSize: 14 }}>{a}</p>}
    </div>
  );
}

/* ── Niche cards ────────────────────────────────────────────────────────── */
const NICHES = [
  { e: "😂", l: "Comedy", bg: "linear-gradient(135deg,#7C2D12,#EA580C)", c: "#FFEDD5" },
  { e: "🙏", l: "Devotional", bg: "linear-gradient(135deg,#78350F,#D97706)", c: "#FEF3C7" },
  { e: "🔥", l: "Motivation", bg: "linear-gradient(135deg,#7F1D1D,#DC2626)", c: "#FEE2E2" },
  { e: "💼", l: "Business", bg: "linear-gradient(135deg,#0C4A6E,#0284C7)", c: "#E0F2FE" },
  { e: "📰", l: "News", bg: "linear-gradient(135deg,#1E3A5F,#2563EB)", c: "#DBEAFE" },
  { e: "📖", l: "Storytelling", bg: "linear-gradient(135deg,#2D1B4E,#6B21A8)", c: "#E9D5FF" },
  { e: "🔮", l: "Mystery", bg: "linear-gradient(135deg,#1C1917,#7C3AED)", c: "#DDD6FE" },
  { e: "🧠", l: "Facts", bg: "linear-gradient(135deg,#0C4A6E,#0891B2)", c: "#E0F2FE" },
];

/* ── Marketplace preview tabs ───────────────────────────────────────────── */
const MP_BRIEFS = [
  { id: "b1", brand: "FitFlex", logo: "💪", color: "#FF5722", title: "Funny gym reels for app launch", budget: 15, num: 5, timeline: 7, match: 94 },
  { id: "b2", brand: "Spice & Co.", logo: "🌶️", color: "#D32F2F", title: "Recipe reels using our masala", budget: 12, num: 3, timeline: 10, match: 88 },
  { id: "b3", brand: "TempleApp", logo: "🕉️", color: "#FF9800", title: "Daily shloka campaign — 7 reels", budget: 8, num: 7, timeline: 14, match: 91 },
  { id: "b4", brand: "Vidya Edu", logo: "📚", color: "#7B2CBF", title: "NEET prep motivation reels", budget: 10, num: 4, timeline: 8, match: 86 },
];

const MP_CREATORS = [
  { id: "c1", name: "Rahul Sharma", handle: "@rahul.motivation", avatar: "🧔🏽", grad: "reel-grad-1", sampleEmoji: "💪", followers: "480K", rating: 4.9, rate: 12, niches: ["Motivation","Business"] },
  { id: "c2", name: "Priya Didi", handle: "@priya.kitchen", avatar: "👩🏽‍🍳", grad: "reel-grad-2", sampleEmoji: "🍳", followers: "1.2M", rating: 4.8, rate: 25, niches: ["Food","Lifestyle"] },
  { id: "c3", name: "Pandit Vinay", handle: "@daily.shloka", avatar: "🧔🏽‍♂️", grad: "reel-grad-3", sampleEmoji: "🕉️", followers: "890K", rating: 5.0, rate: 18, niches: ["Devotional"] },
  { id: "c4", name: "Anjali Rao", handle: "@anjali.fashion", avatar: "👩🏽", grad: "reel-grad-4", sampleEmoji: "👗", followers: "230K", rating: 4.7, rate: 9, niches: ["Fashion"] },
];

function MarketplacePreviewTabs() {
  const [side, setSide] = useState<"creator" | "brand">("creator");
  const isMobile = useIsMobile();
  return (
    <div style={{ background: "var(--bg)", color: "var(--ink)", borderRadius: 24, border: "2px solid var(--bg)", boxShadow: "8px 8px 0 var(--orange)", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "2px solid var(--ink)", background: "var(--bg-2)", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 4, background: "var(--card)", padding: 4, borderRadius: 10, border: "2px solid var(--ink)" }}>
          {[{ id: "creator", label: "🎬 Live briefs" }, { id: "brand", label: "💼 Top creators" }].map(s => (
            <button key={s.id} onClick={() => setSide(s.id as never)} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: side === s.id ? "var(--ink)" : "transparent", color: side === s.id ? "var(--bg)" : "var(--ink)", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>
              {s.label}
            </button>
          ))}
        </div>
        <Link href={side === "creator" ? "/marketplace" : "/marketplace/search"} style={{ color: "var(--orange-dark)", fontWeight: 800, fontSize: 13, textDecoration: "none" }}>
          See all →
        </Link>
      </div>
      <div style={{ padding: 20 }}>
        {side === "creator" ? (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
            {MP_BRIEFS.map(b => (
              <div key={b.id} style={{ background: "var(--card)", borderRadius: 14, border: "2px solid var(--ink)", boxShadow: "4px 4px 0 var(--ink)", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 7, background: b.color, color: "#fff", display: "grid", placeItems: "center", fontSize: 16, border: "2px solid var(--ink)", flexShrink: 0 }}>{b.logo}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.brand}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 900, color: "var(--orange-dark)", background: "var(--bg-2)", padding: "2px 5px", borderRadius: 4, flexShrink: 0 }}>🎯{b.match}%</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 900, lineHeight: 1.3 }}>{b.title}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ink-2)", fontWeight: 700, paddingTop: 6, borderTop: "1px dashed var(--line)" }}>
                  <span>₹{b.budget}K/reel</span><span>×{b.num}</span><span>{b.timeline}d</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12 }}>
            {MP_CREATORS.map(c => (
              <div key={c.id} style={{ background: "var(--card)", borderRadius: 14, border: "2px solid var(--ink)", boxShadow: "4px 4px 0 var(--ink)", padding: 12, display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-2)", border: "2px solid var(--ink)", display: "grid", placeItems: "center", fontSize: 16 }}>{c.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                    <div style={{ fontSize: 9, color: "var(--muted)" }}>{c.handle}</div>
                  </div>
                </div>
                <div className={`stripes ${c.grad}`} style={{ aspectRatio: "4/3", borderRadius: 7, border: "1.5px solid var(--ink)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 28 }}>{c.sampleEmoji}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, paddingTop: 5, borderTop: "1px dashed var(--line)" }}>
                  <span style={{ color: "var(--ink-2)", fontWeight: 700 }}>{c.followers} ⭐{c.rating}</span>
                  <span className="display" style={{ fontSize: 12, color: "var(--orange-dark)" }}>₹{c.rate}K</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Fade wrapper helper ─────────────────────────────────────────────────── */
function FadeSection({ children, delay = 0, style: extStyle }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, style } = useFadeIn(delay);
  return (
    <section ref={ref as React.RefObject<HTMLElement>} style={{ ...style, ...extStyle }}>
      {children}
    </section>
  );
}

/* ── Main landing ───────────────────────────────────────────────────────── */
export default function LandingClient() {
  const isMobile = useIsMobile();

  return (
    <div style={{ background: "var(--bg)", overflowX: "hidden" }}>

      {/* ── HEADER ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "color-mix(in oklab, var(--bg) 88%, transparent)", backdropFilter: "blur(12px)", borderBottom: "2px solid var(--ink)" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--orange)", border: "2px solid var(--ink)", boxShadow: "2px 2px 0 var(--ink)", display: "grid", placeItems: "center", transform: "rotate(-4deg)" }}>
              <span style={{ fontSize: 18 }}>🎬</span>
            </div>
            <span className="display" style={{ fontSize: 22 }}>ReelCraft</span>
          </Link>

          {/* Desktop nav */}
          {!isMobile && (
            <nav style={{ display: "flex", gap: 22, alignItems: "center" }}>
              <Link href="/marketplace" style={{ color: "var(--ink)", textDecoration: "none", fontWeight: 700, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 5 }}>
                💼 Marketplace
                <span style={{ fontSize: 9, fontWeight: 900, background: "var(--pink)", color: "#fff", padding: "2px 6px", borderRadius: 999 }}>NEW</span>
              </Link>
              <Link href="/marketplace/search" style={{ color: "var(--ink)", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>For Brands</Link>
              <Link href="/pricing" style={{ color: "var(--ink)", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>Pricing</Link>
              <Link href="/login" style={{ color: "var(--ink)", textDecoration: "none", fontWeight: 700, fontSize: 14 }}>Log in</Link>
              <Link href="/login" className="btn-hard" style={{ padding: "10px 18px", fontSize: 14 }}>🚀 Try Free</Link>
            </nav>
          )}

          {/* Mobile: CTA + hamburger */}
          {isMobile && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Link href="/login" className="btn-hard" style={{ padding: "8px 14px", fontSize: 13 }}>🚀 Try Free</Link>
              <MobileNav />
            </div>
          )}
        </div>
      </header>

      {/* ── HERO ── */}
      <HeroSection />

      {/* ── STATS STRIP ── */}
      <StatsStrip />

      {/* ── BUILT FOR BHARAT / NICHE CARDS ── */}
      <FadeSection style={{ padding: "56px 0", borderBottom: "2px solid var(--line)", background: "var(--bg-2)" }}>
        <div className="container">
          <p style={{ textAlign: "center", fontSize: 12, fontWeight: 800, letterSpacing: "0.1em", color: "var(--ink-2)", textTransform: "uppercase", marginBottom: 24 }}>
            8 content niches · create anything
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4,1fr)" : "repeat(8,1fr)", gap: 10 }}>
            {NICHES.map(n => (
              <div key={n.l} style={{ borderRadius: 12, overflow: "hidden", border: "2px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)", aspectRatio: "1", position: "relative", background: n.bg, cursor: "default" }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <span style={{ fontSize: isMobile ? 22 : 28 }}>{n.e}</span>
                  <span style={{ fontSize: isMobile ? 8 : 10, fontWeight: 900, color: n.c, textAlign: "center", padding: "0 4px", lineHeight: 1.2 }}>{n.l}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── HOW IT WORKS ── */}
      <FadeSection style={{ padding: "80px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>3 STEPS · 60 SECONDS</div>
            <h2 className="display" style={{ fontSize: "clamp(32px,5vw,60px)", margin: "0 0 12px" }}>
              Type karo, <span style={{ color: "var(--orange)" }}>AI banaye</span>, viral ho jao
            </h2>
            <p style={{ color: "var(--ink-2)", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
              No editing, no mic, no stock footage hunt. Bas idea bolo — baki AI sambhal lega.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 24 }}>
            {[
              { n: 1, emoji: "✍️", title: "Idea likho", desc: "Hindi, English ya Hinglish — jaisa aata hai. Ek line bhi kafi hai.", accent: "var(--orange)" },
              { n: 2, emoji: "🎙️", title: "Style + voice chuno", desc: "Funny, devotional, motivation — 8 styles. 6 voices. 6 AI characters.", accent: "var(--saffron)" },
              { n: 3, emoji: "🚀", title: "Publish karo", desc: "Direct Instagram & YouTube. Caption + hashtags AI ready.", accent: "var(--pink)" },
            ].map((s, i) => (
              <FadeSection key={s.n} delay={i * 120} style={{ background: "var(--card)", borderRadius: 24, border: "2px solid var(--ink)", boxShadow: "8px 8px 0 var(--ink)", padding: 28, position: "relative" }}>
                <div style={{ position: "absolute", top: -16, left: 24, background: s.accent, color: "#fff", width: 44, height: 44, borderRadius: 12, border: "2px solid var(--ink)", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 17, transform: "rotate(-4deg)", boxShadow: "3px 3px 0 var(--ink)" }}>
                  0{s.n}
                </div>
                <div style={{ fontSize: 48, marginBottom: 14, marginTop: 12 }}>{s.emoji}</div>
                <h3 style={{ fontSize: 22, margin: "0 0 8px", fontWeight: 900 }}>{s.title}</h3>
                <p style={{ color: "var(--ink-2)", lineHeight: 1.5, margin: 0, fontSize: 14 }}>{s.desc}</p>
              </FadeSection>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── DARK MARQUEE ── */}
      <section style={{ padding: "40px 0 80px", background: "var(--ink)", color: "var(--bg)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span className="sticker sticker--saffron" style={{ marginBottom: 12 }}>🔥 Trending right now</span>
          <h2 className="display" style={{ fontSize: "clamp(28px,5vw,52px)", margin: "12px 0 8px", color: "var(--bg)" }}>
            Reels banaye AI ne — viral kiye creators ne
          </h2>
        </div>
        <ReelMarquee speed="50s" />
        <div style={{ marginTop: 20 }}><ReelMarquee speed="80s" /></div>
      </section>

      {/* ── OPPORTUNITY LEVERS ── */}
      <FadeSection style={{ padding: "80px 0", background: "var(--bg-2)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>💰 KYUN BANAYE?</div>
            <h2 className="display" style={{ fontSize: "clamp(28px,5vw,52px)", margin: "0 0 12px" }}>
              Posting consistently <span style={{ color: "var(--orange)" }}>opens doors</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 16 }}>
            {[
              { icon: "🤝", title: "Brand deals", sub: "Daily reels = stronger pitch. Consistent creators sign brand deals faster.", kpi: "60s", kpiLabel: "per reel", rotate: -2 },
              { icon: "📈", title: "Algorithm", sub: "Frequency wins. More posts → more viral chances on Reels & Shorts.", kpi: "9:16", kpiLabel: "native format", rotate: 1 },
              { icon: "🎯", title: "Audience", sub: "Hindi, English, Hinglish, Kannada — speak directly in your audience's language.", kpi: "4", kpiLabel: "languages", rotate: -1 },
              { icon: "🔁", title: "Repurpose", sub: "One prompt → Instagram, Shorts, WhatsApp Status, X — one click each.", kpi: "4+", kpiLabel: "platforms", rotate: 2 },
            ].map(c => (
              <div key={c.title} style={{ transform: `rotate(${c.rotate}deg)` }}>
                <div style={{ background: "var(--card)", border: "2px solid var(--ink)", borderRadius: 20, boxShadow: "5px 5px 0 var(--ink)", padding: 20 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{c.icon}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 900, margin: "0 0 6px" }}>{c.title}</h3>
                  <p style={{ color: "var(--ink-2)", fontSize: 12, lineHeight: 1.5, margin: "0 0 14px" }}>{c.sub}</p>
                  <div style={{ borderTop: "2px dashed var(--line)", paddingTop: 12, display: "flex", alignItems: "baseline", gap: 5 }}>
                    <span className="display" style={{ fontSize: 32, color: "var(--orange)" }}>{c.kpi}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>{c.kpiLabel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── MARKETPLACE ── */}
      <section style={{ padding: "100px 0", background: "var(--ink)", color: "var(--bg)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 40, right: "5%", fontSize: 120, opacity: .04 }}>💼</div>
        <div style={{ position: "absolute", bottom: 60, left: "3%", fontSize: 80, opacity: .04 }}>🤝</div>
        <div className="container" style={{ position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span className="sticker sticker--pink wiggle">🔥 ALL-NEW · Influencer Marketplace</span>
            <h2 className="display" style={{ fontSize: "clamp(32px,6vw,68px)", margin: "16px 0 12px", color: "var(--bg)" }}>
              Reels banao. <span style={{ color: "var(--orange)" }}>Brands se paisa kamao.</span>
            </h2>
            <p style={{ fontSize: 17, color: "var(--muted)", maxWidth: 620, margin: "0 auto", lineHeight: 1.5 }}>
              India&apos;s first Hindi-first creator marketplace. Creators keep 86% of every deal. Razorpay-protected escrow.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 40 }}>
            {[
              { kicker: "🎬 For Creators", big: "Get paid to do what you already do.", sub: "Set up profile in 5 min. Brands matching your niche send briefs directly.", cta: "Join as creator →", ctaSub: "Free · 5 min setup", href: "/marketplace", accent: "var(--orange)", textOnAccent: "#fff", bullets: [["🤝","Verified brand briefs"],["💰","Keep 86% of every deal"],["🔒","Razorpay escrow"],["⭐","Viral reels = portfolio"]] },
              { kicker: "💼 For Brands", big: "Find Hindi creators by niche, not followers.", sub: "Post a brief in 2 min. AI matches top creators. 50/50 escrow protects both sides.", cta: "Search creators →", ctaSub: "No signup · Browse free", href: "/marketplace/search", accent: "var(--saffron)", textOnAccent: "var(--ink)", bullets: [["🎯","AI matching, 9 niches"],["🇮🇳","Hindi · English · Kannada"],["⚡","< 24h creator response"],["🛡️","Escrow · zero fraud"]] },
            ].map(c => (
              <div key={c.kicker} style={{ background: "var(--bg)", color: "var(--ink)", borderRadius: 24, border: "3px solid var(--bg)", boxShadow: `10px 10px 0 ${c.accent}`, padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: c.accent, color: c.textOnAccent, border: "2px solid var(--ink)", boxShadow: "2px 2px 0 var(--ink)", fontWeight: 800, fontSize: 13, alignSelf: "flex-start" }}>
                  {c.kicker}
                </div>
                <h3 className="display" style={{ fontSize: "clamp(22px,3vw,38px)", margin: 0, lineHeight: 1 }}>{c.big}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, margin: 0 }}>{c.sub}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {c.bullets.map(([e, l]) => (
                    <div key={l as string} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 9px", background: "var(--bg-2)", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "1.5px solid var(--line-strong)" }}>
                      <span style={{ fontSize: 14 }}>{e}</span>{l}
                    </div>
                  ))}
                </div>
                <Link href={c.href} className="btn-hard" style={{ background: c.accent, color: c.textOnAccent, fontSize: 15, padding: "12px 18px", alignSelf: "flex-start", marginTop: 4 }}>
                  {c.cta}
                </Link>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>{c.ctaSub}</div>
              </div>
            ))}
          </div>

          <MarketplacePreviewTabs />

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginTop: 32 }}>
            {[
              { n: 1, e: "👤", t: "Profile / Brief", d: "5 min each" },
              { n: 2, e: "🎯", t: "AI matches", d: "By niche, language, budget" },
              { n: 3, e: "🔒", t: "50/50 escrow", d: "Razorpay holds upfront" },
              { n: 4, e: "⭐", t: "Deliver + rate", d: "Approve, rate, repeat" },
            ].map(s => (
              <div key={s.n} style={{ background: "var(--bg-2)", color: "var(--ink)", borderRadius: 14, padding: 14, border: "2px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 999, background: "var(--orange)", color: "#fff", fontSize: 10, fontWeight: 900, display: "grid", placeItems: "center", flexShrink: 0 }}>{s.n}</span>
                  <span style={{ fontSize: 20 }}>{s.e}</span>
                </div>
                <div style={{ fontWeight: 900, fontSize: 14 }}>{s.t}</div>
                <div style={{ fontSize: 11, color: "var(--ink-2)", marginTop: 2 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <FadeSection style={{ padding: "100px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>WHY REELCRAFT</div>
            <h2 className="display" style={{ fontSize: "clamp(28px,5vw,52px)", margin: "0 0 12px" }}>
              Sab kuch ek jagah — <span style={{ color: "var(--orange)" }}>60 second mein</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3,1fr)", gap: 16 }}>
            {[
              { emoji: "🎬", title: "GPT-4o script", desc: "Hooks jo viewers ko ruka de. Hindi pronunciation perfect. Viral formula built-in.", accent: false },
              { emoji: "🎙️", title: "Native Indian voice", desc: "Sarvam AI — natural pacing, Hindi + Kannada native accent. No robot vibe.", accent: true },
              { emoji: "🎥", title: "Cinematic video", desc: "gpt-image-1 + Ken Burns — scene-by-scene auto generated. 9:16 native.", accent: false },
              { emoji: "🎵", title: "Mood music", desc: "Auto background music. Royalty free. Ducked under voice.", accent: false },
              { emoji: "📝", title: "Optional captions", desc: "Burnt-in subtitles, Devanagari & English. Bold viral style. Toggle off for clean video.", accent: true },
              { emoji: "📲", title: "1-click publish", desc: "Instagram Reels + YouTube Shorts. Caption + hashtags AI-generated.", accent: false },
            ].map(f => (
              <div key={f.title} style={{ background: f.accent ? "var(--orange)" : "var(--card)", color: f.accent ? "#fff" : "var(--ink)", borderRadius: 18, border: "2px solid var(--ink)", boxShadow: "5px 5px 0 var(--ink)", padding: 22, transition: "transform .08s ease, box-shadow .08s ease" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translate(-2px,-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "7px 7px 0 var(--ink)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "5px 5px 0 var(--ink)"; }}
              >
                <div style={{ fontSize: 40, marginBottom: 10 }}>{f.emoji}</div>
                <h3 style={{ fontSize: 18, margin: "0 0 6px", fontWeight: 900 }}>{f.title}</h3>
                <p style={{ opacity: f.accent ? .9 : 1, color: f.accent ? "#fff" : "var(--ink-2)", lineHeight: 1.5, margin: 0, fontSize: 13 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── TESTIMONIALS ── */}
      <FadeSection style={{ padding: "80px 0", background: "var(--bg-2)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>❤️ KYA KEHTE HAIN?</div>
            <h2 className="display" style={{ fontSize: "clamp(28px,5vw,48px)", margin: "0 0 8px" }}>Creators ka pyaar</h2>
          </div>
          <div style={{ columns: isMobile ? 1 : 3, columnGap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={t.handle} style={{ breakInside: "avoid", marginBottom: 20, background: "var(--card)", borderRadius: 18, border: "2px solid var(--ink)", boxShadow: "5px 5px 0 var(--ink)", padding: 20, transform: `rotate(${[-1.5,1,-0.5,1.5,-1,0.5][i%6]}deg)` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 999, background: "var(--bg-2)", border: "2px solid var(--ink)", display: "grid", placeItems: "center", fontSize: 22 }}>{t.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-2)" }}>{t.handle} · {t.followers}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "var(--orange-dark)", background: "var(--bg-2)", padding: "3px 7px", borderRadius: 6, flexShrink: 0 }}>{t.tag}</span>
                </div>
                <p style={{ margin: 0, lineHeight: 1.5, fontSize: 13, color: "var(--ink)" }}>&quot;{t.body}&quot;</p>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── PRICING TEASER ── */}
      <FadeSection style={{ padding: "100px 0" }}>
        <div className="container">
          <div style={{ background: "var(--orange)", color: "#fff", borderRadius: 32, border: "3px solid var(--ink)", boxShadow: "12px 12px 0 var(--ink)", padding: isMobile ? 32 : 56, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 16, right: 24, fontSize: 72, opacity: .1 }}>🚀</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 32, alignItems: "center" }}>
              <div>
                <span className="sticker sticker--saffron" style={{ marginBottom: 16 }}>⚡ FREE FOREVER</span>
                <h2 className="display" style={{ fontSize: isMobile ? "clamp(32px,9vw,48px)" : "clamp(36px,5vw,60px)", margin: "12px 0 14px", color: "#fff", textShadow: "4px 4px 0 var(--ink)" }}>
                  2 reels free.<br />Pro ₹499/mo.
                </h2>
                <p style={{ fontSize: 16, opacity: .92, maxWidth: 400, lineHeight: 1.5 }}>
                  60 videos/month, 7 AI scenes, native Indian voice, auto-publish to Instagram & YouTube.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Link href="/login" className="btn-hard ghost" style={{ background: "#fff", fontSize: 16, padding: "14px 24px", color: "var(--orange-dark)" }}>
                  Start free →
                </Link>
                <Link href="/pricing" className="btn-hard" style={{ background: "var(--ink)", color: "#fff", fontSize: 14 }}>
                  Compare plans
                </Link>
              </div>
            </div>
          </div>
        </div>
      </FadeSection>

      {/* ── FAQ ── */}
      <FadeSection style={{ padding: "60px 0 100px" }}>
        <div className="container" style={{ maxWidth: 780 }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>FAQ</div>
            <h2 className="display" style={{ fontSize: "clamp(26px,4vw,44px)", margin: 0 }}>Sawaal hain? Jawab yahan.</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQS.map((f, i) => <FaqItem key={i} {...f} defaultOpen={i === 0} />)}
          </div>
        </div>
      </FadeSection>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "80px 0", background: "var(--ink)", color: "var(--bg)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, fontSize: 180, lineHeight: 0.9, display: "flex", flexWrap: "wrap", gap: 16, padding: 16, pointerEvents: "none" }}>
          🎬 🚀 ⚡ 🔥 💰 🎙️ 📈 🎵 ✨ 🎬 🚀 ⚡ 🔥
        </div>
        <div className="container" style={{ position: "relative" }}>
          <h2 className="display" style={{ fontSize: isMobile ? "clamp(40px,12vw,64px)" : "clamp(44px,8vw,88px)", margin: "0 0 16px", color: "var(--bg)" }}>
            Ek prompt.<br />Ek viral reel. <span style={{ color: "var(--orange)" }}>Ab.</span>
          </h2>
          <p style={{ fontSize: 17, color: "var(--muted)", maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.5 }}>
            Free mein try karo — credit card ki zaroorat nahi.
          </p>
          <Link href="/login" className="btn-hard" style={{ fontSize: isMobile ? 17 : 20, padding: isMobile ? "14px 28px" : "18px 36px", background: "var(--orange)" }}>
            🚀 Reel banao — abhi
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "var(--ink)", borderTop: "2px solid rgba(255,255,255,0.06)", padding: "36px 24px" }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--orange)", border: "2px solid rgba(255,255,255,.15)", display: "grid", placeItems: "center", transform: "rotate(-4deg)" }}>🎬</div>
            <span className="display" style={{ fontSize: 18, color: "#fff" }}>ReelCraft</span>
          </div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            {[["Marketplace","/marketplace"],["For Brands","/marketplace/search"],["Pricing","/pricing"],["Privacy","/privacy"],["Terms","/terms"]].map(([l,h]) => (
              <Link key={h} href={h} style={{ fontSize: 13, color: "rgba(255,255,255,.5)", textDecoration: "none", fontWeight: 700 }}>{l}</Link>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>Made in India 🇮🇳 for Indian creators</div>
        </div>
      </footer>
    </div>
  );
}
