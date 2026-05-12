// Shared components for ReelCraft
const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;

// ===== Router context =====
const RouterCtx = createContext({ route: 'landing', go: () => {} });
const useRoute = () => useContext(RouterCtx);

// ===== Sample data =====
const SAMPLE_REELS = [
  { id: 'r1', title: 'Aaj ka motivation 🔥', creator: '@rahul.motivation', views: '2.4M', likes: '184K', grad: 'reel-grad-1', emoji: '💪', cap: 'Mehnat ka phal meetha hota hai' },
  { id: 'r2', title: 'Subah ki shloka 🙏', creator: '@pandit.daily', views: '890K', likes: '76K', grad: 'reel-grad-3', emoji: '🕉️', cap: 'Karmanye vadhikaraste...' },
  { id: 'r3', title: 'Diwali sale promo 🪔', creator: '@kirana.singh', views: '1.1M', likes: '92K', grad: 'reel-grad-6', emoji: '🪔', cap: '50% off — sirf aaj!' },
  { id: 'r4', title: 'Comedy gone wrong 😂', creator: '@raju.bhaiya', views: '5.2M', likes: '410K', grad: 'reel-grad-2', emoji: '😂', cap: 'Beta jaldi karo!' },
  { id: 'r5', title: 'Startup tips for desi', creator: '@dev.bhai', views: '650K', likes: '54K', grad: 'reel-grad-4', emoji: '🚀', cap: 'Crore kaise banaye' },
  { id: 'r6', title: 'Geopolitics today 📰', creator: '@news.anchor', views: '320K', likes: '21K', grad: 'reel-grad-5', emoji: '📰', cap: 'BREAKING: aaj ki khabar' },
  { id: 'r7', title: 'Vande Mataram ❤️', creator: '@bharat.first', views: '1.8M', likes: '210K', grad: 'reel-grad-6', emoji: '🇮🇳', cap: 'Apna desh, apni shaan' },
  { id: 'r8', title: 'Restaurant promo', creator: '@desi.dhaba', views: '420K', likes: '32K', grad: 'reel-grad-7', emoji: '🍛', cap: 'Aaj ka special: butter chicken' },
];

const TESTIMONIALS = [
  { name: 'Rahul Sharma', handle: '@rahul.motivation', avatar: '🧔🏽', body: 'Pehle 3 ghante lagte the ek reel banane mein. Ab 1 minute! Followers 2X ho gaye.', followers: '480K', tag: 'Motivation' },
  { name: 'Priya Didi', handle: '@priya.kitchen', avatar: '👩🏽‍🍳', body: 'Mere recipe reels ab har din viral ho rahe hain. Brand deals bhi 5x increase 🔥', followers: '1.2M', tag: 'Food' },
  { name: 'Pandit Vinay', handle: '@daily.shloka', avatar: '🧔🏽‍♂️', body: 'Shloka ka pronunciation perfect aata hai AI se. Devotional content ke liye game-changer.', followers: '890K', tag: 'Devotional' },
  { name: 'Karan Mehta', handle: '@karan.kirana', avatar: '🧑🏽‍💼', body: 'Apni dukaan ke liye daily promo banata hu. Sales 40% badh gayi pichle 2 mahine mein.', followers: '34K', tag: 'Business' },
  { name: 'Anjali Rao', handle: '@anjali.fashion', avatar: '👩🏽', body: 'Hinglish caption auto-generate hota hai. Itna time bachta hai ki ab 4 reels/day post karti hu.', followers: '230K', tag: 'Fashion' },
  { name: 'Dev Bhai', handle: '@dev.startup', avatar: '🧑🏽‍💻', body: 'Founder huu aur khud edit karta tha. Ab AI sab kuch karta hai — focus on business.', followers: '92K', tag: 'Startup' },
];

const TEMPLATES = [
  { id: 't1', name: 'Aaj Ka Motivation', emoji: '💪', cat: 'Motivation', uses: '12.4K', grad: 'reel-grad-1', desc: 'Daily morning motivation reel — 30s' },
  { id: 't2', name: 'Subah Ki Shloka', emoji: '🕉️', cat: 'Devotional', uses: '8.2K', grad: 'reel-grad-3', desc: 'Sanskrit shloka with translation — 45s' },
  { id: 't3', name: 'Festival Sale', emoji: '🪔', cat: 'Business', uses: '21.8K', grad: 'reel-grad-6', desc: 'Discount promo for Diwali/Holi — 30s' },
  { id: 't4', name: 'Desi Comedy', emoji: '😂', cat: 'Funny', uses: '34.1K', grad: 'reel-grad-2', desc: 'Family-friendly comedy skits — 60s' },
  { id: 't5', name: 'Breaking News', emoji: '📰', cat: 'News', uses: '5.6K', grad: 'reel-grad-5', desc: 'News-style anchor reel — 60s' },
  { id: 't6', name: 'Recipe Reveal', emoji: '🍳', cat: 'Food', uses: '18.9K', grad: 'reel-grad-2', desc: 'Quick recipe with steps — 45s' },
  { id: 't7', name: 'Startup Story', emoji: '🚀', cat: 'Business', uses: '4.2K', grad: 'reel-grad-4', desc: 'Founder journey snippet — 60s' },
  { id: 't8', name: 'Bhakti Bhajan', emoji: '🙏', cat: 'Devotional', uses: '11.5K', grad: 'reel-grad-3', desc: 'Bhajan with lyrics — 90s' },
  { id: 't9', name: 'Product Showcase', emoji: '📦', cat: 'Business', uses: '7.8K', grad: 'reel-grad-7', desc: 'E-commerce product reel — 30s' },
  { id: 't10', name: 'Patriotic', emoji: '🇮🇳', cat: 'Devotional', uses: '6.4K', grad: 'reel-grad-6', desc: 'Tiranga, freedom day vibes — 30s' },
];

const STYLES = [
  { id: 'funny', label: 'Funny', emoji: '😂', desc: 'Comedy / family humor' },
  { id: 'devotional', label: 'Devotional', emoji: '🙏', desc: 'Shloka, bhajan, spiritual' },
  { id: 'motivation', label: 'Motivation', emoji: '🔥', desc: 'Hustle, success, mindset' },
  { id: 'business', label: 'Business', emoji: '💼', desc: 'Promo, sales, brand' },
  { id: 'news', label: 'News', emoji: '📰', desc: 'Trending, current affairs' },
];

const VOICES = [
  { id: 'rohit_m', name: 'Rohit', lang: 'Hindi (M)', emoji: '🧔🏽', vibe: 'Warm, narrative' },
  { id: 'priya_f', name: 'Priya', lang: 'Hindi (F)', emoji: '👩🏽', vibe: 'Friendly, energetic' },
  { id: 'arjun_m', name: 'Arjun', lang: 'English (M)', emoji: '🧑🏽‍💼', vibe: 'Confident, anchor' },
  { id: 'ananya_f', name: 'Ananya', lang: 'English (F)', emoji: '👩🏽‍💼', vibe: 'Crisp, professional' },
];

const CHARACTERS = [
  { id: 'raju', name: 'Raju Bhaiya', emoji: '🤣', desc: 'Desi uncle comedy', lang: 'Hindi' },
  { id: 'priya_didi', name: 'Priya Didi', emoji: '💪', desc: 'Big sis motivation', lang: 'Hinglish' },
  { id: 'sharma', name: 'Prof. Sharma', emoji: '🎓', desc: 'Patient teacher', lang: 'Hindi' },
  { id: 'anchor', name: 'Rohit Anchor', emoji: '📺', desc: 'News dramatic', lang: 'Hindi' },
  { id: 'devbhai', name: 'Dev Bhai', emoji: '🚀', desc: 'Startup founder', lang: 'Hinglish' },
  { id: 'pandit', name: 'Pandit Ji', emoji: '🙏', desc: 'Spiritual guru', lang: 'Hindi' },
];

const PROOF_STATS = [
  { icon: '🎙️', label: 'Studio voice in Hindi, English & Hinglish' },
  { icon: '🎬', label: 'Cinematic AI scenes from a single prompt' },
  { icon: '📲', label: 'Optimised for Reels, Shorts & WhatsApp' },
  { icon: '⚡', label: 'Built for Bharat — fast, frugal, mobile-first' },
];

// ===== Hero rotating copy =====
const HERO_COPY = {
  en: [
    { kicker: 'Earn from reels', big: 'Turn one prompt into ₹50,000/mo', sub: 'Creators on ReelCraft monetize 3x faster — brand deals, ads, affiliate.', emoji: '💰' },
    { kicker: 'Grow your followers', big: 'From 0 to 100K in 90 days', sub: '10x your reach with viral-optimized AI scripts and hooks.', emoji: '📈' },
    { kicker: 'Save your time', big: 'Reels in 60 seconds, not 3 hours', sub: 'No editing software, no stock footage hunting. Just type. Done.', emoji: '⚡' },
    { kicker: 'Promote your business', big: 'Daily promo reels for your dukaan', sub: 'Local stores, restaurants, salons — sell more with daily content.', emoji: '🛍️' },
  ],
  hi: [
    { kicker: 'Reels se kamao', big: 'Ek prompt → ₹50,000 mahine', sub: 'ReelCraft creators 3x tezi se kamai karte hain — brand deals, ads, affiliate.', emoji: '💰' },
    { kicker: 'Followers badhao', big: '0 se 1 lakh, sirf 90 dino mein', sub: 'AI scripts aur hooks se aapki reach 10x kar do.', emoji: '📈' },
    { kicker: 'Time bachao', big: '60 second mein reel — 3 ghante mein nahi', sub: 'Editing software ki zaroorat nahi, stock footage nahi. Bas type karo. Done.', emoji: '⚡' },
    { kicker: 'Business chamkao', big: 'Daily promo reels apni dukaan ke liye', sub: 'Kirana, restaurant, salon — daily content se sales badhao.', emoji: '🛍️' },
  ],
};

// ===== Localized strings =====
const T = {
  en: {
    nav_features: 'Features', nav_templates: 'Templates', nav_pricing: 'Pricing', nav_login: 'Log in', nav_cta: 'Try Free',
    cta_make: 'Make a Reel', cta_free: '5 free reels',
    foot: 'Made in India 🇮🇳 for Indian creators',
  },
  hi: {
    nav_features: 'Features', nav_templates: 'Templates', nav_pricing: 'Pricing', nav_login: 'Login', nav_cta: 'Free Try',
    cta_make: 'Reel Banao', cta_free: '5 free reels',
    foot: 'Bharat mein, Bharat ke creators ke liye 🇮🇳',
  }
};

// ===== Header =====
function Header({ onCta, simple }) {
  const { route, go } = useRoute();
  const lang = window.__lang || 'en';
  const t = T[lang];
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'color-mix(in oklab, var(--bg) 88%, transparent)',
      backdropFilter: 'blur(12px)',
      borderBottom: '2px solid var(--ink)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
        <button onClick={() => go('landing')} style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', padding: 0,
        }}>
          <Logo />
        </button>
        {!simple && (
          <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }} className="hide-sm">
            <a onClick={() => go('landing')} style={navLink}>{t.nav_features}</a>
            <a onClick={() => go('templates')} style={navLink}>{t.nav_templates}</a>
            <a onClick={() => go('pricing')} style={navLink}>{t.nav_pricing}</a>
          </nav>
        )}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {!simple && <button onClick={() => go('login')} style={{ ...navLink, background: 'transparent', border: 'none' }}>{t.nav_login}</button>}
          <button className="btn-hard" onClick={onCta || (() => go('login'))} style={{ padding: '10px 18px', fontSize: 14 }}>
            🚀 {t.nav_cta}
          </button>
        </div>
      </div>
    </header>
  );
}
const navLink = { color: 'var(--ink)', textDecoration: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' };

function Logo({ size = 32 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: size, height: size, borderRadius: 10,
        background: 'var(--orange)',
        border: '2px solid var(--ink)',
        boxShadow: '2px 2px 0 var(--ink)',
        display: 'grid', placeItems: 'center',
        transform: 'rotate(-4deg)',
      }}>
        <span style={{ fontSize: size * 0.55 }}>🎬</span>
      </div>
      <span className="display" style={{ fontSize: 24, letterSpacing: '0.02em' }}>
        ReelCraft
      </span>
    </div>
  );
}

// ===== Phone frame with playing reel =====
function PhoneReel({ reel = SAMPLE_REELS[0], showOverlay = true, autoPlay = true }) {
  const [progress, setProgress] = useState(12);
  useEffect(() => {
    if (!autoPlay) return;
    const i = setInterval(() => setProgress(p => (p >= 100 ? 0 : p + 1.2)), 80);
    return () => clearInterval(i);
  }, [autoPlay]);
  return (
    <div className="phone">
      <div className="phone__notch"></div>
      <div className="phone__screen">
        <div className={`stripes scanlines ${reel.grad}`} style={{
          width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
        }}>
          {showOverlay && (
            <>
              {/* Top bar */}
              <div style={{
                position: 'absolute', top: 38, left: 12, right: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                color: '#fff', fontWeight: 700, fontSize: 13,
              }}>
                <span style={{ display: 'flex', gap: 12, opacity: .9 }}>
                  <span style={{ borderBottom: '2px solid #fff', paddingBottom: 4 }}>For You</span>
                  <span style={{ opacity: .6 }}>Following</span>
                </span>
                <span style={{ opacity: .9 }}>🔍</span>
              </div>
              {/* Center emoji */}
              <div style={{
                position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
              }}>
                <span style={{ fontSize: 96, filter: 'drop-shadow(0 4px 16px rgba(0,0,0,.4))' }}>{reel.emoji}</span>
              </div>
              {/* Caption */}
              <div style={{
                position: 'absolute', left: 16, right: 80, bottom: 90,
                color: '#fff',
              }}>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{reel.creator}</div>
                <div className="hindi" style={{ fontSize: 14, lineHeight: 1.4, opacity: .95 }}>{reel.cap}</div>
                <div style={{ fontSize: 11, opacity: .8, marginTop: 6 }}>♫ Original audio · {reel.views} plays</div>
              </div>
              {/* Side actions */}
              <div style={{
                position: 'absolute', right: 12, bottom: 90,
                display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center',
                color: '#fff', fontWeight: 700, fontSize: 11,
              }}>
                <ActionIcon emoji="❤️" count={reel.likes} />
                <ActionIcon emoji="💬" count="3.2K" />
                <ActionIcon emoji="↗️" count="Share" />
                <ActionIcon emoji="⋯" />
              </div>
              {/* Progress bar */}
              <div style={{
                position: 'absolute', bottom: 14, left: 12, right: 12, height: 3,
                background: 'rgba(255,255,255,.2)', borderRadius: 3, overflow: 'hidden',
              }}>
                <div style={{ height: '100%', width: `${progress}%`, background: '#fff', transition: 'width .1s linear' }}></div>
              </div>
              {/* Watermark */}
              <div style={{
                position: 'absolute', top: 78, right: 12,
                background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)',
                padding: '4px 8px', borderRadius: 6, color: '#fff',
                fontSize: 10, fontWeight: 800,
              }}>
                ✨ ReelCraft
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function ActionIcon({ emoji, count }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 999, background: 'rgba(0,0,0,.3)',
        backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', fontSize: 20,
      }}>{emoji}</div>
      {count && <span>{count}</span>}
    </div>
  );
}

// ===== Live counter =====
function LiveCounter() {
  const [n, setN] = useState(47832);
  useEffect(() => {
    const i = setInterval(() => setN(v => v + Math.floor(Math.random() * 4) + 1), 1100);
    return () => clearInterval(i);
  }, []);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '8px 14px', borderRadius: 999,
      background: 'var(--card)', border: '2px solid var(--ink)',
      boxShadow: '3px 3px 0 var(--ink)',
      fontWeight: 800, fontSize: 14,
    }}>
      <span className="pulse-dot"></span>
      <span className="mono" style={{ color: 'var(--orange-dark)' }}>{n.toLocaleString('en-IN')}</span>
      <span style={{ color: 'var(--ink-2)' }}>reels made today 🔥</span>
    </div>
  );
}

// ===== Marquee strip of reels =====
function ReelMarquee({ speed = '60s' }) {
  const items = [...SAMPLE_REELS, ...SAMPLE_REELS];
  return (
    <div className="marquee">
      <div className="marquee__track" style={{ '--speed': speed }}>
        {items.map((r, i) => (
          <MiniReelCard key={i} reel={r} />
        ))}
      </div>
      <div className="marquee__track" style={{ '--speed': speed }} aria-hidden>
        {items.map((r, i) => (
          <MiniReelCard key={'b' + i} reel={r} />
        ))}
      </div>
    </div>
  );
}
function MiniReelCard({ reel, w = 144, h = 256 }) {
  return (
    <div className={`stripes ${reel.grad}`} style={{
      width: w, height: h, borderRadius: 16,
      border: '2px solid var(--ink)', boxShadow: '4px 4px 0 var(--ink)',
      flexShrink: 0, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 56 }}>{reel.emoji}</div>
      <div style={{
        position: 'absolute', bottom: 8, left: 8, right: 8, color: '#fff',
        fontSize: 11, fontWeight: 700,
      }}>
        <div style={{ opacity: .9 }}>{reel.creator}</div>
        <div style={{ marginTop: 2, fontSize: 10, opacity: .8 }}>▶ {reel.views}</div>
      </div>
      <div style={{
        position: 'absolute', top: 8, right: 8, padding: '3px 6px',
        background: 'rgba(0,0,0,.4)', borderRadius: 4, color: '#fff',
        fontSize: 9, fontWeight: 800,
      }}>✨</div>
    </div>
  );
}

// ===== Brand logos strip =====
function BrandStrip() {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center', justifyContent: 'center',
    }}>
      {PROOF_STATS.map((s, i) => (
        <React.Fragment key={s.label}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 700, letterSpacing: '0.01em' }}>{s.label}</span>
          </div>
          {i < PROOF_STATS.length - 1 && <span style={{ width: 4, height: 4, borderRadius: 999, background: 'var(--ink-2)', opacity: .4 }}></span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ===== Section heading =====
function SectionHead({ kicker, title, sub, align = 'center' }) {
  return (
    <div style={{ textAlign: align, marginBottom: 40 }}>
      {kicker && (
        <span className="sticker sticker--orange" style={{ marginBottom: 16 }}>
          {kicker}
        </span>
      )}
      <h2 className="display" style={{
        fontSize: 'clamp(36px, 6vw, 64px)', margin: '12px 0',
        textWrap: 'balance', maxWidth: 900, marginLeft: align === 'center' ? 'auto' : 0, marginRight: align === 'center' ? 'auto' : 0,
      }}>
        {title}
      </h2>
      {sub && <p style={{ fontSize: 18, color: 'var(--ink-2)', maxWidth: 640, margin: align === 'center' ? '0 auto' : 0, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

// ===== Footer =====
function Footer() {
  const lang = window.__lang || 'en';
  const t = T[lang];
  return (
    <footer style={{
      background: 'var(--ink)', color: 'var(--bg)',
      padding: '56px 0 32px', marginTop: 80,
    }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--orange)', display: 'grid', placeItems: 'center', fontSize: 20, transform: 'rotate(-4deg)' }}>🎬</div>
              <span className="display" style={{ fontSize: 28, color: 'var(--bg)' }}>ReelCraft</span>
            </div>
            <p style={{ color: 'var(--muted)', maxWidth: 320, lineHeight: 1.5 }}>{t.foot}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {['📸', '▶️', '🐦', '💼'].map(e => (
                <span key={e} style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--bg-2)', color: 'var(--ink)',
                  display: 'grid', placeItems: 'center', fontSize: 18,
                  border: '2px solid var(--bg)',
                }}>{e}</span>
              ))}
            </div>
          </div>
          <FootCol title="Product" items={['Features', 'Templates', 'Pricing', 'Roadmap']} />
          <FootCol title="Creators" items={['Tutorials', 'Community', 'Affiliate', 'Brand deals']} />
          <FootCol title="Company" items={['About', 'Blog', 'Careers', 'Contact']} />
        </div>
        <div style={{
          marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,.12)',
          display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 13,
        }}>
          <span>© 2026 ReelCraft Technologies Pvt. Ltd.</span>
          <span>Banaya gaya ❤️ se Bengaluru mein</span>
        </div>
      </div>
    </footer>
  );
}
function FootCol({ title, items }) {
  return (
    <div>
      <div style={{ fontWeight: 800, marginBottom: 12, color: 'var(--bg)' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(i => <a key={i} style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14 }}>{i}</a>)}
      </div>
    </div>
  );
}

// ===== Opportunity / growth-lever card =====
function EarningsCard({ title, sub, kpi, kpiLabel, icon }) {
  return (
    <div style={{
      background: 'var(--card)', borderRadius: 18,
      border: '2px solid var(--ink)', boxShadow: '6px 6px 0 var(--ink)',
      padding: 20, minWidth: 260, maxWidth: 280, position: 'relative',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Growth lever</span>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={{ fontWeight: 900, fontSize: 18, lineHeight: 1.2 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6, lineHeight: 1.4 }}>{sub}</div>
      <div style={{
        marginTop: 14, padding: '8px 12px', background: 'var(--bg-2)',
        borderRadius: 10, display: 'flex', alignItems: 'baseline', gap: 6,
        border: '1.5px dashed var(--line-strong)',
      }}>
        <span className="display" style={{ fontSize: 22, color: 'var(--orange-dark)' }}>{kpi}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 700 }}>{kpiLabel}</span>
      </div>
    </div>
  );
}

// expose globally
Object.assign(window, {
  RouterCtx, useRoute, SAMPLE_REELS, TESTIMONIALS, TEMPLATES, STYLES, VOICES, CHARACTERS, PROOF_STATS, HERO_COPY, T,
  Header, Logo, PhoneReel, LiveCounter, ReelMarquee, MiniReelCard, BrandStrip, SectionHead, Footer, EarningsCard,
});
