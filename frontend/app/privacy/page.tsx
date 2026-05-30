import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — ReelCraft",
  description: "How ReelCraft collects, uses, and protects your data.",
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ color: "var(--ink-muted)", fontSize: 14, marginBottom: 40 }}>
          Last updated: May 22, 2026
        </p>

        <div style={{
          background: "#fff", border: "2px solid var(--ink)", borderRadius: 16,
          boxShadow: "4px 4px 0 var(--ink)", padding: "40px 48px",
          display: "flex", flexDirection: "column", gap: 36,
        }}>
          <Section title="1. Who We Are">
            <p>ReelCraft is an AI-powered short video creation platform built for Indian content creators. We help you generate, edit, and publish Reels and YouTube Shorts using artificial intelligence.</p>
            <p>For privacy-related questions, contact us at: <a href="mailto:nithishjprabhu@gmail.com" style={{ color: "var(--orange)", fontWeight: 700 }}>nithishjprabhu@gmail.com</a></p>
          </Section>

          <Section title="2. What We Collect">
            <ul>
              <li><strong>Phone number</strong> — used for OTP-based authentication. We do not share it with third parties.</li>
              <li><strong>Name</strong> — optional display name you provide during signup.</li>
              <li><strong>Instagram OAuth token</strong> — when you connect Instagram, we store an encrypted long-lived access token to publish Reels on your behalf.</li>
              <li><strong>YouTube OAuth token</strong> — when you connect YouTube, we store an encrypted access token and refresh token to upload Shorts on your behalf.</li>
              <li><strong>AI-generated video content</strong> — videos you generate are stored temporarily on our servers (Cloudflare R2 or local fallback) to enable download and publishing.</li>
              <li><strong>Usage data</strong> — number of videos generated, credits used, plan type.</li>
            </ul>
            <p>We do not collect payment card details directly. Payments are processed by Razorpay under their own privacy policy.</p>
          </Section>

          <Section title="3. How We Use Your Data">
            <ul>
              <li>Authenticate you via phone OTP</li>
              <li>Generate AI videos based on your prompts</li>
              <li>Publish content to Instagram or YouTube on your behalf (only when you explicitly click "Publish")</li>
              <li>Process payments and manage your subscription plan</li>
              <li>Improve our service and fix bugs</li>
            </ul>
            <p>We never sell your data. We never publish content without your explicit action.</p>
          </Section>

          <Section title="4. Data Retention">
            <ul>
              <li><strong>OAuth tokens</strong> — deleted immediately when you disconnect Instagram or YouTube from Settings.</li>
              <li><strong>Generated videos</strong> — stored until you delete the project or request account deletion.</li>
              <li><strong>Account data</strong> — retained until you request deletion. See Section 5 for how to request deletion.</li>
            </ul>
          </Section>

          <Section title="5. Your Rights & Data Deletion">
            <p>You have the right to request deletion of all your personal data at any time.</p>
            <ul>
              <li><strong>Via the app</strong> — go to Settings and disconnect your social accounts. Contact us to delete your account entirely.</li>
              <li><strong>Via email</strong> — email <a href="mailto:nithishjprabhu@gmail.com" style={{ color: "var(--orange)", fontWeight: 700 }}>nithishjprabhu@gmail.com</a> with subject "Delete my account".</li>
              <li><strong>Via Instagram</strong> — if you revoke ReelCraft's access from your Instagram app settings, Meta notifies us automatically and we delete your data within 24 hours. You can check deletion status at <Link href="/data-deletion" style={{ color: "var(--orange)", fontWeight: 700 }}>/data-deletion</Link>.</li>
            </ul>
          </Section>

          <Section title="6. Third-Party Services">
            <p>ReelCraft uses the following third-party services, each governed by their own privacy policies:</p>
            <ul>
              <li><strong>AI processing services</strong> — script generation, voice synthesis, music generation, and video generation are handled by cloud AI providers. These services receive only your text prompt — no personally identifiable information (phone number, name, or tokens) is shared with them.</li>
              <li><strong>Cloudflare</strong> — video file storage and CDN delivery</li>
              <li><strong>Razorpay</strong> — payment processing (governed by Razorpay's privacy policy)</li>
              <li><strong>Twilio</strong> — OTP SMS delivery (receives your phone number solely for OTP delivery)</li>
              <li><strong>Meta (Instagram Graph API)</strong> — content publishing on your behalf</li>
              <li><strong>Google (YouTube Data API v3)</strong> — content publishing on your behalf</li>
            </ul>
          </Section>

          <Section title="7. Security">
            <p>All OAuth tokens (Instagram and YouTube) are stored encrypted using AES-256 (Fernet symmetric encryption) with a server-side secret key. Tokens are never exposed in API responses or logs.</p>
            <p>All data is transmitted over HTTPS. We use JWT tokens with short expiry (15 minutes) for API authentication.</p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>ReelCraft is not directed at children under 13. We do not knowingly collect data from children under 13.</p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>We may update this policy. When we do, we update the "Last updated" date at the top. Continued use of ReelCraft after changes means you accept the updated policy.</p>
          </Section>

          <Section title="10. Contact">
            <p>For any privacy questions or data requests:<br />
            Email: <a href="mailto:nithishjprabhu@gmail.com" style={{ color: "var(--orange)", fontWeight: 700 }}>nithishjprabhu@gmail.com</a></p>
          </Section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: "var(--ink)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <span style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "#fff" }}>ReelCraft</span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/privacy" style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", textDecoration: "none", fontWeight: 700 }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", textDecoration: "none", fontWeight: 700 }}>Terms</Link>
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
