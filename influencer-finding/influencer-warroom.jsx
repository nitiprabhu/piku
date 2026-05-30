import { useState } from "react";

export default function InfluencerWarRoom() {
  const [activeTab, setActiveTab] = useState("ceo");
  const [copied, setCopied] = useState(false);

  const analyses = {
    ceo: {
      name: "Aryan Mehta",
      title: "CEO & Co-Founder",
      avatar: "AM",
      color: "#FF6B35",
      focus: "Business Strategy & Market Opportunity",
      content: `**🎯 Market Opportunity & Demand**

India's influencer marketing industry: ₹17,500 Cr (2024) → projected ₹35,000 Cr by 2027 (42% CAGR). 12M+ creators actively monetizing but 78% use manual outreach (DMs, email). Zero vernacular marketplace exists for Hindi/regional creators — ReelShorts, FaceReels are pure tools, not marketplaces.

Gap: Brands struggle to find Hindi/regional creators at scale. Current alternatives are Barter Collective (English-only, ₹100K min deals) or ad agencies (30%+ fees).

**💰 Revenue Potential**

Influencer Marketplace commission model: 12-15% per deal.
- Conservative Y1: 500 successful deals × avg ₹50K deal size × 12% = ₹30L
- Year 2: 3,000 deals × ₹75K × 12% = ₹2.7 Cr
- Upsell: Featured listings (₹2,000/mo) → 500 influencers × ₹2K = ₹12L/mo additional

Premium brand subscriptions: ₹5,000/mo for unlimited outreach + CRM → 50 brands Y1 = ₹30L ARR

**📊 Strategic Fit — The Flywheel**

Perfect timing at V1.5. ReelCraft's viral score + AI-generated portfolio becomes a TRUST SIGNAL on influencer profiles — competitors have zero way to compete here. Brands see proof of virality before hiring. Creators monetize immediately (solves "how do I earn" question).

Freemium SaaS users → Marketplace referral → marketplace commission → brand subscriptions. 3-legged flywheel.

**🏆 Competitive Landscape**

- Collabstr, AspireIQ (Instagram-only, English)
- Local plays: Klear, Upfluence (no India focus)
- Barter Collective (works, but expensive & manual)
- ReelShorts/FaceReels (pure tools, zero marketplace)

We own Hindi vernacular space if we move now.

**⚠️ Key Risks**

1. Cold start (chicken-egg): Need 1000+ quality creators + 200 brands simultaneously
   - Mitigation: Day 1 onboard 50 micro-influencers we partner with + outreach to 500 brands via GTM
2. Fake/low-quality profiles: Spam influencers padding follower counts
   - Mitigation: Mandatory Instagram/YouTube verification. 2 mandatory ReelCraft-generated videos in portfolio
3. Low deal velocity: Brands slow to close deals
   - Mitigation: AI matching + messaging SLAs (brand → creator within 24h). Payment splitting (50/50 upfront).

**🚀 Go-to-Market Timeline**

Launch: Month 6 (alongside V1.5 Creator Marketplace)
- Week 1-2: Onboard 50 "founding" influencers (hand-select from our partner program, offer free 6 months Pro)
- Week 3: Cold outreach to 500 brands (agencies, ecom SMBs, coaches)
- Week 4: First 10 deals = case studies for viral/social proof

**✅ RECOMMENDATION: GREEN LIGHT**

**Verdict**: "Influencer marketplace is strategically essential — own Hindi creator economy now."

**Why**: Opens ₹3-5 Cr Y2+ ARR stream, defends against competitors, intensifies flywheel. Marketplace network effects compound over time. ReelCraft portfolio moat is real.

**When**: Launch Month 6 as V1.5 MVP. Scope: creator profiles, brand search, basic messaging, payment splits. Scheduling & analytics in V2.`
    },
    pm: {
      name: "Sneha Iyer",
      title: "Senior Product Manager",
      avatar: "SI",
      color: "#00D4AA",
      focus: "Feature Design, Flows & Product Roadmap",
      content: `**👥 User Personas & Pain Points**

**Creator Persona**: 50K-500K followers, posts daily. Pain: "I spend 2-3 hours/day hunting for brand deals via DMs. Most leads are scams or ₹5K deals."

**Brand Persona**: Small-med ecom, coaching, SaaS. Pain: "Finding right creators is manual — I use Excel spreadsheets and Instagram DMs. Takes 20 hours/week to manage 10 creators."

Both need: Speed + trust + payment safety.

**🔄 Core User Flows (MVP)**

**Creator Onboarding**:
1. Sign up / login (existing ReelCraft account)
2. Create public "Creator Profile": niche tags, language, rates (₹X per video, ₹Y per collab)
3. Link Instagram + YouTube (auto-pull follower counts)
4. Auto-populate 3 best viral ReelCraft videos as portfolio
5. "Open for work" toggle
6. Done (2 min)

**Brand Discovery Flow**:
1. Search/filter: niche (comedy, devotional, business), language (Hindi/English), follower range (50K-100K), rate range (₹10K-50K)
2. View creator card: bio, rates, verified badge (Instagram check), portfolio (3 viral videos), engagement rate
3. "Send brief" button → modal with message field
4. Recommended creators appear based on brief keywords (AI match)

**Deal Flow**:
1. Brand sends brief → creator gets notification (in-app + email)
2. Creator views brief → "Accept" or "Negotiate" 
3. If Accept: auto-escrow 50% payment (Razorpay), creator gets notified
4. Creator delivers video → brand approves
5. Final 50% released. Deal closed.
6. Both rate each other → reputation score

**📋 MVP Feature Scope (Ruthless)**

**IN SCOPE - MVP (Month 1-2 Dev)**:
- Creator profiles + public search
- Brand search with filters
- Simple messaging (no threading, just creator ↔ brand)
- Payment splits via Razorpay (50/50 escrow)
- Reputation/rating system
- Notification feed (new briefs, acceptances, deliveries)

**OUT OF SCOPE - V2 (Month 6+)**:
- Creator marketplace (asset/template selling) — separate feature
- Scheduling/contract management
- Advanced analytics dashboard
- Video escrow (verify quality) — too complex
- Affiliate program
- Brand subscriptions (premium search)

**🎯 Key Metrics (Month 1, Target)**

**Activation**: Creator profile completion rate ≥70% (if someone signs up)
**Engagement**: Monthly briefs sent ≥100, acceptance rate ≥40%
**Monetization**: Deals closed ≥10, GMV ≥₹10L
**Health**: Creator repeat rate ≥60% (brand uses same creator 2+ times)
**Churn**: Monthly creator churn ≤8%

**✨ UX Considerations**

**Delight moments**:
- Auto-populate portfolio with ReelCraft videos (unique edge)
- 1-click brief sending (don't make creators copy-paste)
- Real-time status: "Brand viewed your brief 2h ago" (social proof)

**Friction to eliminate**:
- Don't require full KYC upfront (kills conversion)
- Don't show "fake" creators (manual verification day 1)
- Don't auto-match poorly (AI should be silent, high-quality)

**🔗 Integration with ReelCraft Core**

- ReelCraft dashboard shows "Marketplace" tab (new briefs, earnings)
- Creator's best 3 viral videos auto-pull to profile
- Viral score appears on brand search cards (trust signal)
- When creators publish new ReelCraft video → auto-update portfolio

**⚠️ Biggest Product Risks & Solutions**

| Risk | Solution |
|------|----------|
| **Cold start**: No creators/brands day 1 | Hand-onboard 50 creators week 1. Outreach team → 200 brands |
| **Fake profiles**: Spam influencers | Day 1: Mandatory Instagram verification via OAuth. Require 2 ReelCraft videos in portfolio |
| **Low-quality matches**: Brand + creator hate each other | AI brief → recommended creators (don't force). Manual approval first |
| **Payment disputes**: Creator claims non-payment | Escrow model. Dispute resolution in v1.5 |
| **Ghosting**: Creators ignore briefs | SLA: mark unresponsive creators. 48h auto-close briefs |

**📊 Recommended MVP Scope Table**

| Feature | MVP | V1.5 | V2 | Why |
|---------|-----|------|----|----|
| Creator profiles | ✅ | — | — | Core |
| Brand search + filter | ✅ | — | — | Core |
| Brief messaging | ✅ | — | — | Core |
| Payment escrow | ✅ | — | — | Trust |
| Ratings/reviews | ✅ | — | — | Reputation |
| Video escrow (QA) | — | ✅ | — | Complex |
| Contract templates | — | ✅ | — | Legal |
| Scheduling calendar | — | ✅ | — | Nice-to-have |
| Analytics dashboard | — | — | ✅ | Heavy lift |
| Batch applications | — | ✅ | — | Creator QoL |

**✅ RECOMMENDATION: GREEN LIGHT - SHIP AGGRESSIVELY**

**MVP launch**: Month 5-6 (alongside V1.5). 4-week sprint: founder + 1 eng + designer.

**Why now**: Marketplace flywheel unlocked. ReelCraft portfolio moat is real. Hindi vernacular gap is massive. Competition emerging (other tools will copy).**`
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const analysis = analyses[activeTab];

  return (
    <div style={{
      background: "#060609",
      minHeight: "100vh",
      fontFamily: "'IBM Plex Mono', monospace",
      color: "#c4c9d4",
      padding: "0 0 40px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Mono:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap');
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:#0a0a0f}
        ::-webkit-scrollbar-thumb{background:#2d2d4a;border-radius:4px}
      `}</style>

      {/* Header */}
      <div style={{
        background: "linear-gradient(180deg, #0d0d1a 0%, #060609 100%)",
        borderBottom: "1px solid #1e1e2e",
        padding: "28px 32px",
        position: "relative",
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800,
          background: "linear-gradient(90deg, #FF6B35, #FF9B35, #00D4AA)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          letterSpacing: -0.5, marginBottom: 8,
        }}>⚡ ReelCraft — Team Analysis</div>
        <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>
          Feature: Influencer Marketplace — CEO + PM Perspectives
        </div>

        <div style={{
          background: "#0a0a14", border: "1px solid #2d2d4a",
          borderRadius: 10, padding: "14px 18px",
          fontSize: 12, color: "#8892a4", lineHeight: 1.7,
        }}>
          <span style={{ color: "#FF6B35", fontWeight: 700 }}>PROPOSAL: </span>
          Two-sided marketplace where influencers list profiles & rates, brands discover & hire. AI-powered matching. ReelCraft Viral Score = trust signal.
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 0,
        background: "#0a0a0f", borderBottom: "1px solid #1e1e2e",
        padding: "0 32px",
      }}>
        {Object.entries(analyses).map(([key, data]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: "16px 24px",
              background: activeTab === key ? "#0d0d18" : "transparent",
              border: "none",
              borderBottom: activeTab === key ? `2px solid ${data.color}` : "none",
              color: activeTab === key ? "#fff" : "#555",
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: activeTab === key ? `linear-gradient(135deg, ${data.color}, ${data.color}88)` : "#1e1e2e",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800,
              color: "#fff",
              margin: "0 0 8px 0",
            }}>{data.avatar}</div>
            <div>{data.name}</div>
            <div style={{ fontSize: 9, color: "#444", marginTop: 2 }}>{data.title}</div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "32px", maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, color: analysis.color, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
              Focus Area
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
              {analysis.focus}
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(analysis.content)}
            style={{
              padding: "8px 16px",
              background: "#1e1e2e",
              border: `1px solid ${analysis.color}44`,
              color: analysis.color,
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 6,
              cursor: "pointer",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {copied ? "✓ Copied" : "📋 Copy"}
          </button>
        </div>

        <div style={{
          background: "#0a0a0f",
          border: `1px solid ${analysis.color}22`,
          borderRadius: 12,
          padding: "28px",
          fontSize: 13,
          lineHeight: 2,
          color: "#b0b8cc",
        }}>
          {analysis.content.split("\n").map((line, i) => {
            if (line.startsWith("**") && line.endsWith("**")) {
              return (
                <div key={i} style={{
                  fontWeight: 700, color: "#fff", fontSize: 14,
                  marginTop: i > 0 ? 20 : 0, marginBottom: 12,
                }}>
                  {line.replace(/\*\*/g, "")}
                </div>
              );
            }
            if (line.match(/^\|/)) {
              return (
                <div key={i} style={{
                  display: "flex", gap: 12, fontFamily: "'Space Mono'",
                  fontSize: 11, borderBottom: "1px solid #1e1e2e",
                  padding: "8px 0", color: "#8892a4",
                }}>
                  {line.split("|").slice(1, -1).map((cell, j) => (
                    <div key={j} style={{ flex: 1 }}>{cell.trim()}</div>
                  ))}
                </div>
              );
            }
            if (line.startsWith("- ") || line.startsWith("**-")) {
              return (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                  <span style={{ color: "#666", flexShrink: 0 }}>›</span>
                  <span>{line.replace(/^[-*]\s/, "").replace(/\*\*/g, "")}</span>
                </div>
              );
            }
            if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
            return (
              <div key={i} style={{ marginBottom: 6 }}>
                {line.replace(/\*\*/g, "")}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 28, padding: "20px 24px",
          background: "#0d0d18", border: "1px solid #1e1e2e",
          borderRadius: 10, fontSize: 11, color: "#666", textAlign: "center",
        }}>
          <div style={{ color: analysis.color, fontWeight: 700, marginBottom: 6 }}>
            ✓ Analysis Complete
          </div>
          Switch tabs to compare CEO vs PM perspectives on the Influencer Marketplace feature.
        </div>
      </div>
    </div>
  );
}
