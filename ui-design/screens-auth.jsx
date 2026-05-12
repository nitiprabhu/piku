// Auth screens: Login + OTP + Onboarding

function ScreenLogin() {
  const { go } = useRoute();
  const [step, setStep] = React.useState('phone'); // phone | otp
  const [phone, setPhone] = React.useState('');
  const [name, setName] = React.useState('');
  const [language, setLanguage] = React.useState('hi');
  const [otp, setOtp] = React.useState(['', '', '', '', '', '']);
  const [error, setError] = React.useState('');
  const otpRefs = React.useRef([]);

  const sendOtp = () => {
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Phone number 10 digits ka hona chahiye');
      return;
    }
    setError('');
    setStep('otp');
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };
  const setOtpAt = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp]; next[i] = v; setOtp(next);
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const verifyOtp = () => {
    if (otp.join('').length < 6) { setError('Pura OTP daalo'); return; }
    go('dashboard');
  };

  return (
    <div className="page-in" data-screen-label="02 Login" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header simple />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, alignItems: 'stretch' }}>
        {/* Left: visual side */}
        <div style={{
          background: 'var(--orange)', color: '#fff',
          padding: 56, position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          borderRight: '2px solid var(--ink)',
        }}>
          <div>
            <span className="sticker sticker--saffron" style={{ marginBottom: 24 }}>🎁 5 FREE reels for new accounts</span>
            <h1 className="display" style={{ fontSize: 'clamp(40px, 5vw, 64px)', margin: '20px 0 16px', textShadow: '4px 4px 0 var(--ink)' }}>
              Welcome wapas!<br/><span style={{ color: 'var(--bg)' }}>Aaj kya banayenge?</span>
            </h1>
            <p style={{ fontSize: 18, opacity: .92, maxWidth: 420, lineHeight: 1.45 }}>
              50,000+ creators trust ReelCraft for daily viral reels.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <AvatarStack />
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>"Reels banane mein lagta hai 1 minute"</div>
              <div style={{ fontSize: 13, opacity: .85 }}>— Rahul, @rahul.motivation · 480K followers</div>
            </div>
          </div>
          {/* deco */}
          <div style={{ position: 'absolute', top: 30, right: 30, fontSize: 56, transform: 'rotate(15deg)' }}>🎬</div>
          <div style={{ position: 'absolute', bottom: 200, right: 60, fontSize: 36, transform: 'rotate(-10deg)' }}>✨</div>
          <div style={{ position: 'absolute', top: 240, right: 100, fontSize: 28, transform: 'rotate(20deg)' }}>🚀</div>
        </div>

        {/* Right: form */}
        <div style={{ padding: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            {step === 'phone' && (
              <>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--orange-dark)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Step 1 of 2</div>
                <h2 className="display" style={{ fontSize: 44, margin: '0 0 12px' }}>Phone number daalo</h2>
                <p style={{ color: 'var(--ink-2)', marginTop: 0, marginBottom: 28 }}>No password, no email. Bas number — OTP aayega.</p>

                <Field label="Mobile number">
                  <div style={{ display: 'flex', gap: 0 }}>
                    <div style={{
                      padding: '14px 14px', background: 'var(--bg-2)',
                      border: '2px solid var(--ink)', borderRight: 'none',
                      borderRadius: '12px 0 0 12px', fontWeight: 800,
                    }}>🇮🇳 +91</div>
                    <input
                      value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="98765 43210" inputMode="numeric"
                      style={{
                        flex: 1, padding: '14px 16px', fontSize: 16,
                        border: '2px solid var(--ink)',
                        borderRadius: '0 12px 12px 0', outline: 'none',
                        fontFamily: 'inherit', fontWeight: 600, background: 'var(--card)', color: 'var(--ink)',
                      }}
                    />
                  </div>
                </Field>

                <Field label="Naam (optional)">
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Sharma"
                    style={inputStyle} />
                </Field>

                <Field label="Language">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { id: 'hi', label: '🇮🇳 हिंदी' },
                      { id: 'en', label: '🌐 English' },
                      { id: 'hg', label: '✨ Hinglish' },
                    ].map(l => (
                      <button key={l.id} onClick={() => setLanguage(l.id)} style={{
                        padding: 12, borderRadius: 12,
                        border: '2px solid var(--ink)',
                        background: language === l.id ? 'var(--orange)' : 'var(--card)',
                        color: language === l.id ? '#fff' : 'var(--ink)',
                        fontWeight: 800, boxShadow: language === l.id ? '3px 3px 0 var(--ink)' : 'none',
                      }}>{l.label}</button>
                    ))}
                  </div>
                </Field>

                {error && <div style={{ color: '#D32F2F', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>⚠️ {error}</div>}

                <button onClick={sendOtp} className="btn-hard" style={{ width: '100%', fontSize: 18, padding: '16px', marginTop: 8 }}>
                  Send OTP →
                </button>
                <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', marginTop: 16 }}>
                  By continuing, you agree to our <a style={{ color: 'var(--orange-dark)', fontWeight: 700 }}>Terms</a>
                </p>
              </>
            )}

            {step === 'otp' && (
              <>
                <button onClick={() => setStep('phone')} style={{ background: 'transparent', border: 'none', color: 'var(--ink-2)', fontWeight: 700, marginBottom: 16, padding: 0 }}>← back</button>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--orange-dark)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Step 2 of 2</div>
                <h2 className="display" style={{ fontSize: 44, margin: '0 0 12px' }}>OTP daalo</h2>
                <p style={{ color: 'var(--ink-2)', marginBottom: 28 }}>+91 {phone || '98765 43210'} pe SMS bheja hai. Test mein bharo: <b>123456</b></p>

                <div style={{ display: 'flex', gap: 10, marginBottom: 24, justifyContent: 'space-between' }}>
                  {otp.map((d, i) => (
                    <input key={i} ref={el => otpRefs.current[i] = el}
                      value={d} onChange={e => setOtpAt(i, e.target.value)}
                      maxLength={1} inputMode="numeric"
                      style={{
                        width: 56, height: 64, textAlign: 'center', fontSize: 28, fontWeight: 900,
                        border: '2px solid var(--ink)', borderRadius: 12, outline: 'none',
                        background: 'var(--card)', color: 'var(--ink)',
                        boxShadow: d ? '3px 3px 0 var(--orange)' : 'none',
                      }} />
                  ))}
                </div>

                {error && <div style={{ color: '#D32F2F', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>⚠️ {error}</div>}

                <button onClick={verifyOtp} className="btn-hard" style={{ width: '100%', fontSize: 18, padding: '16px' }}>
                  Verify & Continue →
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, fontSize: 14 }}>
                  <a style={{ color: 'var(--ink-2)', fontWeight: 700, cursor: 'pointer' }}>Resend in 0:32</a>
                  <a onClick={() => setOtp(['1','2','3','4','5','6'])} style={{ color: 'var(--orange-dark)', fontWeight: 800, cursor: 'pointer' }}>Auto-fill demo</a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '14px 16px', fontSize: 16,
  border: '2px solid var(--ink)', borderRadius: 12, outline: 'none',
  fontFamily: 'inherit', fontWeight: 600, background: 'var(--card)', color: 'var(--ink)',
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      {children}
    </div>
  );
}

Object.assign(window, { ScreenLogin, Field, inputStyle });
