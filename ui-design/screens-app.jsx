// App screens: Templates, Create, Generation, Preview, Dashboard, Pricing

// ===== Sidebar layout shell for app screens =====
function AppShell({ active, children, label }) {
  const { go } = useRoute();
  const items = [
    { id: 'dashboard', icon: '🏠', label: 'Home' },
    { id: 'create', icon: '✨', label: 'Create' },
    { id: 'templates', icon: '🎬', label: 'Templates' },
    { id: 'pricing', icon: '💎', label: 'Plans' },
  ];
  return (
    <div data-screen-label={label} style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '240px 1fr', background: 'var(--bg)' }}>
      <aside style={{ borderRight: '2px solid var(--ink)', padding: 24, position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div onClick={() => go('landing')} style={{ cursor: 'pointer', marginBottom: 32 }}><Logo /></div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map(it => (
            <button key={it.id} onClick={() => go(it.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 12,
              background: active === it.id ? 'var(--orange)' : 'transparent',
              color: active === it.id ? '#fff' : 'var(--ink)',
              border: '2px solid', borderColor: active === it.id ? 'var(--ink)' : 'transparent',
              boxShadow: active === it.id ? '3px 3px 0 var(--ink)' : 'none',
              fontWeight: 800, fontSize: 15, textAlign: 'left', cursor: 'pointer',
            }}>
              <span style={{ fontSize: 18 }}>{it.icon}</span>{it.label}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <div style={{
            background: 'var(--bg-2)', padding: 16, borderRadius: 14,
            border: '2px solid var(--ink)', boxShadow: '3px 3px 0 var(--ink)',
          }}>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 700, textTransform: 'uppercase' }}>Credits</div>
            <div className="display" style={{ fontSize: 32, color: 'var(--orange-dark)' }}>3 / 5</div>
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 10 }}>resets in 18 days</div>
            <button onClick={() => go('pricing')} className="btn-hard" style={{ width: '100%', fontSize: 13, padding: '10px' }}>
              ⚡ Upgrade Pro
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--saffron)', border: '2px solid var(--ink)', display: 'grid', placeItems: 'center', fontSize: 18 }}>🧔🏽</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Rahul S.</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Free plan</div>
            </div>
          </div>
        </div>
      </aside>
      <main className="page-in" style={{ padding: 32, overflowX: 'hidden' }}>{children}</main>
    </div>
  );
}

// ===== Dashboard =====
function ScreenDashboard() {
  const { go } = useRoute();
  const reels = [
    { id: 'd1', title: 'Aaj ka motivation', status: 'completed', time: '2h ago', viral: 92, views: '12.4K', grad: 'reel-grad-1', emoji: '💪' },
    { id: 'd2', title: 'Diwali sale promo', status: 'completed', time: '1d ago', viral: 87, views: '4.2K', grad: 'reel-grad-6', emoji: '🪔' },
    { id: 'd3', title: 'Subah ki shloka', status: 'completed', time: '2d ago', viral: 78, views: '892', grad: 'reel-grad-3', emoji: '🕉️' },
    { id: 'd4', title: 'Family comedy skit', status: 'processing', time: 'now', viral: null, views: null, grad: 'reel-grad-2', emoji: '😂' },
    { id: 'd5', title: 'Startup tips reel', status: 'completed', time: '4d ago', viral: 81, views: '2.1K', grad: 'reel-grad-4', emoji: '🚀' },
    { id: 'd6', title: 'Vande Mataram', status: 'completed', time: '1w ago', viral: 94, views: '18.4K', grad: 'reel-grad-6', emoji: '🇮🇳' },
  ];

  return (
    <AppShell active="dashboard" label="07 Dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <span className="caveat" style={{ fontSize: 22, color: 'var(--orange-dark)' }}>Namaste Rahul!</span>
          <h1 className="display" style={{ fontSize: 56, margin: '4px 0 8px' }}>Aaj kya banayenge?</h1>
          <p style={{ color: 'var(--ink-2)', margin: 0 }}>You've made <b>14 reels</b> this month — total <b>34.8K views</b> 🔥</p>
        </div>
        <button onClick={() => go('create')} className="btn-hard" style={{ fontSize: 16, padding: '14px 22px' }}>
          ✨ New reel
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total reels" value="14" sub="this month" emoji="🎬" />
        <StatCard label="Total views" value="34.8K" sub="↑ 142%" emoji="👀" accent />
        <StatCard label="Avg viral score" value="86" sub="↑ 12 pts" emoji="🔥" />
        <StatCard label="Earnings" value="₹12,400" sub="brand deals" emoji="💰" />
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {['All', 'Completed', 'Processing', 'Published', 'Drafts'].map((c, i) => (
          <button key={c} style={{
            padding: '8px 16px', borderRadius: 999,
            background: i === 0 ? 'var(--ink)' : 'var(--card)',
            color: i === 0 ? 'var(--bg)' : 'var(--ink)',
            border: '2px solid var(--ink)',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>{c}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
        {reels.map(r => <ReelTile key={r.id} reel={r} onClick={() => go('preview')} />)}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, sub, emoji, accent }) {
  return (
    <div style={{
      background: accent ? 'var(--orange)' : 'var(--card)',
      color: accent ? '#fff' : 'var(--ink)',
      borderRadius: 16, border: '2px solid var(--ink)',
      boxShadow: '4px 4px 0 var(--ink)', padding: 18,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', opacity: .8 }}>{label}</span>
        <span style={{ fontSize: 24 }}>{emoji}</span>
      </div>
      <div className="display" style={{ fontSize: 36, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, opacity: .8 }}>{sub}</div>
    </div>
  );
}

function ReelTile({ reel, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
      borderRadius: 16, position: 'relative', textAlign: 'left',
    }}>
      <div className={`stripes ${reel.grad}`} style={{
        aspectRatio: '9/14', borderRadius: 16, position: 'relative', overflow: 'hidden',
        border: '2px solid var(--ink)', boxShadow: '4px 4px 0 var(--ink)',
      }}>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 64 }}>{reel.emoji}</div>
        {reel.status === 'processing' ? (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', display: 'grid', placeItems: 'center', color: '#fff' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="spin" style={{ width: 32, height: 32, border: '3px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 8px' }}></div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Generating...</div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ position: 'absolute', top: 8, left: 8, padding: '4px 8px', background: 'rgba(0,0,0,.5)', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 800 }}>
              🔥 {reel.viral}
            </div>
            <div style={{ position: 'absolute', bottom: 8, right: 8, padding: '4px 8px', background: 'rgba(0,0,0,.5)', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 800 }}>
              ▶ {reel.views}
            </div>
          </>
        )}
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 14 }}>{reel.title}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{reel.time}</div>
      </div>
    </button>
  );
}

// ===== Templates =====
function ScreenTemplates() {
  const { go } = useRoute();
  const [cat, setCat] = React.useState('All');
  const cats = ['All', 'Motivation', 'Devotional', 'Funny', 'Business', 'News', 'Food'];
  const filtered = cat === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.cat === cat);
  return (
    <AppShell active="templates" label="04 Templates">
      <div style={{ marginBottom: 28 }}>
        <span className="sticker sticker--pink" style={{ marginBottom: 12 }}>🔥 30+ trending templates</span>
        <h1 className="display" style={{ fontSize: 56, margin: '8px 0 6px' }}>Templates gallery</h1>
        <p style={{ color: 'var(--ink-2)', margin: 0 }}>Pre-built reels — click karo, customize karo, publish karo.</p>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            padding: '8px 16px', borderRadius: 999,
            background: cat === c ? 'var(--ink)' : 'var(--card)',
            color: cat === c ? 'var(--bg)' : 'var(--ink)',
            border: '2px solid var(--ink)', fontWeight: 800, fontSize: 13,
            cursor: 'pointer', boxShadow: cat === c ? '3px 3px 0 var(--orange)' : 'none',
          }}>{c}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
        {filtered.map(t => (
          <button key={t.id} onClick={() => go('create')} style={{
            background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
          }}>
            <div className={`stripes ${t.grad}`} style={{
              aspectRatio: '9/14', borderRadius: 16, position: 'relative', overflow: 'hidden',
              border: '2px solid var(--ink)', boxShadow: '4px 4px 0 var(--ink)',
            }}>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 80 }}>{t.emoji}</div>
              <div style={{ position: 'absolute', top: 10, left: 10, padding: '3px 8px', background: 'rgba(0,0,0,.5)', borderRadius: 6, color: '#fff', fontSize: 10, fontWeight: 800 }}>
                {t.cat}
              </div>
              <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, color: '#fff' }}>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{t.name}</div>
                <div style={{ fontSize: 11, opacity: .85, marginTop: 2 }}>👥 {t.uses} uses</div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-2)' }}>{t.desc}</div>
          </button>
        ))}
      </div>
    </AppShell>
  );
}

// ===== Create form =====
function ScreenCreate() {
  const { go } = useRoute();
  const [prompt, setPrompt] = React.useState('Aaj ka motivation: hard work se sab kuch milega');
  const [style, setStyle] = React.useState('motivation');
  const [voice, setVoice] = React.useState('rohit_m');
  const [duration, setDuration] = React.useState(60);
  const [language, setLanguage] = React.useState('hi');
  const [character, setCharacter] = React.useState(null);

  return (
    <AppShell active="create" label="03 Create">
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <span className="sticker sticker--orange">✨ Step 1 — describe your reel</span>
          <h1 className="display" style={{ fontSize: 56, margin: '8px 0 6px' }}>Create your reel</h1>
          <p style={{ color: 'var(--ink-2)', margin: 0 }}>Idea bolo — AI script likhega, voice degi, video banayegi.</p>
        </div>

        {/* Idea */}
        <Card>
          <SectionLabel n="01" title="Your idea" sub="10–500 characters · Hindi, English ya Hinglish" />
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} maxLength={500}
            style={{
              width: '100%', minHeight: 140, padding: 16, fontSize: 17, lineHeight: 1.5,
              border: '2px solid var(--ink)', borderRadius: 12, outline: 'none',
              fontFamily: 'inherit', fontWeight: 500, background: 'var(--bg)', color: 'var(--ink)', resize: 'vertical',
            }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13, color: 'var(--ink-2)' }}>
            <span style={{ color: prompt.length >= 10 ? 'var(--green)' : 'var(--muted)', fontWeight: 700 }}>
              {prompt.length >= 10 ? '✓ Ready to generate' : '• min 10 chars'}
            </span>
            <span className="mono">{prompt.length}/500</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {['Aaj ka motivation', 'Diwali sale promo', 'Subah ki shloka', 'Funny family skit', 'Startup tips'].map(s => (
              <button key={s} onClick={() => setPrompt(s + ' — make it viral')} style={{
                padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                background: 'var(--bg-2)', border: '2px solid var(--line-strong)', cursor: 'pointer', color: 'var(--ink)',
              }}>+ {s}</button>
            ))}
          </div>
        </Card>

        {/* Style */}
        <Card>
          <SectionLabel n="02" title="Style" sub="GPT-4o ye style mein script likhega" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {STYLES.map(s => (
              <button key={s.id} onClick={() => setStyle(s.id)} style={pickerStyle(style === s.id)}>
                <div style={{ fontSize: 36 }}>{s.emoji}</div>
                <div style={{ fontWeight: 900, fontSize: 14, marginTop: 6 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: style === s.id ? '#fff' : 'var(--muted)', marginTop: 2 }}>{s.desc}</div>
              </button>
            ))}
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <Card>
            <SectionLabel n="03" title="Language" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[{id:'hi',label:'🇮🇳 हिंदी'},{id:'en',label:'🌐 English'},{id:'hg',label:'✨ Hinglish'}].map(l => (
                <button key={l.id} onClick={() => setLanguage(l.id)} style={{
                  padding: '12px 16px', borderRadius: 12,
                  border: '2px solid var(--ink)',
                  background: language === l.id ? 'var(--orange)' : 'var(--card)',
                  color: language === l.id ? '#fff' : 'var(--ink)',
                  fontWeight: 800, fontSize: 15, textAlign: 'left',
                  boxShadow: language === l.id ? '3px 3px 0 var(--ink)' : 'none', cursor: 'pointer',
                }}>{l.label}</button>
              ))}
            </div>
          </Card>
          <Card>
            <SectionLabel n="04" title="Duration" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[{d:30,n:'Best for Reels'},{d:60,n:'Standard'},{d:90,n:'Long-form'}].map(o => (
                <button key={o.d} onClick={() => setDuration(o.d)} style={{
                  padding: '12px 16px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  border: '2px solid var(--ink)',
                  background: duration === o.d ? 'var(--orange)' : 'var(--card)',
                  color: duration === o.d ? '#fff' : 'var(--ink)',
                  fontWeight: 800, fontSize: 15,
                  boxShadow: duration === o.d ? '3px 3px 0 var(--ink)' : 'none', cursor: 'pointer',
                }}>
                  <span>{o.d}s</span>
                  <span style={{ fontSize: 12, opacity: .8 }}>{o.n}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <SectionLabel n="05" title="Voice" sub="Studio-quality MiniMax HD" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {VOICES.map(v => (
              <button key={v.id} onClick={() => setVoice(v.id)} style={{...pickerStyle(voice === v.id), position: 'relative'}}>
                <div style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 999, background: voice === v.id ? '#fff' : 'var(--orange)', color: voice === v.id ? 'var(--orange)' : '#fff', display: 'grid', placeItems: 'center', fontSize: 12 }}>▶</div>
                <div style={{ fontSize: 36 }}>{v.emoji}</div>
                <div style={{ fontWeight: 900, fontSize: 14, marginTop: 6 }}>{v.name}</div>
                <div style={{ fontSize: 11, color: voice === v.id ? '#fff' : 'var(--muted)', marginTop: 2 }}>{v.lang}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <SectionLabel n="06" title="Character" sub="Optional · GPT will write in their voice" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {CHARACTERS.map(c => (
              <button key={c.id} onClick={() => setCharacter(character === c.id ? null : c.id)} style={{
                padding: 14, borderRadius: 14, textAlign: 'left',
                border: '2px solid var(--ink)',
                background: character === c.id ? 'var(--orange)' : 'var(--card)',
                color: character === c.id ? '#fff' : 'var(--ink)',
                boxShadow: character === c.id ? '3px 3px 0 var(--ink)' : 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: character === c.id ? 'rgba(255,255,255,.2)' : 'var(--bg-2)',
                  display: 'grid', placeItems: 'center', fontSize: 22,
                }}>{c.emoji}</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 14 }}>{c.name}</div>
                  <div style={{ fontSize: 11, opacity: .8 }}>{c.desc} · {c.lang}</div>
                </div>
              </button>
            ))}
          </div>
          {character && <button onClick={() => setCharacter(null)} style={{ marginTop: 10, background: 'transparent', border: 'none', color: 'var(--muted)', fontWeight: 700, cursor: 'pointer' }}>✕ Clear character</button>}
        </Card>

        <button onClick={() => go('generation')} className="btn-hard" style={{ width: '100%', fontSize: 22, padding: '22px', marginTop: 12 }}>
          🎬 Video Banao! · ~45s · 1 credit
        </button>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 12 }}>You'll have <b>2 credits</b> left after this</p>
      </div>
    </AppShell>
  );
}

function Card({ children }) {
  return (
    <div style={{
      background: 'var(--card)', borderRadius: 18,
      border: '2px solid var(--ink)', boxShadow: '5px 5px 0 var(--ink)',
      padding: 24, marginBottom: 18,
    }}>{children}</div>
  );
}
function SectionLabel({ n, title, sub }) {
  return (
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'baseline', gap: 12 }}>
      <span className="mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--orange-dark)' }}>{n}</span>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}
const pickerStyle = (active) => ({
  padding: 14, borderRadius: 14, textAlign: 'center',
  border: '2px solid var(--ink)',
  background: active ? 'var(--orange)' : 'var(--card)',
  color: active ? '#fff' : 'var(--ink)',
  boxShadow: active ? '3px 3px 0 var(--ink)' : 'none',
  cursor: 'pointer',
});

// ===== Generation loading =====
function ScreenGeneration() {
  const { go } = useRoute();
  const [pct, setPct] = React.useState(0);
  const [step, setStep] = React.useState(0);
  const steps = [
    { label: 'Script likha ja raha hai', sub: 'GPT-4o · narration + scenes', emoji: '✍️', pctTo: 22 },
    { label: 'Voiceover record ho rahi hai', sub: 'MiniMax HD · Rohit (Hindi M)', emoji: '🎙️', pctTo: 44 },
    { label: 'Cinematic clips banaye ja rahe', sub: 'WAN2.1 · 4 scenes', emoji: '🎥', pctTo: 70 },
    { label: 'Music compose ho raha hai', sub: 'Suno · upbeat motivation', emoji: '🎵', pctTo: 78 },
    { label: 'Final compose + captions', sub: 'FFmpeg · 1080×1920 9:16', emoji: '🎬', pctTo: 95 },
    { label: 'Done! Reel ready 🎉', sub: 'Uploading to CDN', emoji: '✨', pctTo: 100 },
  ];
  React.useEffect(() => {
    const id = setInterval(() => {
      setPct(p => {
        const target = steps[step].pctTo;
        if (p >= target - 1) {
          if (step < steps.length - 1) { setStep(s => s + 1); return p + 1; }
          clearInterval(id);
          setTimeout(() => go('preview'), 1500);
          return 100;
        }
        return p + 1;
      });
    }, 90);
    return () => clearInterval(id);
  }, [step]);

  return (
    <AppShell active="create" label="05 Generation">
      <div style={{ maxWidth: 880, margin: '40px auto', textAlign: 'center' }}>
        <span className="sticker sticker--saffron wiggle" style={{ marginBottom: 16 }}>⏳ ~45 seconds · don't close</span>
        <h1 className="display" style={{ fontSize: 64, margin: '12px 0 8px' }}>AI is cooking 🍳</h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 17, marginBottom: 32 }}>Aapka reel ban raha hai. Cha-pani le lo.</p>

        {/* Big circular progress */}
        <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 32px' }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--bg-2)" strokeWidth="8" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--orange)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 276} 276`} style={{ transition: 'stroke-dasharray .3s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <div className="display" style={{ fontSize: 44, color: 'var(--orange-dark)' }}>{pct}<span style={{ fontSize: 24 }}>%</span></div>
          </div>
        </div>

        <div style={{
          background: 'var(--card)', borderRadius: 18, border: '2px solid var(--ink)',
          boxShadow: '5px 5px 0 var(--ink)', padding: 24, textAlign: 'left', maxWidth: 560, margin: '0 auto',
        }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 0', borderBottom: i < steps.length - 1 ? '1px dashed var(--line)' : 'none',
              opacity: i > step ? 0.4 : 1,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: i < step ? 'var(--green)' : i === step ? 'var(--orange)' : 'var(--bg-2)',
                display: 'grid', placeItems: 'center', fontSize: 18,
                border: '2px solid var(--ink)',
              }}>
                {i < step ? '✓' : i === step ? <span className="spin" style={{ display: 'inline-block', width: 18, height: 18, border: '2.5px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }}></span> : s.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.sub}</div>
              </div>
              {i === step && <span className="mono" style={{ fontSize: 12, color: 'var(--orange-dark)', fontWeight: 800 }}>active</span>}
            </div>
          ))}
        </div>

        <p style={{ marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>💡 Tip: Aapka credit consumed hoga sirf success pe</p>
      </div>
    </AppShell>
  );
}

// ===== Preview =====
function ScreenPreview() {
  const { go } = useRoute();
  const [tab, setTab] = React.useState('caption');
  const [caption, setCaption] = React.useState('Aaj ka motivation 🔥 Mehnat ka phal meetha hota hai. Apne sapne todo, junoon banao. #motivation #hindi #reels');
  const [showPublish, setShowPublish] = React.useState(false);

  return (
    <AppShell active="dashboard" label="06 Preview">
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 32, alignItems: 'flex-start' }}>
        {/* Left: phone */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <button onClick={() => go('dashboard')} style={{ background: 'transparent', border: 'none', fontWeight: 700, color: 'var(--ink-2)', cursor: 'pointer' }}>← back</button>
          </div>
          <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, transform: 'rotate(8deg)', zIndex: 3 }}>
              <span className="sticker sticker--green wiggle" style={{ fontSize: 13 }}>viral 92 🔥</span>
            </div>
            <PhoneReel reel={{ ...SAMPLE_REELS[0], creator: '@your.handle' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn-hard ghost" style={{ flex: 1, fontSize: 13 }}>↓ Download MP4</button>
            <button className="btn-hard ghost" style={{ flex: 1, fontSize: 13 }}>↻ Regenerate</button>
          </div>
        </div>

        {/* Right: details */}
        <div>
          <span className="sticker sticker--orange" style={{ marginBottom: 12 }}>✨ Generated in 47 seconds</span>
          <h1 className="display" style={{ fontSize: 48, margin: '8px 0 8px' }}>Aaj ka motivation 🔥</h1>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, fontSize: 14, color: 'var(--ink-2)' }}>
            <span>📅 just now</span>·<span>⏱️ 60s · 1080×1920</span>·<span>🎙️ Rohit (Hindi)</span>·<span>📦 4.2 MB</span>
          </div>

          <ViralScore score={92} />

          {/* tabs */}
          <div style={{ display: 'flex', gap: 0, marginTop: 28, marginBottom: 16, borderBottom: '2px solid var(--ink)' }}>
            {[
              { id: 'caption', label: '📝 Caption' },
              { id: 'script', label: '✍️ Script' },
              { id: 'scenes', label: '🎬 Scenes' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '10px 16px', background: 'transparent', border: 'none',
                fontWeight: 800, fontSize: 14, cursor: 'pointer',
                color: tab === t.id ? 'var(--orange-dark)' : 'var(--ink-2)',
                borderBottom: tab === t.id ? '3px solid var(--orange)' : '3px solid transparent',
                marginBottom: -2,
              }}>{t.label}</button>
            ))}
          </div>

          {tab === 'caption' && (
            <div>
              <textarea value={caption} onChange={e => setCaption(e.target.value)} style={{
                width: '100%', minHeight: 120, padding: 14, fontSize: 15,
                border: '2px solid var(--ink)', borderRadius: 12, outline: 'none',
                fontFamily: 'inherit', background: 'var(--card)', color: 'var(--ink)', resize: 'vertical',
              }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {['#motivation', '#hindi', '#reels', '#daily', '#mehnat', '#viral2026'].map(h => (
                  <span key={h} style={{ padding: '4px 10px', background: 'var(--bg-2)', borderRadius: 6, fontSize: 12, fontWeight: 700, color: 'var(--orange-dark)' }}>{h}</span>
                ))}
              </div>
            </div>
          )}
          {tab === 'script' && (
            <div style={{ background: 'var(--card)', border: '2px solid var(--ink)', borderRadius: 12, padding: 20, lineHeight: 1.7, fontSize: 15 }}>
              <p className="hindi" style={{ margin: '0 0 12px' }}>"Suniye! Kya aap roz uthte hain ek hi feeling ke saath?"</p>
              <p className="hindi" style={{ margin: '0 0 12px' }}>Sapne dekhe the bachpan mein... ab kahan hain woh?</p>
              <p className="hindi" style={{ margin: '0 0 12px' }}>Ek baat yaad rakho — mehnat ka phal meetha hota hai.</p>
              <p className="hindi" style={{ margin: 0 }}>Aaj se shuru karo. Tumhari kahani abhi likhi ja rahi hai. 🔥</p>
            </div>
          )}
          {tab === 'scenes' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[1,2,3,4].map(s => (
                <div key={s} className={`stripes reel-grad-${s}`} style={{ aspectRatio: '9/16', borderRadius: 10, border: '2px solid var(--ink)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 6, left: 6, padding: '2px 6px', background: 'rgba(0,0,0,.5)', borderRadius: 4, color: '#fff', fontSize: 10, fontWeight: 800 }}>Scene {s}</div>
                  <div style={{ position: 'absolute', bottom: 6, right: 6, padding: '2px 6px', background: 'rgba(0,0,0,.5)', borderRadius: 4, color: '#fff', fontSize: 10 }}>{[8,12,15,10][s-1]}s</div>
                </div>
              ))}
            </div>
          )}

          {/* Publish */}
          <div style={{ marginTop: 32, background: 'var(--ink)', color: 'var(--bg)', padding: 24, borderRadius: 18, border: '2px solid var(--ink)', boxShadow: '5px 5px 0 var(--orange)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 22 }}>📲 Publish where?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={() => setShowPublish('ig')} style={publishBtn('linear-gradient(135deg, #833AB4, #FD1D1D, #FCB045)')}>
                📸 Instagram Reels
              </button>
              <button onClick={() => setShowPublish('yt')} style={publishBtn('linear-gradient(135deg, #FF0000, #C40000)')}>
                ▶ YouTube Shorts
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button style={publishBtn('#25D366', true)}>💬 WhatsApp</button>
              <button style={publishBtn('#1DA1F2', true)}>𝕏 Twitter</button>
              <button style={publishBtn('var(--bg-2)', true, 'var(--ink)')}>↗ Other</button>
            </div>
          </div>

          {showPublish && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 20,
            }} onClick={() => setShowPublish(false)}>
              <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--card)', color: 'var(--ink)', borderRadius: 20, padding: 32, maxWidth: 480, width: '100%',
                border: '2px solid var(--ink)', boxShadow: '8px 8px 0 var(--orange)',
              }}>
                <h3 className="display" style={{ fontSize: 32, margin: '0 0 12px' }}>{showPublish === 'ig' ? 'Posted! 🎉' : 'Published! 🎉'}</h3>
                <p style={{ color: 'var(--ink-2)' }}>Your reel is live on {showPublish === 'ig' ? 'Instagram Reels' : 'YouTube Shorts'}.</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                  <button onClick={() => { setShowPublish(false); go('create'); }} className="btn-hard" style={{ flex: 1 }}>✨ Make another</button>
                  <button onClick={() => setShowPublish(false)} className="btn-hard ghost" style={{ flex: 1 }}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

const publishBtn = (bg, small, color = '#fff') => ({
  padding: small ? '10px 14px' : '14px 18px', borderRadius: 12,
  background: bg, color, border: 'none', fontWeight: 800, fontSize: small ? 13 : 15,
  cursor: 'pointer', boxShadow: '3px 3px 0 rgba(0,0,0,.3)',
});

function ViralScore({ score }) {
  const segments = 10;
  return (
    <div style={{ background: 'var(--card)', border: '2px solid var(--ink)', borderRadius: 16, padding: 18, boxShadow: '4px 4px 0 var(--ink)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🔥 Viral Score</span>
        <span className="display" style={{ fontSize: 28, color: 'var(--orange-dark)' }}>{score}/100</span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 14, borderRadius: 4,
            background: i < Math.round(score / 10) ? 'var(--orange)' : 'var(--bg-2)',
            border: '2px solid var(--ink)',
          }}></div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 12, fontSize: 11 }}>
        <ScoreBit label="Hook" v="A+" />
        <ScoreBit label="Caption" v="A" />
        <ScoreBit label="Length" v="A+" />
        <ScoreBit label="Style" v="A" />
      </div>
    </div>
  );
}
function ScoreBit({ label, v }) {
  return (
    <div style={{ background: 'var(--bg-2)', borderRadius: 6, padding: '6px 8px' }}>
      <div style={{ color: 'var(--muted)', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--green)' }}>{v}</div>
    </div>
  );
}

// ===== Pricing =====
function ScreenPricing() {
  const { go } = useRoute();
  const plans = [
    { id: 'free', name: 'Free', price: '0', tag: 'Try it out', features: ['5 reels / month', 'WAN2.1 video', '2 voices', 'Instagram only', 'ReelCraft watermark', 'Email support'], cta: 'Start free', highlight: false },
    { id: 'pro', name: 'Pro', price: '499', tag: 'Most popular 🔥', features: ['Unlimited reels', 'VEO3 premium video', '12 voices + 6 characters', 'Instagram + YouTube + WhatsApp', 'No watermark', 'Priority queue', 'WhatsApp support 24/7'], cta: 'Go Pro', highlight: true },
    { id: 'biz', name: 'Business', price: '1,999', tag: 'For agencies', features: ['Everything in Pro', 'API access', 'Bulk generation', 'Scheduling calendar', 'White-label option', '5 team members', 'Dedicated manager'], cta: 'Talk to sales', highlight: false },
  ];
  return (
    <AppShell active="pricing" label="08 Pricing">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <span className="sticker sticker--orange wiggle">💎 Simple & honest pricing</span>
        <h1 className="display" style={{ fontSize: 'clamp(48px, 6vw, 80px)', margin: '12px 0 8px' }}>
          Sasta. <span style={{ color: 'var(--orange)' }}>Tikau.</span> Tezz.
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 18 }}>5 free reels every month — koi credit card nahi.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
        {plans.map(p => (
          <div key={p.id} style={{
            background: p.highlight ? 'var(--orange)' : 'var(--card)',
            color: p.highlight ? '#fff' : 'var(--ink)',
            borderRadius: 24, border: '2px solid var(--ink)',
            boxShadow: p.highlight ? '10px 10px 0 var(--ink)' : '6px 6px 0 var(--ink)',
            padding: 32, position: 'relative',
            transform: p.highlight ? 'translateY(-12px)' : 'none',
          }}>
            {p.highlight && (
              <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%) rotate(-3deg)' }}>
                <span className="sticker sticker--saffron" style={{ fontSize: 12 }}>{p.tag}</span>
              </div>
            )}
            <div style={{ fontSize: 14, fontWeight: 800, opacity: .8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{p.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 800 }}>₹</span>
              <span className="display" style={{ fontSize: 64, lineHeight: 1 }}>{p.price}</span>
              <span style={{ fontSize: 16, opacity: .8 }}>/mo</span>
            </div>
            {!p.highlight && <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>{p.tag}</div>}
            {p.highlight && <div style={{ fontSize: 13, opacity: .9, marginBottom: 16 }}>billed monthly · cancel anytime</div>}
            <button className="btn-hard" style={{
              width: '100%', marginBottom: 24, fontSize: 16,
              background: p.highlight ? '#fff' : 'var(--orange)',
              color: p.highlight ? 'var(--ink)' : '#fff',
            }}>{p.cta} →</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {p.features.map(f => (
                <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14 }}>
                  <span style={{ color: p.highlight ? '#fff' : 'var(--green)', fontWeight: 900 }}>✓</span>{f}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 60, background: 'var(--bg-2)', padding: 32, borderRadius: 20, border: '2px solid var(--ink)', boxShadow: '5px 5px 0 var(--ink)', textAlign: 'center', maxWidth: 800, margin: '60px auto 0' }}>
        <div style={{ fontSize: 32 }}>🎁</div>
        <h3 className="display" style={{ fontSize: 32, margin: '8px 0' }}>Refer a friend, get 5 credits</h3>
        <p style={{ color: 'var(--ink-2)', margin: '0 0 16px' }}>Both of you get 5 free reels. No limit.</p>
        <button className="btn-hard">Copy referral link</button>
      </div>
    </AppShell>
  );
}

Object.assign(window, { ScreenDashboard, ScreenTemplates, ScreenCreate, ScreenGeneration, ScreenPreview, ScreenPricing, AppShell });
