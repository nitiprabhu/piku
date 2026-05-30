# ReelCraft — Influencer Marketplace
## Complete PRD + Architecture Document

**Version:** 1.0  
**Date:** May 2026  
**Status:** Ready for Development (Month 5-6 Sprint)  
**Authored by:** Sneha Iyer (Product) + Dev Anand (Staff Engineering)

---

## PART 1: PRODUCT REQUIREMENTS DOCUMENT (PRD)

---

### 1.1 Overview

**Feature Name:** Influencer Marketplace  
**Tagline:** "Connect. Collaborate. Get Paid."  
**One-liner:** A two-sided marketplace on ReelCraft where creators monetize brand deals and businesses find verified influencers by niche, language, and engagement.

**Strategic Context:**
- Launches Month 5-6 as **V1.5 Creator Tools** milestone
- Builds on V1.0 core: video generation, viral scoring, publishing
- Opens new revenue stream: **12-15% commission on deals closed**
- Defensible moat: ReelCraft portfolio (viral scores) = trust signal competitors can't replicate

---

### 1.2 Problem Statement

**Creator Pain Points:**
- Manual brand outreach: 2-3 hours/day hunting via DMs, email, Quora
- 78% of Indian creators have no scalable monetization beyond AdSense
- Hindi/regional creators invisible to mainstream agencies
- Deal safety: Payment disputes, contract clarity, escrow issues

**Brand/Agency Pain Points:**
- Spreadsheet-based creator discovery (20 hours/week for 10 creators)
- No way to find Hindi/regional vernacular creators at scale
- Instagram/YouTube search gives follower count, not engagement/niche fit
- Manual outreach = high CAC (cost per deal)

**Market Gap:**
- Barter Collective: English-only, ₹100K+ minimum deals
- Local plays (Klear, Upfluence): No India focus
- ReelShorts/FaceReels: Pure tools, zero marketplace network effects
- **No Hindi-first influencer marketplace exists**

---

### 1.3 Target Users

| User | Persona | Volume | Revenue Model |
|------|---------|--------|----------------|
| **Creator (Supply)** | 50K-500K followers, posts daily, no brand connections | 50K by Y2 | Takes 85% of deal value |
| **Brand/Agency (Demand)** | SMB ecom, SaaS, coaching, digital agencies, 1-50 creators managed | 1K by Y2 | Pays platform commission |

---

### 1.4 MVP Feature Scope (Month 5-6 Dev Sprint)

#### ✅ IN SCOPE — MVP v1.0

**F1: Creator Profiles**
- Public profile: bio (100 chars), niche tags (max 5), languages spoken
- Rate card: ₹X per video, ₹Y per brand collab, ₹Z per partnership (custom)
- Social links: Instagram (mandatory), YouTube, TikTok (optional)
- Auto-portfolio: 3 best viral ReelCraft videos (Viral Score ≥70)
- Verification: Instagram/YouTube OAuth checkmark
- "Open for work" toggle
- Response time SLA: last responded within 48h

**F2: Brand Search & Discovery**
- Search filters: niche (comedy, devotional, business, motivation, news, education), language (Hindi/English/Hinglish), follower range (10K-100K, 100K-500K, 500K+), rate range (₹5K-50K, ₹50K-200K, ₹200K+)
- Creator cards: profile pic, name, follower count, engagement rate, niche tags, rates, 3 sample videos
- Sort: trending (by brief views), newest, highest rated
- Search saves: users can bookmark creators (not required for MVP)

**F3: Brief & Matching Flow**
- Brand creates brief: title, description (500 chars), budget, timeline, deliverables (# of videos, duration, platforms)
- AI keyword extraction → match top 5 creators by niche + language + budget fit (deterministic matching, no ML yet)
- Recommended creators appear as cards: "Recommended for you" section
- Send brief: 1-click to notify creator (in-app notification + email)

**F4: Messaging & Deal Flow**
- Simple 1:1 conversation: creator ↔ brand (no threading yet, just chronological)
- Creator actions: "Accept" (auto-escrow 50%), "Negotiate" (counter offer), "Decline"
- Negotiation: brand can increase budget or timeline, creator accepts/declines
- Once accepted: payment status (50% held in escrow with Razorpay), delivery deadline set
- Creator uploads video → brand reviews → approve/request revisions
- Final approval → remaining 50% released → both rate each other

**F5: Payment & Escrow (Razorpay Integration)**
- 50/50 split: brand pays 50% upfront (escrow), 50% on delivery approval
- Transaction fee: Razorpay 2% + ReelCraft 12% = 14% total to brand
- Creator receives: 86% of deal value
- Settlement: daily to creator's bank account (₹100 min)
- Dispute resolution: simple 7-day window, admin manual review if escalated

**F6: Creator Reputation & Ratings**
- After deal completion: both can rate 1-5 stars + comment (optional)
- Creator profile shows: avg rating, # of deals completed, response rate
- Brand profile shows: payment reliability (for creators to vet)
- Fraud flags: auto-hide profiles with <2.0 stars or >3 disputes

**F7: Dashboard & Notifications**
- Creator dashboard: open briefs, active deals, completed deals, earnings (lifetime + this month), verified badge
- Brand dashboard: sent briefs, active collaborations, completed videos, total spend
- Notifications: new brief received, deal accepted, video uploaded, deal closed, rating reminder

#### ❌ OUT OF SCOPE — V1.5/V2

- **Creator asset marketplace** (template/preset selling) — separate feature, Month 7+
- **Scheduling/contract templates** — V1.5
- **Video escrow/QA verification** — too complex for MVP
- **Analytics dashboard** (impressions, engagement per creator) — V2
- **Affiliate program** — V2
- **Brand subscriptions** (premium search, unlimited outreach) — V1.5
- **Batch briefs** (brand posts 1 brief to multiple creators) — V1.5
- **Payment splits** (3+ way splits) — V1.5

---

### 1.5 User Journeys

#### Creator Onboarding (Happy Path)

```
1. Creator logs in (existing ReelCraft account) or signs up
   └─> Redirect to /marketplace/profile/create

2. Complete profile:
   - Bio: "Funny reels about everyday life 😂"
   - Niche: Comedy, Entertainment
   - Languages: Hindi, English
   - Rates: ₹10K per video, ₹15K per brand collab
   - Instagram: @comedycreator (verified via OAuth)
   - Toggle: "Open for work" = ON
   └─> Auto-import 3 best ReelCraft videos (by Viral Score)

3. Redirect to /marketplace/briefs
   └─> See "Welcome! You're live 🎉" message
   └─> 3 recommended briefs appear (if any available)
   └─> Option to browse all briefs

4. Creator views brief: "Fitness app launch — need 5 funny reels"
   └─> Clicks "View full brief" → sees budget (₹75K), deadline, deliverables
   └─> Clicks "Accept" → payment escrow initiated (₹37.5K held)
   └─> Gets deal details, messaging opens

5. Creator delivers video → brand reviews → approves
   └─> Final 50% paid
   └─> Rating exchange
   └─> Back to /marketplace/briefs
```

#### Brand Discovery & Hiring (Happy Path)

```
1. Brand (or agency) signs up or logs in (new or existing account)
   └─> Redirect to /marketplace/search

2. Search & filter:
   - Niche: "Devotional" (for temple app)
   - Language: "Hindi"
   - Follower range: 50K-100K
   - Rate range: ₹5K-20K
   └─> Results: 47 creators match

3. Browse creators:
   - Tap one: profile shows bio, rates, 3 viral videos, avg rating (4.8 ⭐)
   - Tap another: similar
   - Shortlist 5 creators (bookmark feature, optional for MVP)

4. Create brief:
   - Title: "Temple App Launch Campaign"
   - Description: "Need 3 Hindi devotional reels, 30-60s each"
   - Budget: ₹15K per video
   - Timeline: 5 days
   └─> Click "Send to recommended creators" (top 3 matches by niche/budget)

5. Send invitations:
   - Each creator gets notification + email
   - Creator accepts → escrow charged immediately
   - Brand sees deal status in /marketplace/brand/deals

6. Creators submit videos → brand reviews in dashboard
   - Watch embedded video
   - Approve or request revisions (max 2 rounds)
   - On approval → creator paid, rating reminder sent
```

---

### 1.6 Core Flows in Detail

#### Flow A: Create Profile (Creator)

```
Step 1: Click "Set up Marketplace Profile" in ReelCraft dashboard
Step 2: Form - Profile Info
  - Bio (textarea, 100 char max)
  - Niche tags (select 1-5 from predefined: Comedy, Devotional, Business, Motivation, News, Education, Lifestyle, Food, Fashion)
  - Languages (checkboxes: Hindi, English, Hinglish)
  - Accept marketplace T&Cs

Step 3: Form - Rates
  - Per video: ₹[___] (min ₹5K)
  - Per collab: ₹[___] (min ₹10K)
  - Custom rate: ₹[___] (for negotiations)

Step 4: Connect Social (OAuth)
  - Instagram: [Connect] → verify follower count auto-pulls
  - YouTube: [Connect] (optional)
  - TikTok: [Connect] (optional)
  - Gets green checkmark for each verified platform

Step 5: Review & Confirm
  - Shows auto-selected 3 best ReelCraft videos (Viral Score ≥70)
  - Shows preview of public profile
  - "Go live" button → profile published

Step 6: Onboarding complete
  - Redirect to /marketplace/briefs with "Welcome 🎉" banner
  - Show tutorial: "How to respond to briefs"
```

#### Flow B: Search & Send Brief (Brand)

```
Step 1: Brand navigates to /marketplace/search
  OR from /marketplace/brand/briefs → click "Send new brief"

Step 2: Search Interface
  Filters (left sidebar):
  - Niche: checkboxes (Comedy, Devotional, etc.)
  - Language: checkboxes (Hindi, English, Hinglish)
  - Follower range: radio (10K-100K, 100K-500K, 500K+, 500K+)
  - Rate range: radio (₹5K-20K, ₹20K-50K, ₹50K+)
  - Min rating: slider (2.0 ⭐, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0)

  Results (right side): grid of creator cards
  - Avatar, name, follower count, avg rating, niche tags
  - 3 sample videos (auto-play on hover)
  - Rate: "₹10K/video" badge
  - [View Profile] [Send Brief] buttons

Step 3: Create Brief
  Modal opens: "Create New Brief"
  - Title (text input, 50 char)
  - Description (textarea, 500 char)
  - Budget per video: ₹[___] (pre-filled with creator's rate, editable)
  - Timeline: [___] days (min 2)
  - Deliverables:
    - # of videos: [___]
    - Duration: 30s / 60s / 90s (checkbox multiple)
    - Platforms: Instagram / YouTube / TikTok (checkbox multiple)
  - [Cancel] [Preview] [Send to creators] buttons

Step 4: Send to Creators
  - Show selected creators (auto-select top 3 by niche match)
  - Can add/remove creators
  - [Send] triggers payment hold (50% of total budget)
  - Success: "Brief sent to 3 creators! They'll respond within 24h"

Step 5: Monitor Deals
  - Redirect to /marketplace/brand/deals
  - Shows briefs sent, creator responses, deal status, earnings/spend
```

#### Flow C: Accept Deal & Deliver (Creator)

```
Step 1: Creator sees notification "New brief from Fitness App Co."
  - In-app: bell icon badge
  - Email: "You got a brief! [View]"

Step 2: Click to view brief
  - Brand name, logo, brief details, budget (₹15K)
  - Creator rates (₹10K) → difference: ₹5K offered above rate
  - [Accept] [Negotiate] [Decline] buttons

Step 3a: Accept (Happy path)
  - Click [Accept]
  - Modal: "50% (₹7.5K) will be held in escrow, 50% (₹7.5K) on delivery"
  - [Confirm] → payment processed with Razorpay
  - Deal moves to "active" status
  - Messaging opens, deadline shown (5 days)

Step 3b: Negotiate
  - Click [Negotiate]
  - Counter offer form: "Ask for higher rate or more time"
  - Modal: "Suggest rate: ₹[___] and/or timeline: [___] days"
  - Message to brand (optional)
  - [Send counter] → deal goes to "pending negotiation"
  - Brand gets notification, approves or counters again

Step 4: Deliver Video
  - In messaging, [Upload Video] button
  - Drag/drop or select MP4 file (max 500MB)
  - Video transcodes preview
  - [Submit for review]
  - Deal status: "Pending brand approval"

Step 5: Brand Reviews
  - Brand watches embedded video
  - [Approve] or [Request revisions] button
  - If revisions: creator has 48h to re-upload

Step 6: Approval & Payment
  - Brand clicks [Approve]
  - Remaining 50% (₹7.5K) released to creator
  - Both get rating request: "Rate this collaboration 1-5 ⭐"
  - Deal marked "Complete"

Step 7: Back to Dashboard
  - Creator sees deal in "completed" section
  - Earnings updated
  - Can view feedback from brand
```

---

### 1.7 Key Metrics (OKRs for Month 1-3)

| Metric | Month 1 | Month 2 | Month 3 | Notes |
|--------|---------|---------|---------|-------|
| **Activation** |||||
| Creator profile completion rate | 70% | 80% | 85% | Of sign-ups, % who finish profile |
| Avg time to complete profile | 8 min | 7 min | 6 min | UX optimization |
| **Engagement** |||||
| Monthly briefs sent | 50 | 150 | 400 | Brand posting activity |
| Brief acceptance rate | 40% | 45% | 50% | Of briefs, % creators accept |
| Messaging response time | 24h | 20h | 18h | Avg time creator replies |
| **Monetization** |||||
| Deals closed | 10 | 35 | 100 | Transactions completed |
| GMV (gross merchandise value) | ₹15L | ₹60L | ₹200L | Total deal value |
| Commission revenue | ₹1.8L | ₹7.2L | ₹24L | ReelCraft take (12%) |
| Avg deal size | ₹15K | ₹17K | ₹20K | Per-video rate |
| **Marketplace Health** |||||
| Creator rating (avg) | 4.0 ⭐ | 4.2 ⭐ | 4.3 ⭐ | Quality signal |
| Brand repeat rate | 40% | 60% | 75% | % brands send 2nd brief |
| Creator repeat rate | 30% | 50% | 70% | % work with multiple brands |

---

### 1.8 UX Principles & Design Goals

**North Star:** Creator should post a profile in 5 minutes, get their first brief within 24 hours, close deal in 3 days.

**Principles:**
1. **Speed over polish** — Fast signup, instant brief matching, 1-click actions
2. **Trust via transparency** — Show Viral Scores, completion rates, ratings, payment status
3. **Asymmetric simplicity** — Creators: minimal forms. Brands: powerful search + brief templating
4. **Failure gracefully** — Rejected brief? Suggest other creators. Payment failed? Retry with help

**Design constraints:**
- Mobile-first (70% of creators access via mobile)
- Hindi/English/Hinglish UI strings (localize early)
- Accessible: WCAG AA contrast, keyboard nav

---

### 1.9 Success Criteria

**Product Launch Success (End of Month 6):**
- ✅ 500 creators signed up with verified profiles
- ✅ 200 brands/agencies created accounts
- ✅ 50+ deals closed (₹15-20L GMV)
- ✅ Creator satisfaction: 4.0+ ⭐ avg rating
- ✅ Zero fraud (0% dispute rate)

**6-Month Target (End of Month 12):**
- 50K creators (10% of ReelCraft user base)
- 5K brands paying ₹10L+ in commissions
- 5000+ deals closed (₹50-60Cr GMV)
- Creator repeat rate: 60%+
- Monthly new briefs: 500+

---

## PART 2: ARCHITECTURE & TECHNICAL DESIGN

---

### 2.1 High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                   │
│  Web (Next.js) │ Mobile (React Native) │ Chrome Extension               │
└────────────────────────────────────────────────────────────────────────┘
                        │
                        │ HTTPS / WebSocket
                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Kong / AWS API GW)                    │
│        Rate Limiting (100 req/s per user) │ Auth (JWT) │ CORS          │
└────────────────────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┬──────────────┐
        ▼               ▼               ▼              ▼
   ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌────────────┐
   │ Auth    │   │Marketplace   │Creator   │   │Brand       │
   │Service  │   │Service (Node │Service   │   │Service     │
   │(Node)   │   │.js)          │(Python)  │   │(Node.js)   │
   └─────────┘   └──────────────┘──────────┘   └────────────┘
        │               │               │              │
        └───────────────┴───────────────┴──────────────┘
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
         ┌────────┐┌────────┐┌────────┐
         │PostgreSQL││Redis  ││S3 CDN  │
         │(Users,   ││(Cache)││(Media) │
         │Profiles) │└────────┘└────────┘
         └────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ┌─────────┐   ┌──────────┐   ┌──────────┐
   │Razorpay │   │SendGrid  │   │Twilio    │
   │(Payment)│   │(Email)   │   │(SMS)     │
   └─────────┘   └──────────┘   └──────────┘
```

---

### 2.2 Database Schema (PostgreSQL)

```sql
-- USERS (existing, extends ReelCraft auth)
table users {
  id UUID primary
  email VARCHAR unique
  password_hash VARCHAR
  name VARCHAR
  created_at TIMESTAMP
  is_marketplace_creator BOOLEAN default false
}

-- CREATOR PROFILES (new)
table creator_profiles {
  id UUID primary
  user_id UUID foreign_key(users.id) unique
  bio TEXT (100 char limit, validated in app)
  niche_tags JSONB (array of enum: Comedy, Devotional, Business, Motivation, News, Education, Lifestyle, Food, Fashion)
  languages JSONB (array: Hindi, English, Hinglish)
  rate_per_video INT (in ₹, min 5000)
  rate_per_collab INT (in ₹, min 10000)
  rate_custom INT nullable
  profile_picture_url VARCHAR
  is_open_for_work BOOLEAN default true
  verification_status ENUM (unverified, instagram_verified, youtube_verified, both_verified)
  last_response_time TIMESTAMP (tracks SLA)
  avg_rating DECIMAL(3,1) (1-5 stars, computed)
  total_deals_completed INT default 0
  created_at TIMESTAMP
  updated_at TIMESTAMP
  
  indexes: (user_id), (niche_tags), (languages), (is_open_for_work), (avg_rating)
}

-- SOCIAL LINKS (1:many to creator_profiles)
table creator_social_links {
  id UUID primary
  creator_profile_id UUID foreign_key
  platform ENUM (instagram, youtube, tiktok)
  handle VARCHAR
  follower_count INT (auto-pulled via OAuth)
  engagement_rate DECIMAL(5,2) (auto-pulled via API)
  verified BOOLEAN (OAuth scope = verified)
  created_at TIMESTAMP
}

-- CREATOR PORTFOLIO (1:1 to creator_profiles)
table creator_portfolio {
  id UUID primary
  creator_profile_id UUID foreign_key unique
  video_1_id UUID foreign_key(projects.id) (auto-selected, Viral Score ≥70)
  video_2_id UUID foreign_key(projects.id)
  video_3_id UUID foreign_key(projects.id)
  updated_at TIMESTAMP
}

-- BRANDS (new)
table brand_accounts {
  id UUID primary
  user_id UUID foreign_key(users.id) unique
  brand_name VARCHAR
  logo_url VARCHAR nullable
  description TEXT nullable
  industry ENUM nullable (ecom, saas, coaching, agency, other)
  payment_method_id VARCHAR (Razorpay: cust_XXXXX)
  total_spent INT default 0
  created_at TIMESTAMP
  updated_at TIMESTAMP
}

-- BRIEFS (new - brand posts work requests)
table briefs {
  id UUID primary
  brand_id UUID foreign_key(brand_accounts.id)
  title VARCHAR (50 char)
  description TEXT (500 char)
  budget_per_video INT (in ₹)
  timeline_days INT (min 2)
  deliverables JSONB {
    num_videos: INT,
    durations: [30, 60, 90], -- seconds
    platforms: [instagram, youtube, tiktok]
  }
  niche_tags JSONB (for AI matching)
  languages JSONB (for filtering)
  status ENUM (draft, published, closed)
  created_at TIMESTAMP
  published_at TIMESTAMP nullable
  closed_at TIMESTAMP nullable
  
  indexes: (brand_id), (status), (created_at), (niche_tags), (languages)
}

-- BRIEF INVITATIONS (n:m join, brief → creators)
table brief_invitations {
  id UUID primary
  brief_id UUID foreign_key(briefs.id)
  creator_id UUID foreign_key(creator_profiles.id)
  sent_at TIMESTAMP
  status ENUM (invited, accepted, negotiated, declined) default invited
  created_at TIMESTAMP
  
  indexes: (brief_id), (creator_id), (status)
}

-- NEGOTIATIONS (creator counter-offers)
table negotiations {
  id UUID primary
  brief_invitation_id UUID foreign_key(brief_invitations.id)
  creator_id UUID foreign_key(creator_profiles.id)
  requested_rate INT nullable (counter rate)
  requested_timeline INT nullable (counter days)
  message TEXT nullable
  brand_response ENUM (accepted, rejected, countered) nullable
  brand_response_rate INT nullable
  created_at TIMESTAMP
  resolved_at TIMESTAMP nullable
}

-- DEALS (active collaborations)
table deals {
  id UUID primary
  brief_id UUID foreign_key(briefs.id)
  creator_id UUID foreign_key(creator_profiles.id)
  final_rate INT (negotiated rate or brief rate)
  final_timeline INT (negotiated days or brief days)
  deal_amount INT (in ₹, = final_rate × num_videos)
  
  -- Payment escrow
  razorpay_order_id VARCHAR
  payment_status ENUM (pending_escrow, escrow_held, partial_paid, completed)
  upfront_amount INT (50% of deal_amount)
  final_amount INT (50% of deal_amount)
  escrow_released_at TIMESTAMP nullable
  
  -- Delivery
  deliverable_status ENUM (not_started, in_progress, submitted, revision_requested, approved)
  submission_deadline TIMESTAMP
  submitted_at TIMESTAMP nullable
  revision_count INT default 0 (max 2)
  
  -- Ratings
  creator_rating INT nullable (1-5)
  creator_review TEXT nullable
  brand_rating INT nullable (1-5)
  brand_review TEXT nullable
  
  status ENUM (negotiating, active, completed, disputed, cancelled)
  created_at TIMESTAMP
  completed_at TIMESTAMP nullable
  
  indexes: (brief_id), (creator_id), (status), (payment_status)
}

-- DEAL VIDEOS (1:many to deals, track deliverables)
table deal_videos {
  id UUID primary
  deal_id UUID foreign_key(deals.id)
  video_file_url VARCHAR (S3)
  video_duration INT (seconds)
  platform ENUM (instagram, youtube, tiktok)
  submission_order INT (1st, 2nd, 3rd...)
  status ENUM (pending, submitted, approved, revision_requested)
  submitted_at TIMESTAMP nullable
  approved_at TIMESTAMP nullable
  created_at TIMESTAMP
}

-- MESSAGES (creator ↔ brand conversations)
table messages {
  id UUID primary
  deal_id UUID foreign_key(deals.id)
  sender_id UUID foreign_key(users.id)
  sender_type ENUM (creator, brand)
  content TEXT
  created_at TIMESTAMP
  read_at TIMESTAMP nullable
  
  indexes: (deal_id), (sender_id), (created_at)
}

-- RATINGS (reviews after deal completion)
table ratings {
  id UUID primary
  deal_id UUID foreign_key(deals.id)
  rater_id UUID foreign_key(users.id)
  rater_type ENUM (creator, brand)
  rating INT (1-5)
  review TEXT nullable
  created_at TIMESTAMP
}

-- DISPUTES (if payment/delivery fails)
table disputes {
  id UUID primary
  deal_id UUID foreign_key(deals.id)
  initiated_by UUID foreign_key(users.id)
  reason ENUM (non_delivery, quality_issue, non_payment, other)
  description TEXT
  status ENUM (open, in_review, resolved, escalated)
  admin_notes TEXT nullable
  resolution ENUM (full_refund, partial_refund, creator_paid, none) nullable
  created_at TIMESTAMP
  resolved_at TIMESTAMP nullable
}
```

---

### 2.3 API Endpoints (RESTful)

#### Creator Profile APIs

```
POST /api/marketplace/creator/profiles
  Create profile
  Body: { bio, niche_tags, languages, rate_per_video, rate_per_collab }
  Response: { profile_id, status: "published" }

GET /api/marketplace/creator/profiles/:creator_id
  View creator public profile
  Response: { bio, niche_tags, languages, rates, avg_rating, portfolio: [3 videos], social_links }

PUT /api/marketplace/creator/profiles/:creator_id
  Update profile
  Body: { bio, rates, is_open_for_work, ... }
  Response: { updated_profile }

POST /api/marketplace/creator/social-links/:platform
  Connect Instagram/YouTube/TikTok
  OAuth flow: redirect_uri=...
  Response: { platform, handle, follower_count, verified }

GET /api/marketplace/creator/dashboard
  Creator dashboard
  Response: { open_briefs_count, active_deals: [...], completed_deals: [...], earnings_this_month, total_earnings }
```

#### Brief & Matching APIs

```
POST /api/marketplace/briefs
  Brand creates brief (auth required)
  Body: { title, description, budget_per_video, timeline_days, deliverables, niche_tags?, languages? }
  Response: { brief_id, status: "draft" }

PUT /api/marketplace/briefs/:brief_id
  Brand edits draft brief
  Body: { title, description, ... }
  Response: { updated_brief }

POST /api/marketplace/briefs/:brief_id/publish
  Brand publishes brief → auto-match creators
  Triggers: AI keyword extraction + creator search
  Response: { brief_id, recommended_creators: [5 objects with creator_id, match_score, reason] }

GET /api/marketplace/briefs/:brief_id/recommended-creators
  Get recommended creators for a brief (AI matching)
  Query: ?include_unverified=false (default true)
  Response: { recommended_creators: [ {creator_id, name, rating, match_reason, match_score}, ... ] }

POST /api/marketplace/briefs/:brief_id/send-to-creators
  Brand sends brief to creators (1:many)
  Body: { creator_ids: [id1, id2, id3] }
  Triggers: payment hold (50% escrow), notifications sent
  Response: { status: "sent", payment_order_id, created_invitations: [3] }

GET /api/marketplace/briefs/search
  Brand search for creators
  Query: ?niche=comedy&language=hindi&follower_min=50000&follower_max=500000&rate_min=5000&rate_max=50000&sort=newest&page=1&limit=20
  Response: { creators: [...], total_count, has_more }

GET /api/marketplace/creator/briefs
  Creator views open briefs
  Query: ?status=all|open|accepted&sort=newest&page=1
  Response: { briefs: [...] }
```

#### Deal APIs

```
POST /api/marketplace/briefs/:brief_id/invitations/:invitation_id/accept
  Creator accepts brief
  Body: { } (or with negotiation: { requested_rate?, requested_timeline? })
  Triggers: payment escrow if no negotiation, deal created
  Response: { deal_id, payment_status: "escrow_held", deadline }

POST /api/marketplace/briefs/:brief_id/invitations/:invitation_id/negotiate
  Creator counter-offers
  Body: { requested_rate?, requested_timeline?, message? }
  Response: { negotiation_id, status: "pending_brand_response" }

GET /api/marketplace/deals/:deal_id
  View deal details
  Response: { deal: { brief, creator, brand, final_rate, status, payment_status, deadline, messages: [...], videos: [...] } }

POST /api/marketplace/deals/:deal_id/submit-video
  Creator uploads deliverable
  Body: form-data { video: File }
  Triggers: FFmpeg transcode + S3 upload
  Response: { video_id, url, transcoding_status }

POST /api/marketplace/deals/:deal_id/approve-video
  Brand approves submitted video
  Body: { video_id } (or { video_id, revision_request: "text" })
  If approve: triggers final payment release
  Response: { video_status: "approved", deal_status: "completed", payment_released }

POST /api/marketplace/deals/:deal_id/messages
  Send message in deal
  Body: { content, attachment_id?: UUID }
  Response: { message_id, created_at }

GET /api/marketplace/deals/:deal_id/messages
  Fetch conversation
  Query: ?limit=50&offset=0
  Response: { messages: [...], total_count }

POST /api/marketplace/deals/:deal_id/rate
  Rate after deal complete
  Body: { rating: 1-5, review?: "text" }
  Response: { rating_id, created_at }
```

#### Payment APIs

```
POST /api/marketplace/payments/create-order
  Razorpay order creation (triggered on deal accept)
  Body: { deal_id, amount, description }
  Response: { order_id, amount, currency }
  (Client-side: Razorpay JS modal opens)

POST /api/marketplace/payments/verify
  Verify payment signature (webhook from Razorpay)
  Body: { order_id, payment_id, signature }
  Response: { status: "verified", deal_id }
  Triggers: deal status update, notification sent

GET /api/marketplace/creator/earnings
  Creator earnings dashboard
  Query: ?month=5&year=2026 (optional, default this month)
  Response: { total_earned, completed_deals: [...], pending: {...}, settled: {...} }
```

---

### 2.4 Low-Level Component Architecture

#### Marketplace Service (Node.js)

**Responsibilities:**
- Profile CRUD (creation, updates, verification)
- Brief creation & publishing
- AI-powered creator matching (keyword extraction + search)
- Brief invitation flow
- Deal orchestration (accept, negotiate, approve)
- Message persistence

**Key modules:**
```
src/services/
  ├─ profileService.ts
  │  ├─ createProfile(userId, profileData) → profileId
  │  ├─ updateProfile(profileId, updateData)
  │  ├─ getCreatorProfile(creatorId) → public profile
  │  └─ linkSocialAccount(profileId, platform, oauthData)
  │
  ├─ briefService.ts
  │  ├─ createBrief(brandId, briefData) → briefId (draft)
  │  ├─ publishBrief(briefId) → recommended_creators
  │  ├─ searchCreators(filters) → creators array
  │  └─ sendBriefToCreators(briefId, creatorIds) → invitations
  │
  ├─ dealService.ts
  │  ├─ acceptBrief(invitationId, [negotiationData]) → dealId
  │  ├─ approveBrief(invitationId, negotiationResponse)
  │  ├─ submitVideo(dealId, videoFile) → video_id
  │  ├─ approveVideo(dealId, videoId) → completion
  │  └─ rateDeal(dealId, rating, review)
  │
  ├─ messagingService.ts
  │  ├─ sendMessage(dealId, userId, content) → messageId
  │  ├─ getMessages(dealId, limit, offset) → messages
  │  └─ markAsRead(dealId, userId)
  │
  └─ matchingService.ts
     ├─ extractKeywords(briefDescription) → keywords array
     ├─ scoreCreator(creatorProfile, brief) → score (0-100)
     └─ recommendCreators(brief, topN=5) → creators ranked by score
```

**Database queries (optimized):**
- Creator search: `SELECT * FROM creator_profiles WHERE niche_tags && ? AND languages && ? AND rate_per_video BETWEEN ? AND ? AND is_open_for_work = true ORDER BY avg_rating DESC LIMIT 20`
  (PostgreSQL array overlap operator `&&`)
- Dashboard: aggregation queries for earnings, deal counts (Redis cache 5 min TTL)
- Matching: `SELECT creator_id, SIMILARITY(brief_niche, profile_niche) AS match_score FROM creator_profiles ORDER BY match_score DESC LIMIT 5`

---

#### Payment Service (Node.js + Razorpay SDK)

**Responsibilities:**
- Order creation (50/50 escrow split)
- Payment verification via webhooks
- Refunds & disputes
- Settlement scheduling

**Key modules:**
```
src/services/payment/
  ├─ razorpayService.ts
  │  ├─ createOrder(dealId, amount) → order_id (Razorpay API)
  │  ├─ verifyPayment(order_id, payment_id, signature) → verified bool
  │  ├─ capturePayment(order_id) → payment confirmed
  │  ├─ refundPayment(order_id, reason) → refund_id
  │  └─ scheduleSettlement(creator_id, amount) → batch_id
  │
  └─ escrowService.ts
     ├─ holdEscrow(deal_id, 50% amount) → escrow_id
     ├─ releaseEscrow(deal_id) → confirmed
     └─ refundEscrow(escrow_id, reason) → refund_id
```

**Webhook handler:**
```
POST /webhooks/razorpay
  Listen for: payment.authorized, payment.failed, refund.created
  On success: deal_status = "payment_received", release escrow
  On failure: brief_invitation_status = "payment_failed", notify creator
```

---

#### Creator Matching Engine (Python microservice)

**Responsibilities:**
- Keyword extraction from brief descriptions
- Similarity scoring between brief and creator profiles
- Top-N recommendation ranking

**Algorithm:**
```python
def recommend_creators(brief: Brief, top_n: int = 5) -> List[CreatorRecommendation]:
  # Step 1: Keyword extraction from brief description
  brief_keywords = extract_keywords(brief.description)
  # → e.g., ["fitness", "gym", "motivation", "workout"]
  
  # Step 2: Filter by hard constraints
  candidates = creators.filter(
    niche_tags.overlap(brief.niche_tags),
    languages.overlap(brief.languages),
    rate_per_video <= brief.budget_per_video,
    is_open_for_work = True,
    avg_rating >= 2.0  # Minimum quality gate
  )
  
  # Step 3: Score each candidate
  scores = []
  for creator in candidates:
    niche_score = jaccard_similarity(brief.niche_tags, creator.niche_tags) * 0.4
    language_score = (brief.languages ∩ creator.languages).length / max(len(brief.languages), len(creator.languages)) * 0.2
    rating_score = (creator.avg_rating / 5.0) * 0.2
    budget_score = 1.0 if creator.rate_per_video <= brief.budget * 1.1 else 0.5 * 0.2
    
    total_score = niche_score + language_score + rating_score + budget_score
    scores.append((creator, total_score))
  
  # Step 4: Rank and return top N
  return sorted(scores, key=lambda x: x[1], reverse=True)[:top_n]
```

**Implementation:**
```python
# src/matching/engine.py
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class CreatorMatcher:
  def extract_keywords(self, text: str) -> List[str]:
    vectorizer = TfidfVectorizer(max_features=10, stop_words='english')
    # Extract top TF-IDF terms from brief description
    return top_terms
  
  def score_creator(self, brief, creator) -> float:
    # Weighted scoring as above
    return score
  
  def recommend(self, brief_id: str, top_n: int = 5):
    brief = db.query(Brief).get(brief_id)
    candidates = db.query(CreatorProfile).filter(...).all()
    scored = [(c, self.score_creator(brief, c)) for c in candidates]
    return sorted(scored, key=lambda x: x[1], reverse=True)[:top_n]
```

---

#### Frontend Components (React/Next.js)

**Creator Profile Creation:**
- `/components/marketplace/CreatorProfileForm.tsx` — multi-step form
  - Step 1: Bio + niche + languages
  - Step 2: Rates (per video, per collab, custom)
  - Step 3: Social verification (OAuth flows)
  - Step 4: Portfolio review (auto-selected videos)
  - Step 5: Confirmation → profile published

**Creator Dashboard:**
- `/components/marketplace/CreatorDashboard.tsx`
  - Tabs: Open briefs | Active deals | Completed deals | Earnings
  - Cards for each brief (title, brand, budget, deadline, [Accept] [Decline])
  - Deal cards (status, video submission, rating exchange)
  - Earnings chart (monthly trend)

**Brand Discovery:**
- `/components/marketplace/CreatorSearch.tsx`
  - Left sidebar: filters (niche, language, follower, rate, rating)
  - Right main: grid of creator cards (infinite scroll)
  - Creator card: avatar, name, followers, engagement, rates, sample videos, [View] [Send brief]
  - Search results state management (Redux or React Query)

**Brief Creation:**
- `/components/marketplace/BriefForm.tsx`
  - Form: title, description, budget per video, timeline, deliverables
  - Preview: shows matching creators (AI recommended)
  - Send: select creators, confirm payment hold

**Deal Management:**
- `/components/marketplace/DealChat.tsx`
  - Messaging UI (chat bubble style)
  - Video submission box (drag-drop file upload)
  - Status indicator (escrow held, video pending, approved, etc.)
  - Rating modal (post-completion)

---

### 2.5 Data Flow Diagrams

#### Happy Path: Creator to Deal Closure

```
Creator A                        Marketplace Service              Brand B
    │                                   │                           │
    ├─ POST /profiles ─────────────────>│                           │
    │  { bio, niche, rates }            │                           │
    │                    <─ profileId ──┤                           │
    │                                    │                           │
    │                                    │ [Profile published]       │
    │                                    │                           │
    │                                    │                           │
    │                                    │                  CREATE BRIEF
    │                                    │                           │
    │                                    │<─ POST /briefs ───────────┤
    │                                    │ { title, niche, budget }  │
    │                                    │                           │
    │                                    │ [AI matching]             │
    │                                    │ - Extract keywords        │
    │                                    │ - Score Creator A = 0.92  │
    │                                    │ - Top 5: [A, C, D, E, F] │
    │                                    │                           │
    │                                    │ SEND BRIEF                │
    │                                    │                           │
    │<─ notification ────────────────────┤                           │
    │  { brief_id, brand, budget }       │                           │
    │                                    │                           │
    ├─ POST /briefs/:id/accept ────────>│                           │
    │  { }                               │                           │
    │                    <─ deal_id ────┤                           │
    │                                    │ [50% escrow held]         │
    │                                    │ [Payment verified]        │
    │                                    │                           │
    │ [CREATE VIDEO OVER NEXT 5 DAYS]    │                           │
    │                                    │                           │
    ├─ POST /deals/:id/videos ─────────>│                           │
    │  { video_file }                    │                           │
    │                    <─ video_id ───┤                           │
    │                                    │ [Transcode on S3]         │
    │                                    │                           │
    │                                    │ BRAND APPROVES            │
    │                                    │                           │
    │                                    │<─ POST /videos/approve ───┤
    │                                    │                           │
    │<─ notification ────────────────────┤                           │
    │  { video_approved, payment_sent }  │ [50% released]            │
    │                                    │ [Deal completed]          │
    │                                    │                           │
    ├─ POST /deals/:id/rate ───────────>│                           │
    │  { rating: 5, review: "great!" }   │                           │
    │                    <─ rating_id ──┤                           │
    │                                    │                           │
    └────────────────────────────────────┴───────────────────────────┘
```

---

### 2.6 Security & Compliance

**Authentication:**
- JWT tokens (access 15min, refresh 7 days)
- OAuth for social linking (Instagram, YouTube, TikTok)
- Rate limiting: 100 req/s per user (prevent abuse)

**Payment Security:**
- PCI DSS compliance: Razorpay handles all card processing (tokens only in our system)
- Webhook signature verification (Razorpay secret)
- Escrow: funds held by Razorpay until release approved

**Data Privacy:**
- GDPR compliance (EU users)
- India IT Act Section 72 (data protection)
- Right to delete: creator can delete profile + anonymize historical deals
- Encryption: passwords hashed (bcrypt), sensitive data encrypted at rest (AWS KMS)

**Fraud Prevention:**
- Creator verification: mandatory Instagram/YouTube OAuth
- Minimum rating threshold: 2.0 ⭐ to prevent spam profiles
- Dispute resolution: admin-reviewed, refunds issued if creator non-delivers
- Rate limiting: max 50 briefs/day per brand, max 10 deals/month per creator (spam gates)

---

### 2.7 DevOps & Deployment

**CI/CD Pipeline:**
1. Developer pushes to `feature/marketplace-v1`
2. GitHub Actions:
   - Run tests (Jest, pytest)
   - Lint (ESLint, Pylint)
   - Build Docker images
   - Push to ECR
3. ArgoCD:
   - Deploy to EKS staging environment
   - Run integration tests
   - On merge to main: deploy to production (blue/green)

**Infrastructure:**
- Marketplace Service: Node.js deployment (3 replicas, auto-scaling 0→10 on load)
- Matching Engine: Python microservice (1 replica, 512MB RAM)
- Database: PostgreSQL RDS (Multi-AZ, automated backups)
- Cache: Redis (for profile views, dashboard aggregations)
- Queue: SQS for async jobs (email notifications, video transcoding)

**Monitoring:**
- Datadog APM: API response times, error rates
- CloudWatch: logs, cost tracking
- Custom metrics: deal completion rate, payment success rate, creator satisfaction
- Alerts: Slack notifications on failures (>5% error rate, payment timeout)

---

### 2.8 Rollout & Launch Plan

**Week 1-2: Internal Testing**
- Team uses marketplace (dog-fooding)
- QA tests all flows end-to-end
- Fix critical bugs

**Week 3: Soft Launch (Closed Beta)**
- Invite 50 "founding creators" (existing ReelCraft partners)
- Onboard 10 "founding brands" (hand-selected agencies)
- Daily standup, quick iterations on UX
- Target: 10-20 deals to validate flow

**Week 4: Open Beta**
- Expand to 500 creators via email invite
- 100 brands via outreach
- Fix bugs found in beta
- Measure: activation rate, deal velocity, NPS

**Week 5: Public Launch**
- Open to all ReelCraft users
- Marketing push: Product Hunt, Twitter, Instagram
- Creator onboarding campaign
- Monitor: server stability, payment success rate

**Month 2: Stability & Optimization**
- Scale to 5K creators, 500 brands
- Optimize AI matching based on feedback
- Improve UX based on usage patterns
- Prepare for V1.5 (advanced features)

---

## PART 3: IMPLEMENTATION ROADMAP

### 3.1 Development Timeline (4-5 week sprint)

| Week | Focus | Deliverables |
|------|-------|--------------|
| Week 1 | Backend: User models, DB schema, API skeleton | PostgreSQL migrations, 10 API endpoints (CRUD), JWT auth |
| Week 2 | Backend: Marketplace logic | Profile service, brief service, deal orchestration, payment integration |
| Week 3 | Frontend: UI components | ProfileForm, CreatorSearch, BriefForm, DealChat, DashboardLayout |
| Week 4 | Integration & Testing | E2E tests, payment flow testing, AI matching tests, load testing |
| Week 5 | Beta Launch & Fixes | Dog-fooding, QA, bug fixes, soft launch to 50 creators |

### 3.2 Success Metrics (Month 1)

- ✅ 500 creators signed up
- ✅ 50+ deals closed
- ✅ Zero critical bugs
- ✅ Creator satisfaction: 4.0+ ⭐
- ✅ Payment success rate: 99%+

---

## Appendix

### A. Glossary

- **Brief:** Job posting by brand (description of work wanted)
- **Creator Profile:** Public marketplace profile (bio, rates, portfolio)
- **Deal:** Active collaboration between creator and brand
- **Escrow:** 50% payment held until deal completed
- **Invitation:** Brand invites creator to brief
- **Niche tags:** Categories (Comedy, Devotional, Business, etc.)
- **Viral Score:** ReelCraft's AI-calculated virality metric (0-100)

### B. Related Features (V1.5+)

- **Creator Asset Marketplace:** Creators sell presets, templates, effects to other creators
- **Brand Subscriptions:** Monthly plan for unlimited briefs + creator search
- **Video Escrow:** Optional QA verification before final payment
- **Contract Templates:** Pre-made agreements for certain deal types
- **Scheduling:** Creators batch-create content on calendar

---

**End of Document**
