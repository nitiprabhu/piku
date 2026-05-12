// Landing page screen
const { useState: useStateL, useEffect: useEffectL } = React;

function ScreenLanding() {
  const { go } = useRoute();
  const lang = window.__lang || 'en';
  const [heroIdx, setHeroIdx] = useStateL(0);
  const heroes = HERO_COPY[lang] || HERO_COPY.en;
  useEffectL(() => {
    const i = setInterval(() => setHeroIdx(x => (x + 1) % heroes.length), 4500);
    return () => clearInterval(i);
  }, [heroes.length]);
  const hero = heroes[heroIdx];

  return (
    <div className="page-in" data-screen-label="01 Landing">
      <Header />
      {/* HERO */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 32, paddingBottom: 48 }}>
        <Decoration />
        <div className="container" style={{
          display: 'grid', gridTemplateColumns: '1.1fr 0.9fr',
          gap: 40, alignItems: 'center', position: 'relative', zIndex: 2,
        }}>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 22 }}>
              <span className="sticker sticker--orange wiggle">🇮🇳 Banaya Bharat ke creators ke liye</span>
              <LiveCounter />
            </div>
            <div key={heroIdx} className="fade-up" style={{ minHeight: 280 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--orange-dark)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                {hero.emoji} {hero.kicker}
              </div>
              <h1 className="display" style={{
                fontSize: 'clamp(48px, 7.6vw, 96px)',
                margin: '0 0 24px', textWrap: 'balance', maxWidth: 720,
              }}>
                {hero.big}
              </h1>
              <p style={{ fontSize: 20, color: 'var(--ink-2)', maxWidth: 540, lineHeight: 1.45, margin: 0 }}>
                {hero.sub}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 28, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn-hard" onClick={() => go('login')} style={{ fontSize: 18, padding: '16px 28px' }}>
                🚀 Try free — 5 reels
              </button>
              <button className="btn-hard ghost" onClick={() => go('templates')} style={{ fontSize: 16 }}>
                ▶ Watch demo (45s)
              </button>
              <span className="caveat" style={{ fontSize: 22, color: 'var(--ink-2)', position: 'relative', paddingLeft: 30 }}>
                <span style={{ position: 'absolute', left: 0, top: -8 }}>↙</span>
                no credit card needed!
              </span>
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 32, alignItems: 'center', flexWrap: 'wrap' }}>
              <AvatarStack />
              <div>
                <div style={{ display: 'flex', gap: 2, color: '#FFB300' }}>{'★★★★★'.split('').map((s,i) => <span key={i}>{s}</span>)}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}><b>4.9/5</b> · 12,840+ creators</div>
              </div>
            </div>
          </div>
          {/* phone */}
          <div style={{ display: 'grid', placeItems: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -20, right: 10, transform: 'rotate(8deg)', zIndex: 3 }}>
              <span className="sticker sticker--pink wiggle" style={{ fontSize: 14 }}>made in 47 sec ⚡</span>
            </div>
            <div style={{ position: 'absolute', bottom: 40, left: -20, transform: 'rotate(-6deg)', zIndex: 3 }}>
              <span className="sticker sticker--green" style={{ fontSize: 14 }}>viral score 92 🔥</span>
            </div>
            <PhoneReel />
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <section style={{ padding: '32px 0', borderTop: '2px solid var(--line)', borderBottom: '2px solid var(--line)', background: 'var(--bg-2)' }}>
        <div className="container">
          <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--ink-2)', textTransform: 'uppercase', marginBottom: 22 }}>
            Built for Bharat's creator community
          </p>
          <BrandStrip />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <SectionHead
            kicker="3 STEPS · 60 SECONDS"
            title={<>Type karo, <span style={{ color: 'var(--orange)' }}>AI banaye</span>, viral ho jao</>}
            sub="No editing, no mic, no stock footage hunt. Bas idea bolo — baki AI sambhal lega."
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            <StepCard n={1} emoji="✍️" title="Idea likho" desc="Hindi, English ya Hinglish — jaisa aata hai. Ek line bhi kafi hai." accent="orange" />
            <StepCard n={2} emoji="🎙️" title="Style + voice chuno" desc="Funny, devotional, motivation — 5 styles. 4 voices. 6 characters." accent="saffron" />
            <StepCard n={3} emoji="🚀" title="Publish karo" desc="Direct Instagram & YouTube post. Caption + hashtags AI ready." accent="pink" />
          </div>
        </div>
      </section>

      {/* MARQUEE OF REELS */}
      <section style={{ padding: '40px 0 80px', background: 'var(--ink)', color: 'var(--bg)', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className="sticker sticker--saffron" style={{ marginBottom: 12 }}>🔥 Trending right now</span>
          <h2 className="display" style={{ fontSize: 'clamp(36px,5vw,56px)', margin: '12px 0 8px', color: 'var(--bg)' }}>
            Reels banaye AI ne — viral kiye creators ne
          </h2>
          <p style={{ color: 'var(--muted)', maxWidth: 600, margin: '0 auto' }}>Real reels generated on ReelCraft this week</p>
        </div>
        <ReelMarquee speed="50s" />
        <div style={{ marginTop: 24 }}>
          <ReelMarquee speed="80s" />
        </div>
      </section>

      {/* OPPORTUNITY LEVERS */}
      <section style={{ padding: '80px 0', background: 'var(--bg-2)' }}>
        <div className="container">
          <SectionHead
            kicker="💰 KYUN BANAYE?"
            title={<>Posting consistently <span style={{ color: 'var(--orange)' }}>opens doors</span></>}
            sub="Brand deals, ad revenue, affiliate income — these unlock when you publish reels regularly. ReelCraft removes the production blocker so you can show up daily."
          />
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ transform: 'rotate(-2deg)' }}>
              <EarningsCard icon="🤝" title="Brand collaborations" sub="Daily reels = stronger pitch deck. Niche creators sign brand deals after consistent posting." kpi="60s" kpiLabel="per reel" />
            </div>
            <div style={{ transform: 'rotate(1deg)', marginTop: 24 }}>
              <EarningsCard icon="📈" title="Algorithm momentum" sub="The Reels & Shorts algorithm rewards frequency. More posts → more chances to go viral." kpi="9:16" kpiLabel="vertical native" />
            </div>
            <div style={{ transform: 'rotate(-1deg)' }}>
              <EarningsCard icon="🎯" title="Audience targeting" sub="Hindi, English, Hinglish — speak directly to your audience without dubbing studios." kpi="3" kpiLabel="languages" />
            </div>
            <div style={{ transform: 'rotate(2deg)', marginTop: 16 }}>
              <EarningsCard icon="🔁" title="Repurpose easily" sub="One prompt → reel for Instagram, Shorts, WhatsApp Status, X — one click each." kpi="4+" kpiLabel="platforms" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '100px 0' }}>
        <div className="container">
          <SectionHead
            kicker="WHY REELCRAFT"
            title={<>Sab kuch ek jagah — <span style={{ color: 'var(--orange)' }}>aur sirf 60 second mein</span></>}
            sub="Script, voice, video, music, captions, hashtags. AI sab kar leta hai."
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            <FeatureCard emoji="🎬" title="GPT-4o script" desc="Hooks jo viewers ko ruka de. Hindi pronunciation perfect." />
            <FeatureCard emoji="🎙️" title="Studio voice" desc="MiniMax HD — natural pacing, no robot vibe." accent />
            <FeatureCard emoji="🎥" title="Cinematic video" desc="VEO3 + WAN2.1 — scene-by-scene auto generated." />
            <FeatureCard emoji="🎵" title="Mood music" desc="Suno auto-composes background music. Royalty free." />
            <FeatureCard emoji="📝" title="Auto captions" desc="Burnt-in subtitles, Devanagari & English. Bold style." accent />
            <FeatureCard emoji="📲" title="One-click publish" desc="Instagram Reels + YouTube Shorts. Schedule coming soon." />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '80px 0', background: 'var(--bg-2)' }}>
        <div className="container">
          <SectionHead
            kicker="❤️ KYA KEHTE HAIN?"
            title="Creators ka pyaar"
            sub="Real users, real handles, real results."
          />
          <div style={{ columns: 3, columnGap: 20, columnFill: 'balance' }}>
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.handle} t={t} rotate={[-1.5, 1, -0.5, 1.5, -1, 0.5][i % 6]} />
            ))}
          </div>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section style={{ padding: '100px 0', position: 'relative' }}>
        <div className="container">
          <div style={{
            background: 'var(--orange)', color: '#fff',
            borderRadius: 32, border: '3px solid var(--ink)', boxShadow: '12px 12px 0 var(--ink)',
            padding: 56, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 20, right: 30, fontSize: 80, opacity: .15 }}>🚀</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 40, alignItems: 'center' }}>
              <div>
                <span className="sticker sticker--saffron" style={{ marginBottom: 16 }}>⚡ FREE FOREVER</span>
                <h2 className="display" style={{ fontSize: 'clamp(40px, 5vw, 64px)', margin: '12px 0 16px', color: '#fff', textShadow: '4px 4px 0 var(--ink)' }}>
                  5 reels free.<br/>Pro ₹499/mo.
                </h2>
                <p style={{ fontSize: 18, opacity: .92, maxWidth: 480 }}>
                  Unlimited reels, premium VEO3 video, 12 voices, all platforms.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => go('login')} className="btn-hard ghost" style={{ background: '#fff', fontSize: 18, padding: '18px 28px' }}>
                  Start free →
                </button>
                <button onClick={() => go('pricing')} className="btn-hard" style={{ background: 'var(--ink)', color: '#fff', fontSize: 16 }}>
                  Compare plans
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '60px 0 100px' }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <SectionHead kicker="FAQ" title="Sawaal hain? Jawab yahan." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { q: 'Kya English bhi support karta hai?', a: 'Haan! Hindi, English, aur Hinglish — teeno mein script + voiceover.' },
              { q: 'Free plan mein kya milega?', a: '5 reels per month, 2 voices, Instagram publishing, WAN2.1 video. Plenty for trial.' },
              { q: 'Watermark hatega?', a: 'Pro plan (₹499/mo) mein no watermark, plus VEO3 premium video quality.' },
              { q: 'Mera business chhota hai, kaam aayega?', a: 'Bilkul. Daily promo reels banao for kirana, restaurant, salon. Sales 40%+ badhti hai.' },
              { q: 'Customer support kaisa hai?', a: 'WhatsApp pe direct support. Pro users ke liye 24/7. Hindi mein bhi reply.' },
            ].map((f, i) => <FaqItem key={i} {...f} defaultOpen={i === 0} />)}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '80px 0', background: 'var(--ink)', color: 'var(--bg)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, fontSize: 240, lineHeight: 0.9, color: 'var(--orange)', display: 'flex', flexWrap: 'wrap', gap: 20, padding: 20 }}>
          🎬 🚀 ⚡ 🔥 💰 🎙️ 📈 🎵 ✨ 🎬 🚀
        </div>
        <div className="container" style={{ position: 'relative' }}>
          <h2 className="display" style={{ fontSize: 'clamp(48px, 8vw, 96px)', margin: '0 0 16px', color: 'var(--bg)' }}>
            Ek prompt.<br/>Ek viral reel. <span style={{ color: 'var(--orange)' }}>Ab.</span>
          </h2>
          <p style={{ fontSize: 20, color: 'var(--muted)', maxWidth: 500, margin: '0 auto 32px' }}>
            Free mein try karo — credit card ki zaroorat nahi.
          </p>
          <button onClick={() => go('login')} className="btn-hard" style={{ fontSize: 22, padding: '20px 36px', background: 'var(--orange)' }}>
            🚀 Reel banao — abhi
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Decoration() {
  return (
    <>
      <span className="star" style={{ top: 60, left: '8%', color: 'var(--orange)' }}>✦</span>
      <span className="star" style={{ top: 200, right: '6%', color: 'var(--pink)', animationDelay: '.4s' }}>✦</span>
      <span className="star" style={{ bottom: 40, left: '40%', color: 'var(--saffron)', animationDelay: '.8s' }}>✦</span>
      <span className="caveat" style={{
        position: 'absolute', top: '12%', left: '46%', fontSize: 28, color: 'var(--orange-dark)',
        transform: 'rotate(-8deg)', pointerEvents: 'none',
      }}>
        ↗ try this!
      </span>
    </>
  );
}

function StepCard({ n, emoji, title, desc, accent }) {
  const accentColor = { orange: 'var(--orange)', saffron: 'var(--saffron)', pink: 'var(--pink)' }[accent] || 'var(--orange)';
  return (
    <div style={{
      background: 'var(--card)', borderRadius: 24,
      border: '2px solid var(--ink)', boxShadow: '8px 8px 0 var(--ink)',
      padding: 28, position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: -16, left: 24,
        background: accentColor, color: '#fff',
        width: 44, height: 44, borderRadius: 12,
        border: '2px solid var(--ink)', display: 'grid', placeItems: 'center',
        fontWeight: 900, fontSize: 18, transform: 'rotate(-4deg)',
        boxShadow: '3px 3px 0 var(--ink)',
      }}>0{n}</div>
      <div style={{ fontSize: 56, marginBottom: 16, marginTop: 12 }}>{emoji}</div>
      <h3 style={{ fontSize: 24, margin: '0 0 8px', fontWeight: 900 }}>{title}</h3>
      <p style={{ color: 'var(--ink-2)', lineHeight: 1.5, margin: 0 }}>{desc}</p>
    </div>
  );
}

function FeatureCard({ emoji, title, desc, accent }) {
  return (
    <div style={{
      background: accent ? 'var(--orange)' : 'var(--card)',
      color: accent ? '#fff' : 'var(--ink)',
      borderRadius: 20, border: '2px solid var(--ink)',
      boxShadow: '5px 5px 0 var(--ink)',
      padding: 24,
    }}>
      <div style={{ fontSize: 44, marginBottom: 12 }}>{emoji}</div>
      <h3 style={{ fontSize: 20, margin: '0 0 8px', fontWeight: 900 }}>{title}</h3>
      <p style={{ opacity: accent ? .9 : 1, color: accent ? '#fff' : 'var(--ink-2)', lineHeight: 1.5, margin: 0, fontSize: 15 }}>{desc}</p>
    </div>
  );
}

function TestimonialCard({ t, rotate = 0 }) {
  return (
    <div style={{
      breakInside: 'avoid', marginBottom: 20,
      background: 'var(--card)', borderRadius: 20,
      border: '2px solid var(--ink)', boxShadow: '5px 5px 0 var(--ink)',
      padding: 22, transform: `rotate(${rotate}deg)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 999,
          background: 'var(--bg-2)', border: '2px solid var(--ink)',
          display: 'grid', placeItems: 'center', fontSize: 24,
        }}>{t.avatar}</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{t.name}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{t.handle} · {t.followers}</div>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: 'var(--orange-dark)', background: 'var(--bg-2)', padding: '4px 8px', borderRadius: 6 }}>{t.tag}</span>
      </div>
      <p style={{ margin: 0, lineHeight: 1.5, fontSize: 15, color: 'var(--ink)' }}>"{t.body}"</p>
    </div>
  );
}

function FaqItem({ q, a, defaultOpen }) {
  const [open, setOpen] = useStateL(defaultOpen);
  return (
    <div style={{
      background: 'var(--card)', borderRadius: 14,
      border: '2px solid var(--ink)', boxShadow: '3px 3px 0 var(--ink)',
      padding: '16px 20px',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'transparent', border: 'none', padding: 0, fontSize: 17, fontWeight: 800, textAlign: 'left',
      }}>
        {q}
        <span style={{ fontSize: 22, color: 'var(--orange)' }}>{open ? '−' : '+'}</span>
      </button>
      {open && <p style={{ margin: '12px 0 0', color: 'var(--ink-2)', lineHeight: 1.5 }}>{a}</p>}
    </div>
  );
}

function AvatarStack() {
  const avs = ['🧔🏽', '👩🏽‍🍳', '🧑🏽‍💼', '👩🏽', '🧑🏽‍💻'];
  return (
    <div style={{ display: 'flex' }}>
      {avs.map((a, i) => (
        <div key={i} style={{
          width: 36, height: 36, borderRadius: 999,
          background: ['var(--orange)','var(--saffron)','var(--pink)','var(--green)','#7B2CBF'][i],
          border: '2px solid var(--bg)', display: 'grid', placeItems: 'center', fontSize: 18,
          marginLeft: i === 0 ? 0 : -10,
        }}>{a}</div>
      ))}
    </div>
  );
}

Object.assign(window, { ScreenLanding });
