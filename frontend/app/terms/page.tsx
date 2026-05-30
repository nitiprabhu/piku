import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — ReelCraft",
  description: "Terms governing your use of ReelCraft.",
};

export default function TermsPage() {
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
        <Link href="/login" style={{
          padding: "8px 20px", background: "var(--orange)", color: "#fff",
          border: "2px solid var(--ink)", borderRadius: 8,
          fontWeight: 800, fontSize: 14, textDecoration: "none",
          boxShadow: "3px 3px 0 var(--ink)",
        }}>Get Started</Link>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "48px 24px 80px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--ink)", marginBottom: 8 }}>
          Terms of Service
        </h1>
        <p style={{ color: "var(--ink-muted)", fontSize: 14, marginBottom: 40 }}>
          Last updated: May 22, 2026
        </p>

        <div style={{
          background: "#fff", border: "2px solid var(--ink)", borderRadius: 16,
          boxShadow: "4px 4px 0 var(--ink)", padding: "40px 48px",
          display: "flex", flexDirection: "column", gap: 36,
        }}>
          <Section title="1. Acceptance">
            <p>By creating an account or using ReelCraft, you agree to these Terms of Service. If you do not agree, do not use ReelCraft.</p>
          </Section>

          <Section title="2. The Service">
            <p>ReelCraft provides AI-powered tools to generate short-form video content (Reels, Shorts) and publish them to your social media accounts. We use third-party AI models (OpenAI, MiniMax, Suno, WAN2.1, VEO3) to generate scripts, voice, music, and video clips.</p>
          </Section>

          <Section title="3. Ownership of Generated Content">
            <p><strong>You own 100% of the videos you generate using ReelCraft.</strong></p>
            <p>ReelCraft does not claim any ownership, rights, or license over content you create using the platform. You are free to publish, monetize, and distribute your generated content as you see fit, subject to the terms of the platforms you publish to (Instagram, YouTube).</p>
          </Section>

          <Section title="4. Your Responsibilities">
            <ul>
              <li>You are solely responsible for all content you generate and publish through ReelCraft.</li>
              <li>You must comply with Instagram's, YouTube's, and all other platforms' terms of service and community guidelines.</li>
              <li>You must not use ReelCraft to generate content that is illegal, defamatory, sexually explicit, harassing, or that violates any third party's rights.</li>
              <li>You must not use ReelCraft to spread misinformation, impersonate individuals, or engage in deceptive practices.</li>
              <li>You are responsible for ensuring you have rights to any input material (text, descriptions) you provide.</li>
            </ul>
          </Section>

          <Section title="5. Prohibited Uses">
            <p>You may not use ReelCraft to:</p>
            <ul>
              <li>Generate spam or bulk content for artificial engagement</li>
              <li>Create content that violates the Indian Information Technology Act 2000 or any applicable law</li>
              <li>Impersonate any person, brand, or public figure</li>
              <li>Generate content involving minors in inappropriate contexts</li>
              <li>Attempt to reverse-engineer, scrape, or abuse our API</li>
              <li>Share your account credentials with others</li>
            </ul>
          </Section>

          <Section title="6. Credits and Payments">
            <p>ReelCraft operates on a credit-based system. Each video generation costs 1 credit. Free accounts receive 5 credits on signup. Additional credits are available via paid plans.</p>
            <p>Payments are processed by Razorpay. All fees are non-refundable except as required by applicable law or at our sole discretion.</p>
            <p>We reserve the right to change pricing with reasonable advance notice.</p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>ReelCraft is provided "as is" without warranties of any kind. To the fullest extent permitted by law:</p>
            <ul>
              <li>We are not liable for platform account bans, demonetization, or any consequences resulting from content you publish.</li>
              <li>We are not liable for AI-generated content that is inaccurate, inappropriate, or that infringes third-party rights — you are responsible for reviewing content before publishing.</li>
              <li>Our total liability to you for any claim is limited to the amount you paid us in the 3 months preceding the claim.</li>
            </ul>
          </Section>

          <Section title="8. Intellectual Property">
            <p>The ReelCraft platform, brand, and underlying technology are owned by ReelCraft. You may not copy, distribute, or create derivative works from our platform without written permission.</p>
          </Section>

          <Section title="9. Termination">
            <p>We may suspend or terminate your account if you violate these Terms, without prior notice. You may delete your account at any time by contacting us at <a href="mailto:nithishjprabhu@gmail.com" style={{ color: "var(--orange)", fontWeight: 700 }}>nithishjprabhu@gmail.com</a>.</p>
          </Section>

          <Section title="10. Governing Law">
            <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the competent courts in India.</p>
          </Section>

          <Section title="11. Contact">
            <p>For questions about these Terms:<br />
            Email: <a href="mailto:nithishjprabhu@gmail.com" style={{ color: "var(--orange)", fontWeight: 700 }}>nithishjprabhu@gmail.com</a></p>
          </Section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: "var(--ink)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#fff" }}>ReelCraft</span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/privacy" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: 700 }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", textDecoration: "none", fontWeight: 700 }}>Terms</Link>
            <Link href="/data-deletion" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: 700 }}>Data Deletion</Link>
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>© 2026 ReelCraft. Built for Indian creators.</div>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink)", marginBottom: 12 }}>{title}</h2>
      <div style={{ color: "var(--ink)", lineHeight: 1.7, fontSize: 15, display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </section>
  );
}
