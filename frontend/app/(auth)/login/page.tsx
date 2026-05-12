"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api, { saveAuth } from "@/lib/api";

const LANGS = [
  { value: "hi",       label: "हिंदी",   flag: "🇮🇳" },
  { value: "en",       label: "English",  flag: "🌐" },
  { value: "hinglish", label: "Hinglish", flag: "✨" },
];

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone]           = useState("");
  const [name, setName]             = useState("");
  const [langPref, setLangPref]     = useState("hi");
  const [step, setStep]             = useState<"phone" | "otp">("phone");
  const [otp, setOtp]               = useState(["","","","","",""]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [devOtp, setDevOtp]         = useState<string | null>(null);
  const [countdown, setCountdown]   = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const formatPhone = (p: string) => {
    const t = p.trim();
    if (t.startsWith("+")) return t;
    if (t.length === 10)    return `+91${t}`;
    return `+${t}`;
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!phone) { setError("Enter a phone number"); return; }
    setLoading(true); setError(null); setDevOtp(null);
    try {
      const { data } = await api.post("/auth/send-otp", { phone: formatPhone(phone) });
      setStep("otp"); setCountdown(30);
      if (data.otp) setDevOtp(data.otp);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send OTP");
    } finally { setLoading(false); }
  };

  const handleOtpInput = (i: number, val: string) => {
    const digit = val.replace(/\D/g,"").slice(-1);
    const next = [...otp]; next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i+1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i-1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) { setError("Enter all 6 digits"); return; }
    setLoading(true); setError(null);
    try {
      const { data } = await api.post("/auth/verify-otp", {
        phone: formatPhone(phone),
        otp: code,
        name: name || undefined,
        language_pref: langPref,
      });
      saveAuth(data);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid or expired OTP");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      {/* Left panel — orange visual */}
      <div
        className="hidden md:flex"
        style={{
          width: "50%", background: "var(--orange-dark)",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: 48, position: "relative", overflow: "hidden",
        }}
      >
        {/* Background pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.08,
          backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
          backgroundSize: "20px 20px",
        }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", color: "#fff" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 32 }}>
            <span style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 56, height: 56, fontSize: 28,
              background: "#fff", borderRadius: 14,
              border: "2px solid var(--ink)", boxShadow: "3px 3px 0 var(--ink)",
              transform: "rotate(-4deg)",
            }}>🎬</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 32, letterSpacing: "-0.01em" }}>ReelCraft</span>
          </div>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.4)",
            borderRadius: 999, padding: "4px 14px", marginBottom: 28,
            fontSize: 13, fontWeight: 800, letterSpacing: "0.05em",
            transform: "rotate(-2deg)",
          }}>
            🔥 5 FREE credits on signup
          </div>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 4vw, 52px)", lineHeight: 1.05, marginBottom: 16 }}>
            CREATE VIRAL<br />REELS IN<br />60 SECONDS
          </h1>
          <p style={{ fontSize: 16, opacity: 0.85, maxWidth: 340, margin: "0 auto 40px" }}>
            AI writes the script, voices it in Hindi or English, adds cinematic video + music. You just share.
          </p>

          {/* Proof points */}
          <div style={{ display: "inline-flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
            {["GPT-4o script generation", "Hindi / Hinglish / English voices", "Cinematic AI video clips", "Auto captions + watermark"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600 }}>
                <span style={{
                  width: 22, height: 22, background: "rgba(255,255,255,0.2)",
                  borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                }}>✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, background: "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 32,
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          {/* Mobile logo */}
          <div className="flex md:hidden" style={{ alignItems: "center", gap: 10, marginBottom: 32 }}>
            <span style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 40, height: 40, fontSize: 20,
              background: "var(--orange)", borderRadius: 10,
              border: "2px solid var(--ink)", boxShadow: "2px 2px 0 var(--ink)",
              transform: "rotate(-4deg)",
            }}>🎬</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--ink)" }}>ReelCraft</span>
          </div>

          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, color: "var(--ink)", marginBottom: 6 }}>
            {step === "phone" ? "GET STARTED" : "VERIFY OTP"}
          </h2>
          <p style={{ color: "var(--ink-2)", marginBottom: 28, fontSize: 15 }}>
            {step === "phone"
              ? "Enter your phone number — no password needed"
              : `Code sent to +91 ${phone.replace(/^\+91/,"")}`}
          </p>

          {step === "phone" ? (
            <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Phone */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink)", marginBottom: 8 }}>
                  Mobile Number
                </label>
                <div style={{ display: "flex", border: "2px solid var(--ink)", borderRadius: "var(--r-sm)", overflow: "hidden", background: "#fff" }}>
                  <div style={{
                    padding: "12px 14px", background: "var(--orange)", color: "#fff",
                    fontWeight: 800, fontSize: 14, borderRight: "2px solid var(--ink)",
                    whiteSpace: "nowrap",
                  }}>+91</div>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      flex: 1, border: "none", outline: "none",
                      padding: "12px 14px", fontSize: 15, fontFamily: "var(--font-body)",
                      color: "var(--ink)", background: "transparent",
                    }}
                    required autoFocus
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink)", marginBottom: 8 }}>
                  Your Name <span style={{ fontWeight: 400, textTransform: "none", color: "var(--muted)" }}>(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Rahul Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Language */}
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink)", marginBottom: 8 }}>
                  Preferred Language
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {LANGS.map((l) => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => setLangPref(l.value)}
                      style={{
                        padding: "10px 8px", borderRadius: "var(--r-sm)",
                        border: "2px solid var(--ink)", cursor: "pointer",
                        fontFamily: "var(--font-body)", fontWeight: 700, fontSize: 13,
                        background: langPref === l.value ? "var(--orange)" : "#fff",
                        color: langPref === l.value ? "#fff" : "var(--ink)",
                        boxShadow: langPref === l.value ? "3px 3px 0 var(--ink)" : "none",
                        transition: "all 0.08s ease",
                      }}
                    >
                      {l.flag} {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ background: "#FFF0EB", border: "2px solid var(--orange)", borderRadius: "var(--r-sm)", padding: "10px 14px", fontSize: 14, color: "var(--orange-dark)", fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-hard" style={{ width: "100%", padding: "14px", fontSize: 16, justifyContent: "center" }}>
                {loading ? <span className="spin" style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} /> : "Send OTP Code 🚀"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {devOtp && (
                <div style={{ background: "#F0F5EE", border: "2px solid var(--green)", borderRadius: "var(--r-sm)", padding: "10px 14px", fontSize: 14, color: "var(--green)", fontWeight: 700 }}>
                  Dev OTP: {devOtp}
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink)", marginBottom: 12 }}>
                  6-Digit OTP Code
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpInput(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                      style={{
                        width: 48, height: 60, textAlign: "center",
                        fontSize: 24, fontWeight: 900,
                        border: "2px solid var(--ink)", borderRadius: "var(--r-sm)",
                        fontFamily: "var(--font-body)", color: "var(--ink)",
                        background: digit ? "var(--orange-lt)" : "#fff",
                        boxShadow: digit ? "3px 3px 0 var(--orange)" : "none",
                        outline: "none", transition: "all 0.08s ease",
                      }}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ background: "#FFF0EB", border: "2px solid var(--orange)", borderRadius: "var(--r-sm)", padding: "10px 14px", fontSize: 14, color: "var(--orange-dark)", fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-hard" style={{ width: "100%", padding: "14px", fontSize: 16, justifyContent: "center" }}>
                {loading ? <span className="spin" style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block" }} /> : "Verify & Log In 🎉"}
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                <button
                  type="button"
                  onClick={() => { setStep("phone"); setError(null); setOtp(["","","","","",""]); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "var(--ink-2)", fontFamily: "var(--font-body)" }}
                >
                  ← Change number
                </button>
                {countdown > 0
                  ? <span style={{ color: "var(--muted)", fontSize: 13 }}>Resend in {countdown}s</span>
                  : <button type="button" onClick={handleSendOtp} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, color: "var(--orange)", fontFamily: "var(--font-body)" }}>
                      Resend OTP
                    </button>
                }
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
