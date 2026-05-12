# ReelCraft — PRD + Architecture Document
**Version:** 1.0 | **Date:** May 2026 | **Status:** Ready for Claude Code

---

## PART 1: PRODUCT REQUIREMENTS DOCUMENT (PRD)

---

### 1.1 Overview

**Product Name:** ReelCraft  
**Tagline:** Ek prompt, ek viral reel.  
**One-line:** AI-powered short video creation platform for Indian content creators — type a prompt, get a publish-ready reel in under 60 seconds.

**MVP Goal:** A working web app where a user can:
1. Sign up / log in
2. Enter a text prompt (Hindi or English)
3. Pick style, voice, duration
4. Watch the video generate in real time (WebSocket progress)
5. Download the MP4 or publish directly to Instagram/YouTube

---

### 1.2 Target Users

| Persona | Description | Pain Point |
|---|---|---|
| Hindi content creator | 50K–500K followers, posts daily | Spends 2–3 hours editing per reel |
| Small business owner | Uses Reels for marketing | No editing skills, no designer |
| Digital marketing agency | Manages 10–20 client accounts | Manual video production is expensive |
| Devotional/motivation creator | Posts shlokas, quotes, motivation | No tools in their language |

---

### 1.3 MVP Feature Scope (What Claude Code Builds)

#### IN SCOPE — MVP v1.0

**F1: Authentication**
- Email + password signup/login
- JWT-based session (access token 15min, refresh token 7 days)
- Google OAuth (optional, add if time permits)
- User profile: name, email, plan (free/pro), credits remaining

**F2: Video Generation**
- Input form:
  - Prompt text (10–500 chars, Hindi/English/Hinglish)
  - Style picker: Funny | Devotional | Motivational | Business | News
  - Language: Hindi | English | Hinglish
  - Voice: 4 options (2M, 2F) rendered as audio preview cards
  - Duration: 30s | 60s | 90s
- Generation pipeline (async):
  1. GPT-4o → script (narration + visual keywords)
  2. MuAPI MiniMax Speech → AI voiceover (MP3)
  3. MuAPI WAN2.1 / VEO3 → background video clips (one per scene)
  4. FFmpeg → compose: video + voice + captions + music + watermark
- Real-time progress via WebSocket:
  - `script_done` (20%) → `voice_done` (40%) → `visuals_done` (70%) → `composing` (85%) → `completed` (100%)
- Output: 9:16 MP4 (1080×1920), max 90s

**F3: Video Management**
- Dashboard: grid of all generated videos (thumbnail, title, created date, viral score)
- Video detail page: preview player, download button, publish button, regenerate button
- Delete video

**F4: Publish to Social**
- Instagram Reels (via Meta Graph API)
- YouTube Shorts (via YouTube Data API v3)
- OAuth connect/disconnect flows for both platforms
- Caption + hashtag editor before publishing
- Publish now (immediate) only — scheduling in v1.5

**F5: Credits System**
- Free plan: 5 credits/month (1 video = 1 credit)
- Pro plan: unlimited (₹499/month via Razorpay)
- Credits remaining shown in header
- Upgrade modal when credits = 0

**F6: Templates (Basic)**
- 10 pre-built templates (2 per category)
- Template = preset: style + suggested prompts + color overlay + music genre
- User can pick template → pre-fills the creation form

**F7: Viral Score**
- 0–100 score shown on each generated video
- Based on: hook strength, caption quality, duration, engagement prediction
- Simple rule-based scoring for MVP (ML model in v2.0)

#### OUT OF SCOPE — MVP v1.0

- Batch generation (v1.5)
- Scheduling calendar (v1.5)
- Creator marketplace (v2.0)
- Mobile app (v2.0)
- Analytics dashboard (v1.5)
- AI avatar presenter (v2.0)

---

### 1.4 User Journey (Happy Path)

```
1. LAND (/)
   └── Hero section: "Viral reel in 60 seconds" + live demo video
   └── CTA: "Try Free — No credit card" → Signup

2. SIGNUP (/auth/signup)
   └── Email + password
   └── Onboarding: pick preferred language + category
   └── Redirect → /dashboard

3. CREATE (/create)
   └── Step 1: Prompt input
       "Aaj ka thought kya hai?" [input box]
   └── Step 2: Style + voice + duration
   └── Step 3: Click "Video Banao!" button
   └── Processing screen (WebSocket progress bar)
   └── Preview ready (~45 seconds average)

4. PREVIEW (/projects/:id)
   └── Video player (9:16 portrait)
   └── Viral score badge
   └── Edit caption + hashtags
   └── Buttons: [Download] [Post to Instagram] [Post to YouTube] [Regenerate]

5. PUBLISH
   └── If not connected: OAuth flow → connect account
   └── Caption editor → Confirm → API publish
   └── Success screen: "Posted! 🎉" + "Make Another" CTA

6. DASHBOARD (/dashboard)
   └── Grid of all videos
   └── Credits remaining indicator
   └── Quick create button
```

---

### 1.5 Non-Functional Requirements

| Requirement | Target |
|---|---|
| P50 generation time | < 45 seconds |
| P95 generation time | < 90 seconds |
| API response (non-AI endpoints) | < 200ms |
| Video CDN delivery | < 2s first load |
| Concurrent generation jobs | 50 (MVP), 500 (v2) |
| Uptime | 99.5% (MVP) |
| Video format | MP4, H.264, AAC, 1080×1920, 9:16 |
| Supported browsers | Chrome, Safari, Firefox (latest 2 versions) |
| Mobile responsive | Yes (web, not native app) |
| Max upload size | 10MB (for future user-uploaded assets) |

---

### 1.6 AI Model Selection

#### Why MuAPI as the unified gateway

MuAPI is a single API that wraps multiple state-of-the-art video/image/audio models. Instead of managing 4+ separate API keys and SDKs, you call one endpoint. For MVP this is the right call — optimize costs later by routing to individual providers.

#### Model Choices per Pipeline Step

| Step | Model | Provider via MuAPI | Why |
|---|---|---|---|
| Script generation | GPT-4o | OpenAI (direct) | Best Hindi/English reasoning, prompt following |
| Text-to-Speech | MiniMax Speech-2.6-HD | MuAPI | Studio-quality, natural pacing, no background noise |
| Background video | WAN2.1 Text-to-Video | MuAPI | Best quality/cost ratio for short clips; cinematic motion |
| Background video (premium) | VEO3 Text-to-Video | MuAPI | Google's best model; use for Pro users only (higher cost) |
| Background images (fallback) | HiDream-I1-Full | MuAPI | When video gen is slow, use image + motion as fallback |
| Image-to-video (optional) | VEO3 Fast I2V | MuAPI | Animate generated image if text-to-video times out |
| Music | Suno Create Music | MuAPI | Background music from mood description |
| Video composition | FFmpeg | Self-hosted | Combine all assets, add captions, watermark |

#### Model Routing Logic

```
User Plan = Free  → WAN2.1 T2V (fast, lower cost)
User Plan = Pro   → VEO3 T2V (premium quality)
VEO3 timeout >60s → fallback to HiDream image + VEO3 Fast I2V
All TTS           → MiniMax Speech-2.6-HD
All music         → Suno Create Music (15s loop, auto-extends)
```

#### MuAPI API Pattern

All MuAPI calls follow async pattern:
```
POST /api/v1/{model-name}     → returns { job_id }
GET  /api/v1/jobs/{job_id}    → returns { status, output_url }
Webhook → POST to your server when done (preferred)
```

---

### 1.7 Pricing & Credits

| Plan | Price | Credits | Video Gen | Voices | Publish |
|---|---|---|---|---|---|
| Free | ₹0 | 5/month | WAN2.1 | 2 voices | Instagram only |
| Pro | ₹499/month | Unlimited | VEO3 (priority) | 12 voices | All platforms |
| Business | ₹1,999/month | Unlimited + API | VEO3 (priority) | All | All + scheduling |

---

### 1.8 Tech Stack Decision

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR for SEO, React for UI, Vercel-deployable |
| Backend API | FastAPI (Python) | Async-native, easy AI lib integration, fast |
| Job Queue | Redis + RQ (Redis Queue) | Simpler than SQS for MVP; Docker-friendly |
| Database | PostgreSQL (via SQLAlchemy) | Relational, JSONB for metadata |
| Cache | Redis | Job status, session cache |
| File Storage | Cloudflare R2 (S3-compatible) | Cheaper than S3, global CDN included |
| Video Processing | FFmpeg (subprocess in Python) | Industry standard, free |
| WebSocket | FastAPI WebSocket | Real-time progress to frontend |
| Auth | JWT (python-jose) + bcrypt | Simple, stateless |
| Payments | Razorpay | India-first, easy integration |
| Containerization | Docker + Docker Compose | Local dev + Railway deployment |
| CI/CD | GitHub Actions | Auto-deploy to Railway on push |

---

## PART 2: HIGH-LEVEL ARCHITECTURE

---

### 2.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   Next.js 14 Web App (React)                                    │
│   • /create  • /dashboard  • /projects/:id  • /auth/*          │
│                                                                 │
│   WebSocket client (real-time job progress)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS + WSS
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    FASTAPI BACKEND                               │
│                    (Python 3.12)                                 │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Auth API   │  │ Project API │  │   Generation API        │ │
│  │ /auth/*     │  │ /projects/* │  │   POST /generate        │ │
│  │ JWT + OAuth │  │ CRUD + list │  │   GET  /jobs/:id        │ │
│  └─────────────┘  └─────────────┘  │   WS  /ws/:job_id      │ │
│                                     └─────────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │ Social API  │  │  User API   │                               │
│  │ /publish/*  │  │ /user/*     │                               │
│  │ IG + YT     │  │ credits,plan│                               │
│  └─────────────┘  └─────────────┘                               │
└───────────┬────────────────────┬───────────────────────────────┘
            │                    │
     ┌──────▼──────┐    ┌────────▼────────┐
     │  PostgreSQL  │    │  Redis          │
     │  (main DB)  │    │  Job queue      │
     │             │    │  Session cache  │
     └─────────────┘    └────────┬────────┘
                                 │ Job dequeue
                        ┌────────▼────────┐
                        │  VIDEO WORKER   │
                        │  (Python RQ)    │
                        │                 │
                        │  1. GPT-4o      │
                        │     Script gen  │
                        │                 │
                        │  2. MuAPI       │
                        │    ├ MiniMax TTS│
                        │    ├ WAN2.1 T2V │
                        │    └ Suno Music │
                        │                 │
                        │  3. FFmpeg      │
                        │     Compose     │
                        │                 │
                        │  4. Upload R2   │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │ Cloudflare R2   │
                        │ (Media Storage) │
                        │ + CDN delivery  │
                        └─────────────────┘
```

---

### 2.2 Component Responsibilities

| Component | Language | Responsibility |
|---|---|---|
| Next.js Frontend | TypeScript | UI, routing, WebSocket client, OAuth redirects |
| FastAPI Backend | Python | REST API, WebSocket server, auth, job dispatch |
| Video Worker | Python (RQ) | AI orchestration, FFmpeg composition |
| PostgreSQL | SQL | Users, projects, publish_jobs, plans |
| Redis | - | Job queue, job status pub/sub, session cache |
| Cloudflare R2 | - | Raw assets + final MP4 storage + CDN |
| MuAPI | External API | TTS, T2V video clips, image gen, music |
| OpenAI GPT-4o | External API | Script + visual keyword generation |
| Meta Graph API | External API | Instagram Reels publish |
| YouTube Data API | External API | YouTube Shorts publish |
| Razorpay | External API | Payments + subscription webhooks |

---

### 2.3 Data Flow — Video Generation

```
User clicks "Video Banao!"
        │
        ▼
POST /api/generate
{prompt, language, style, duration, voice_id, template_id}
        │
        ▼
FastAPI validates input → deducts 1 credit → creates project row (status=pending)
        │
        ▼
Enqueue job to Redis queue → returns { job_id, project_id }
        │
        ▼
Frontend opens WebSocket: ws://api/ws/{job_id}
        │
        ▼ (async, in worker process)
┌───────────────────────────────────────────────────────┐
│  WORKER PICKS UP JOB                                   │
│                                                        │
│  Step 1: Script Generation (GPT-4o)                   │
│    Input: prompt + language + style + duration        │
│    Output: { narration, scenes[], visual_keywords[] } │
│    → Publish progress: { step: "script_done", pct:20} │
│                                                        │
│  Step 2: TTS via MuAPI (MiniMax Speech-2.6-HD)        │
│    Input: narration text, voice_id                    │
│    Output: audio.mp3 (downloaded to /tmp)             │
│    → Publish progress: { step: "voice_done", pct:40} │
│                                                        │
│  Step 3: Video clips via MuAPI (WAN2.1 or VEO3)       │
│    Input: visual_keywords per scene (3–6 scenes)      │
│    Output: clip_1.mp4 ... clip_N.mp4 in /tmp          │
│    → Publish progress: { step:"visuals_done", pct:70} │
│                                                        │
│  Step 4: Music via MuAPI (Suno)                       │
│    Input: style + mood description                    │
│    Output: music.mp3 (15-30s loop)                   │
│    → (parallel with Step 3)                           │
│                                                        │
│  Step 5: FFmpeg Composition                           │
│    - Stack clips to match audio duration              │
│    - Scale all to 1080×1920 (9:16)                   │
│    - Overlay captions (SRT auto-generated)            │
│    - Mix voice (100%) + music (15%, ducked)           │
│    - Add watermark (bottom-right logo)                │
│    Output: final_video.mp4                            │
│    → Publish progress: { step:"composing", pct:85}   │
│                                                        │
│  Step 6: Upload to Cloudflare R2                      │
│    - Upload final_video.mp4 → get CDN URL             │
│    - Generate thumbnail (FFmpeg frame extract)        │
│    - Upload thumbnail → get CDN URL                   │
│    → Update project row: status=completed, urls       │
│    → Publish progress: { step:"completed", pct:100,  │
│        video_url: "...", thumbnail_url: "..." }       │
└───────────────────────────────────────────────────────┘
        │
        ▼
Frontend receives "completed" → show video preview
```

---

### 2.4 Deployment Architecture (Docker Compose → Railway)

```
docker-compose.yml
├── frontend     (Next.js, port 3000)
├── api          (FastAPI, port 8000)
├── worker       (Python RQ worker, same code as api)
├── postgres     (PostgreSQL 16, port 5432)
└── redis        (Redis 7, port 6379)

Railway deployment:
├── frontend     → Railway service (auto-deploys from /frontend)
├── api          → Railway service (auto-deploys from /backend)
├── worker       → Railway service (same Dockerfile, CMD=worker)
├── postgres     → Railway PostgreSQL plugin
└── redis        → Railway Redis plugin
```

---

## PART 3: LOW-LEVEL ARCHITECTURE

---

### 3.1 Repository Structure

```
reelcraft/
├── frontend/                      # Next.js 14 app
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (app)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── create/page.tsx
│   │   │   └── projects/[id]/page.tsx
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/route.ts   # OAuth callbacks
│   │   ├── layout.tsx
│   │   └── page.tsx                          # Landing page
│   ├── components/
│   │   ├── VideoPlayer.tsx
│   │   ├── GenerationProgress.tsx
│   │   ├── CreateForm.tsx
│   │   ├── VideoCard.tsx
│   │   ├── PublishModal.tsx
│   │   └── CreditsIndicator.tsx
│   ├── lib/
│   │   ├── api.ts                            # Axios client
│   │   └── websocket.ts                      # WS hook
│   ├── Dockerfile
│   └── package.json
│
├── backend/                       # FastAPI + RQ Worker
│   ├── app/
│   │   ├── main.py                           # FastAPI app entry
│   │   ├── config.py                         # Settings (env vars)
│   │   ├── database.py                       # SQLAlchemy engine
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   └── publish_job.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   └── generate.py
│   │   ├── api/
│   │   │   ├── auth.py                       # /auth/* endpoints
│   │   │   ├── projects.py                   # /projects/* endpoints
│   │   │   ├── generate.py                   # /generate endpoint
│   │   │   ├── social.py                     # /publish/* endpoints
│   │   │   ├── user.py                       # /user/* endpoints
│   │   │   └── websocket.py                  # WS endpoint
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── script_generator.py       # GPT-4o script gen
│   │   │   │   ├── tts_service.py            # MuAPI MiniMax TTS
│   │   │   │   ├── video_service.py          # MuAPI WAN2.1/VEO3
│   │   │   │   ├── music_service.py          # MuAPI Suno
│   │   │   │   └── muapi_client.py           # Base MuAPI client
│   │   │   ├── video/
│   │   │   │   ├── composer.py               # FFmpeg composition
│   │   │   │   ├── caption_generator.py      # SRT from script
│   │   │   │   └── thumbnail.py              # Frame extraction
│   │   │   ├── storage/
│   │   │   │   └── r2_client.py              # Cloudflare R2 upload
│   │   │   ├── social/
│   │   │   │   ├── instagram.py              # Meta Graph API
│   │   │   │   └── youtube.py                # YouTube Data API
│   │   │   └── viral_score.py                # Rule-based scorer
│   │   └── workers/
│   │       ├── video_worker.py               # RQ job definition
│   │       └── worker_runner.py              # RQ worker process
│   ├── alembic/                              # DB migrations
│   │   └── versions/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

---

### 3.2 Database Schema (PostgreSQL)

```sql
-- ============ USERS ============
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),          -- null if OAuth-only
    name            VARCHAR(255),
    plan            VARCHAR(20) DEFAULT 'free',  -- free | pro | business
    credits         INTEGER DEFAULT 5,
    language_pref   VARCHAR(10) DEFAULT 'hi',   -- hi | en | hinglish
    category_pref   VARCHAR(50),
    ig_access_token TEXT,                  -- encrypted
    ig_user_id      VARCHAR(100),
    yt_access_token TEXT,                  -- encrypted
    yt_refresh_token TEXT,                 -- encrypted
    yt_channel_id   VARCHAR(100),
    razorpay_sub_id VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============ PROJECTS ============
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(500),
    input_prompt    TEXT NOT NULL,
    language        VARCHAR(20) DEFAULT 'hi',
    style           VARCHAR(50),           -- funny|devotional|motivation|business|news
    voice_id        VARCHAR(50),
    duration_target INTEGER,               -- 30 | 60 | 90 seconds
    template_id     VARCHAR(50),

    -- Status tracking
    status          VARCHAR(20) DEFAULT 'pending',
    -- pending | processing | completed | failed
    job_id          VARCHAR(100),          -- Redis job ID

    -- Generated content
    script_json     JSONB,                 -- { narration, scenes[], visual_keywords[] }
    video_url       TEXT,                  -- Cloudflare R2 CDN URL
    thumbnail_url   TEXT,
    duration_actual INTEGER,               -- actual seconds
    file_size_bytes INTEGER,
    viral_score     FLOAT,
    caption_text    TEXT,
    hashtags        TEXT[],

    -- Error tracking
    error_message   TEXT,
    retry_count     INTEGER DEFAULT 0,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user_status ON projects(user_id, status);
CREATE INDEX idx_projects_user_created ON projects(user_id, created_at DESC);

-- ============ PUBLISH JOBS ============
CREATE TABLE publish_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    platform        VARCHAR(20) NOT NULL,  -- instagram | youtube
    status          VARCHAR(20) DEFAULT 'pending',
    -- pending | processing | published | failed
    caption         TEXT,
    hashtags        TEXT[],
    platform_post_id VARCHAR(200),
    error_message   TEXT,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============ TEMPLATES ============
CREATE TABLE templates (
    id              VARCHAR(50) PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    category        VARCHAR(50),           -- funny|devotional|motivation|business|news
    language        VARCHAR(20),
    prompt_examples TEXT[],
    style_config    JSONB,
    -- { color_overlay, music_genre, font_style, transition_style }
    thumbnail_url   TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0
);

-- ============ CREDIT TRANSACTIONS ============
CREATE TABLE credit_transactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    delta       INTEGER NOT NULL,          -- negative = debit, positive = credit
    reason      VARCHAR(100),             -- generation | purchase | referral | refund
    project_id  UUID REFERENCES projects(id),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.3 API Specification (FastAPI)

#### Authentication Endpoints

```python
POST   /api/v1/auth/signup
# Body: { email, password, name }
# Returns: { access_token, refresh_token, user }

POST   /api/v1/auth/login
# Body: { email, password }
# Returns: { access_token, refresh_token, user }

POST   /api/v1/auth/refresh
# Body: { refresh_token }
# Returns: { access_token }

POST   /api/v1/auth/logout
# Clears session

GET    /api/v1/auth/me
# Returns: { user }
```

#### Generation Endpoints

```python
POST   /api/v1/generate
# Body: {
#   prompt: str,           # 10-500 chars
#   language: str,         # hi | en | hinglish
#   style: str,            # funny|devotional|motivation|business|news
#   voice_id: str,         # rohit_m | priya_f | arjun_m | ananya_f
#   duration: int,         # 30 | 60 | 90
#   template_id?: str
# }
# Returns: { project_id, job_id, estimated_seconds: 45 }
# Side effects: deducts 1 credit, creates project row, enqueues job

GET    /api/v1/generate/status/{job_id}
# Returns: { status, percent, step, video_url?, error? }

WebSocket /api/v1/ws/{job_id}
# Server pushes: { event, step, percent, video_url?, thumbnail_url?, error? }
```

#### Project Endpoints

```python
GET    /api/v1/projects
# Query: ?page=1&limit=20&status=completed
# Returns: { items[], total, page }

GET    /api/v1/projects/{project_id}
# Returns: full project object

DELETE /api/v1/projects/{project_id}
# Soft delete

PATCH  /api/v1/projects/{project_id}
# Body: { caption?, hashtags?, title? }
# Update caption before publishing
```

#### Social Publish Endpoints

```python
# Instagram OAuth
GET    /api/v1/social/instagram/connect
# Redirects to Meta OAuth → callback:
GET    /api/v1/social/instagram/callback?code=...
# Stores access token in user record

POST   /api/v1/social/instagram/publish
# Body: { project_id, caption, hashtags[] }
# Returns: { publish_job_id }

# YouTube OAuth
GET    /api/v1/social/youtube/connect
# Redirects to Google OAuth → callback:
GET    /api/v1/social/youtube/callback?code=...

POST   /api/v1/social/youtube/publish
# Body: { project_id, caption, hashtags[], title }
# Returns: { publish_job_id }

GET    /api/v1/social/status
# Returns: { instagram: { connected, username }, youtube: { connected, channel } }
```

#### User Endpoints

```python
GET    /api/v1/user/me
PATCH  /api/v1/user/me
# Body: { name?, language_pref?, category_pref? }

GET    /api/v1/user/credits
# Returns: { remaining, plan, reset_date }

GET    /api/v1/user/usage
# Returns: { videos_this_month, total_videos, published_count }
```

#### Template Endpoints

```python
GET    /api/v1/templates
# Query: ?category=devotional&language=hi
# Returns: templates[]

GET    /api/v1/templates/{template_id}
```

#### Payment Endpoints

```python
POST   /api/v1/payments/create-order
# Body: { plan: "pro" | "business" }
# Returns: { razorpay_order_id, amount }

POST   /api/v1/payments/verify
# Body: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
# Upgrades user plan + resets credits

POST   /api/v1/payments/webhook
# Razorpay subscription webhook (recurring billing)
```

---

### 3.4 Core Service Implementations

#### MuAPI Base Client

```python
# backend/app/services/ai/muapi_client.py

import httpx
import asyncio
from app.config import settings

class MuAPIClient:
    BASE_URL = "https://api.muapi.ai/api/v1"
    POLL_INTERVAL = 3  # seconds
    MAX_POLLS = 60     # 3 min timeout

    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {settings.MUAPI_API_KEY}",
            "Content-Type": "application/json"
        }

    async def submit_job(self, endpoint: str, payload: dict) -> str:
        """Submit a job and return job_id"""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.BASE_URL}/{endpoint}",
                json=payload,
                headers=self.headers
            )
            response.raise_for_status()
            data = response.json()
            return data["job_id"]

    async def poll_job(self, job_id: str) -> dict:
        """Poll until job completes or fails"""
        async with httpx.AsyncClient(timeout=10) as client:
            for attempt in range(self.MAX_POLLS):
                response = await client.get(
                    f"{self.BASE_URL}/jobs/{job_id}",
                    headers=self.headers
                )
                data = response.json()
                if data["status"] == "completed":
                    return data
                elif data["status"] == "failed":
                    raise Exception(f"MuAPI job failed: {data.get('error')}")
                await asyncio.sleep(self.POLL_INTERVAL)
        raise TimeoutError(f"MuAPI job {job_id} timed out after 3 minutes")

    async def run(self, endpoint: str, payload: dict) -> dict:
        """Submit + poll in one call"""
        job_id = await self.submit_job(endpoint, payload)
        return await self.poll_job(job_id)
```

#### Script Generator (GPT-4o)

```python
# backend/app/services/ai/script_generator.py

from openai import AsyncOpenAI
import json
from app.config import settings

SCRIPT_PROMPT = {
    "hi": {
        "funny": """Tu ek viral Hindi comedy reel ka script likhne wala expert hai.
User ka topic: {prompt}
Duration: {duration} seconds

Niche format mein ONLY JSON return kar, koi extra text nahi:
{{
  "narration": "full voiceover text in Hindi (Devanagari)",
  "hook": "first 3 seconds - most attention-grabbing line",
  "scenes": [
    {{"id": 1, "duration": 5, "narration_segment": "...", "visual": "what to show on screen"}}
  ],
  "visual_keywords": ["keyword1", "keyword2"],
  "caption": "Instagram caption in Hinglish",
  "hashtags": ["#tag1", "#tag2"]
}}""",
        "motivation": """Tu viral motivational Hindi reel ka script likhne wala expert hai...""",
        # Add other styles similarly
    },
    "en": {
        "funny": """You are an expert viral short-form video scriptwriter...
Topic: {prompt}
Duration: {duration} seconds
Return ONLY JSON: {{ narration, hook, scenes[], visual_keywords[], caption, hashtags[] }}"""
    }
}

async def generate_script(
    prompt: str,
    language: str,
    style: str,
    duration: int
) -> dict:
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    system_prompt = SCRIPT_PROMPT.get(language, SCRIPT_PROMPT["en"]).get(
        style, SCRIPT_PROMPT["en"]["funny"]
    )
    
    response = await client.chat.completions.create(
        model="gpt-4o",
        temperature=0.85,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt.format(
                prompt=prompt, duration=duration
            )},
            {"role": "user", "content": f"Create script for: {prompt}"}
        ]
    )
    
    return json.loads(response.choices[0].message.content)
```

#### TTS Service (MuAPI MiniMax)

```python
# backend/app/services/ai/tts_service.py

import httpx
import tempfile
from pathlib import Path
from .muapi_client import MuAPIClient

VOICE_MAP = {
    "rohit_m":  "male_rohit_hindi",
    "priya_f":  "female_priya_hindi",
    "arjun_m":  "male_arjun_en",
    "ananya_f": "female_ananya_en"
}

async def generate_voice(
    text: str,
    voice_id: str,
    speed: float = 1.0
) -> str:
    """Returns path to downloaded MP3 file"""
    client = MuAPIClient()
    
    result = await client.run(
        endpoint="minimax-speech-2.6-hd",
        payload={
            "text": text,
            "voice_id": VOICE_MAP.get(voice_id, "male_rohit_hindi"),
            "speed": speed,
            "format": "mp3"
        }
    )
    
    # Download the audio file to temp dir
    audio_url = result["output"]["audio_url"]
    tmp_path = Path(tempfile.mktemp(suffix=".mp3"))
    
    async with httpx.AsyncClient() as http:
        response = await http.get(audio_url)
        tmp_path.write_bytes(response.content)
    
    return str(tmp_path)
```

#### Video Service (MuAPI WAN2.1 / VEO3)

```python
# backend/app/services/ai/video_service.py

import httpx
import tempfile
from pathlib import Path
from .muapi_client import MuAPIClient

async def generate_video_clip(
    visual_keyword: str,
    duration: int = 5,
    use_premium: bool = False
) -> str:
    """Returns path to downloaded MP4 clip"""
    client = MuAPIClient()
    
    model = "veo3-text-to-video" if use_premium else "wan2.1-text-to-video"
    
    prompt = f"""Cinematic, vertical 9:16 video: {visual_keyword}.
No text, no subtitles. Smooth camera movement. Indian context preferred.
Duration: {duration} seconds. Photorealistic."""
    
    result = await client.run(
        endpoint=model,
        payload={
            "prompt": prompt,
            "duration": duration,
            "aspect_ratio": "9:16",
            "resolution": "1080p"
        }
    )
    
    video_url = result["output"]["video_url"]
    tmp_path = Path(tempfile.mktemp(suffix=".mp4"))
    
    async with httpx.AsyncClient(timeout=120) as http:
        response = await http.get(video_url)
        tmp_path.write_bytes(response.content)
    
    return str(tmp_path)

async def generate_all_clips(
    visual_keywords: list[str],
    scene_durations: list[int],
    use_premium: bool = False
) -> list[str]:
    """Generate all clips in parallel"""
    import asyncio
    tasks = [
        generate_video_clip(kw, dur, use_premium)
        for kw, dur in zip(visual_keywords, scene_durations)
    ]
    return await asyncio.gather(*tasks)
```

#### Music Service (MuAPI Suno)

```python
# backend/app/services/ai/music_service.py

from .muapi_client import MuAPIClient
import httpx, tempfile
from pathlib import Path

STYLE_TO_MUSIC = {
    "funny":       "upbeat fun comedic background music, no vocals, light",
    "devotional":  "peaceful Indian devotional instrumental, bhajan style, calm",
    "motivation":  "inspiring cinematic background music, uplifting, no vocals",
    "business":    "professional corporate background music, subtle, no vocals",
    "news":        "neutral news background music, informative tone"
}

async def generate_background_music(
    style: str,
    duration: int
) -> str:
    client = MuAPIClient()
    prompt = STYLE_TO_MUSIC.get(style, STYLE_TO_MUSIC["motivation"])
    
    result = await client.run(
        endpoint="suno-create-music",
        payload={
            "prompt": f"{prompt}, {duration} seconds, loop-friendly",
            "duration": min(duration + 5, 30),  # Suno max
            "instrumental": True
        }
    )
    
    music_url = result["output"]["audio_url"]
    tmp_path = Path(tempfile.mktemp(suffix=".mp3"))
    
    async with httpx.AsyncClient() as http:
        response = await http.get(music_url)
        tmp_path.write_bytes(response.content)
    
    return str(tmp_path)
```

#### FFmpeg Video Composer

```python
# backend/app/services/video/composer.py

import subprocess
import tempfile
from pathlib import Path
from .caption_generator import generate_srt

def compose_video(
    video_clips: list[str],    # list of .mp4 file paths
    voice_path: str,           # .mp3
    music_path: str,           # .mp3
    script: dict,              # { narration, scenes[] }
    output_path: str,
    watermark_path: str = "assets/watermark.png"
) -> str:
    # Step 1: Generate SRT captions from narration
    srt_path = generate_srt(script["narration"], voice_path)
    
    # Step 2: Build FFmpeg filter graph
    n = len(video_clips)
    
    # Input flags: all clips + voice + music
    input_flags = []
    for clip in video_clips:
        input_flags += ["-i", clip]
    input_flags += ["-i", voice_path, "-i", music_path]
    
    voice_idx = n      # voice is input #n
    music_idx = n + 1  # music is input #n+1
    
    # Video filter: scale each clip → concat → add captions → add watermark
    scale_parts = []
    for i in range(n):
        scale_parts.append(
            f"[{i}:v]scale=1080:1920:force_original_aspect_ratio=increase,"
            f"crop=1080:1920,setsar=1,setpts=PTS-STARTPTS[v{i}]"
        )
    
    concat_in = "".join(f"[v{i}]" for i in range(n))
    concat_out = f"{concat_in}concat=n={n}:v=1:a=0[vcat]"
    
    # Captions
    caption_filter = (
        f"[vcat]subtitles={srt_path}:"
        f"force_style='FontName=Noto Sans,FontSize=26,"
        f"PrimaryColour=&H00FFFFFF,Bold=1,"
        f"OutlineColour=&H00000000,Outline=3,"
        f"Alignment=2,MarginV=60'[vcap]"
    )
    
    # Watermark
    watermark_filter = (
        f"[vcap][{n+2}:v]overlay=W-w-20:H-h-20[vout]"
    )
    
    # Audio: voice at full volume, music ducked to 12%
    audio_filter = (
        f"[{voice_idx}:a]volume=1.0,apad[voice];"
        f"[{music_idx}:a]volume=0.12[music];"
        f"[voice][music]amix=inputs=2:duration=first:dropout_transition=2[aout]"
    )
    
    filter_complex = ";".join([
        *scale_parts,
        concat_out,
        caption_filter,
        watermark_filter,
        audio_filter
    ])
    
    cmd = [
        "ffmpeg", "-y",
        *input_flags,
        "-i", watermark_path,
        "-filter_complex", filter_complex,
        "-map", "[vout]",
        "-map", "[aout]",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        "-r", "30",
        output_path
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {result.stderr}")
    
    return output_path
```

#### Video Worker (Main Orchestrator)

```python
# backend/app/workers/video_worker.py

import asyncio
import tempfile
from pathlib import Path
from app.database import SessionLocal
from app.models.project import Project
from app.services.ai.script_generator import generate_script
from app.services.ai.tts_service import generate_voice
from app.services.ai.video_service import generate_all_clips
from app.services.ai.music_service import generate_background_music
from app.services.video.composer import compose_video
from app.services.video.thumbnail import extract_thumbnail
from app.services.storage.r2_client import upload_to_r2
from app.services.viral_score import calculate_viral_score
import redis
import json

redis_client = redis.Redis.from_url(settings.REDIS_URL)

def publish_progress(job_id: str, step: str, percent: int, **kwargs):
    """Publish progress to Redis pub/sub → WebSocket handler reads this"""
    payload = {"event": "progress", "step": step, "percent": percent, **kwargs}
    redis_client.publish(f"job:{job_id}", json.dumps(payload))

def process_video_job(
    project_id: str,
    job_id: str,
    prompt: str,
    language: str,
    style: str,
    voice_id: str,
    duration: int,
    user_plan: str
):
    """Main worker function — called by RQ"""
    db = SessionLocal()
    try:
        # Update project status
        project = db.query(Project).filter(Project.id == project_id).first()
        project.status = "processing"
        project.job_id = job_id
        db.commit()
        
        use_premium = (user_plan == "pro")
        tmp_dir = Path(tempfile.mkdtemp())
        
        # ── Step 1: Generate Script ────────────────────────────────
        publish_progress(job_id, "generating_script", 10)
        script = asyncio.run(generate_script(prompt, language, style, duration))
        project.script_json = script
        db.commit()
        publish_progress(job_id, "script_done", 20)
        
        # ── Step 2: TTS (voice) + Music (parallel) ─────────────────
        publish_progress(job_id, "generating_voice", 25)
        
        async def generate_audio():
            voice_task = generate_voice(script["narration"], voice_id)
            music_task = generate_background_music(style, duration)
            return await asyncio.gather(voice_task, music_task)
        
        voice_path, music_path = asyncio.run(generate_audio())
        publish_progress(job_id, "voice_done", 40)
        
        # ── Step 3: Video Clips ────────────────────────────────────
        publish_progress(job_id, "generating_visuals", 45)
        visual_keywords = script["visual_keywords"][:6]  # max 6 clips
        scene_durations = [
            scene["duration"] for scene in script["scenes"][:6]
        ]
        
        video_clips = asyncio.run(
            generate_all_clips(visual_keywords, scene_durations, use_premium)
        )
        publish_progress(job_id, "visuals_done", 70)
        
        # ── Step 4: FFmpeg Composition ─────────────────────────────
        publish_progress(job_id, "composing", 75)
        output_path = str(tmp_dir / "final_video.mp4")
        
        compose_video(
            video_clips=video_clips,
            voice_path=voice_path,
            music_path=music_path,
            script=script,
            output_path=output_path
        )
        publish_progress(job_id, "composing", 85)
        
        # ── Step 5: Thumbnail + Upload ─────────────────────────────
        thumbnail_path = str(tmp_dir / "thumbnail.jpg")
        extract_thumbnail(output_path, thumbnail_path, at_second=2)
        
        video_url = asyncio.run(
            upload_to_r2(output_path, f"videos/{project_id}/final.mp4")
        )
        thumbnail_url = asyncio.run(
            upload_to_r2(thumbnail_path, f"videos/{project_id}/thumb.jpg")
        )
        
        # ── Step 6: Viral Score + Save ─────────────────────────────
        viral_score = calculate_viral_score(script, duration, style)
        
        project.status = "completed"
        project.video_url = video_url
        project.thumbnail_url = thumbnail_url
        project.viral_score = viral_score
        project.caption_text = script.get("caption", "")
        project.hashtags = script.get("hashtags", [])
        db.commit()
        
        publish_progress(
            job_id, "completed", 100,
            event="completed",
            video_url=video_url,
            thumbnail_url=thumbnail_url,
            viral_score=viral_score
        )
        
    except Exception as e:
        project.status = "failed"
        project.error_message = str(e)
        db.commit()
        publish_progress(job_id, "failed", 0, event="failed", error=str(e))
        raise
    finally:
        db.close()
```

#### WebSocket Handler

```python
# backend/app/api/websocket.py

from fastapi import WebSocket, WebSocketDisconnect
from app.config import settings
import redis.asyncio as aioredis
import json

async def websocket_job_progress(websocket: WebSocket, job_id: str):
    await websocket.accept()
    
    redis = await aioredis.from_url(settings.REDIS_URL)
    pubsub = redis.pubsub()
    await pubsub.subscribe(f"job:{job_id}")
    
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                await websocket.send_json(data)
                
                # Close connection when done
                if data.get("event") in ("completed", "failed"):
                    break
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe(f"job:{job_id}")
        await redis.close()
```

#### Cloudflare R2 Client

```python
# backend/app/services/storage/r2_client.py

import boto3
from app.config import settings

def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        region_name="auto"
    )

async def upload_to_r2(local_path: str, r2_key: str) -> str:
    """Upload file and return public CDN URL"""
    client = get_r2_client()
    
    content_type = "video/mp4" if r2_key.endswith(".mp4") else "image/jpeg"
    
    with open(local_path, "rb") as f:
        client.put_object(
            Bucket=settings.R2_BUCKET_NAME,
            Key=r2_key,
            Body=f,
            ContentType=content_type,
            CacheControl="public, max-age=31536000"
        )
    
    return f"{settings.R2_PUBLIC_URL}/{r2_key}"
```

#### Viral Score (Rule-Based for MVP)

```python
# backend/app/services/viral_score.py

def calculate_viral_score(script: dict, duration: int, style: str) -> float:
    score = 0.0
    
    # Hook strength (0-30 pts): does the hook have a question or shock?
    hook = script.get("hook", "")
    if "?" in hook:       score += 20
    elif "!" in hook:     score += 15
    elif len(hook) > 40:  score += 10
    else:                 score += 5
    
    # Caption quality (0-25 pts): length + hashtags
    caption = script.get("caption", "")
    hashtags = script.get("hashtags", [])
    if len(caption) > 50:   score += 10
    if len(hashtags) >= 8:  score += 15
    elif len(hashtags) >= 4: score += 8
    
    # Duration (0-20 pts): 30s is currently best for Reels
    duration_score = {30: 20, 60: 15, 90: 10}
    score += duration_score.get(duration, 10)
    
    # Style bonus (0-15 pts): comedy and motivation historically viral
    style_bonus = {"funny": 15, "motivation": 12, "devotional": 10,
                   "business": 8, "news": 6}
    score += style_bonus.get(style, 8)
    
    # Scene count (0-10 pts): variety keeps viewers watching
    scene_count = len(script.get("scenes", []))
    if scene_count >= 5: score += 10
    elif scene_count >= 3: score += 7
    else: score += 3
    
    return min(round(score, 1), 100.0)
```

---

### 3.5 Frontend Key Components

#### WebSocket Hook (React)

```typescript
// frontend/lib/websocket.ts
import { useState, useEffect, useRef } from "react";

export interface JobProgress {
  event: string;
  step: string;
  percent: number;
  video_url?: string;
  thumbnail_url?: string;
  viral_score?: number;
  error?: string;
}

export function useJobProgress(jobId: string | null) {
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}/api/v1/ws/${jobId}`
    );
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data: JobProgress = JSON.parse(event.data);
      setProgress(data);
    };

    ws.onerror = () => {
      setProgress({ event: "failed", step: "error", percent: 0,
                    error: "Connection lost" });
    };

    return () => ws.close();
  }, [jobId]);

  return progress;
}
```

#### Generation Form

```typescript
// frontend/components/CreateForm.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

const STYLES = ["funny", "devotional", "motivation", "business", "news"];
const LANGUAGES = ["hi", "en", "hinglish"];
const VOICES = [
  { id: "rohit_m",  label: "Rohit", gender: "male", lang: "Hindi" },
  { id: "priya_f",  label: "Priya", gender: "female", lang: "Hindi" },
  { id: "arjun_m",  label: "Arjun", gender: "male", lang: "English" },
  { id: "ananya_f", label: "Ananya", gender: "female", lang: "English" },
];

export default function CreateForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    prompt: "", language: "hi", style: "motivation",
    voice_id: "rohit_m", duration: 60
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (form.prompt.length < 10) {
      setError("Please write at least 10 characters"); return;
    }
    setLoading(true);
    try {
      const { project_id, job_id } = await apiClient.post("/generate", form);
      router.push(`/projects/${project_id}?job_id=${job_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to start generation");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <textarea
        placeholder="Aaj ka thought kya hai? (Hindi or English)"
        value={form.prompt}
        onChange={(e) => setForm({ ...form, prompt: e.target.value })}
        className="w-full h-32 p-4 text-lg border-2 rounded-xl resize-none"
        maxLength={500}
      />
      {/* Style, Language, Voice, Duration pickers */}
      {/* ... */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-4 bg-orange-500 text-white text-xl font-bold rounded-xl"
      >
        {loading ? "Starting..." : "🎬 Video Banao!"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
```

---

### 3.6 Environment Variables

```bash
# backend/.env

# App
APP_ENV=development
SECRET_KEY=your-secret-key-32-chars-minimum
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://reelcraft:password@postgres:5432/reelcraft
REDIS_URL=redis://redis:6379/0

# AI APIs
OPENAI_API_KEY=sk-...
MUAPI_API_KEY=...           # Get from muapi.ai dashboard

# Cloudflare R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=reelcraft-media
R2_PUBLIC_URL=https://your-bucket.your-account.r2.dev

# Social APIs
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...

# Payments
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Tokens
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
```

---

### 3.7 Docker Compose

```yaml
# docker-compose.yml

version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: reelcraft
      POSTGRES_USER: reelcraft
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U reelcraft"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]

  api:
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app

  worker:
    build: ./backend
    command: python -m app.workers.worker_runner
    env_file:
      - ./backend/.env
    depends_on:
      - postgres
      - redis
      - api
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    command: npm run dev
    ports:
      - "3000:3000"
    env_file:
      - ./frontend/.env.local
    depends_on:
      - api
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
```

---

### 3.8 Backend requirements.txt

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
alembic==1.13.1
asyncpg==0.29.0
psycopg2-binary==2.9.9
redis==5.0.4
rq==1.16.2
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
httpx==0.27.0
openai==1.30.0
boto3==1.34.0          # Cloudflare R2 (S3-compatible)
python-dotenv==1.0.1
pydantic-settings==2.2.1
google-auth==2.29.0
google-auth-oauthlib==1.2.0
google-api-python-client==2.131.0
razorpay==1.4.1
```

---

### 3.9 Alembic Migration (Initial)

```python
# alembic/versions/001_initial_schema.py
# Run: alembic upgrade head
```

---

### 3.10 Railway Deployment (railwayignore + Procfile)

```
# backend/Procfile
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
worker: python -m app.workers.worker_runner
```

---

## PART 4: CLAUDE CODE INSTRUCTIONS

---

### 4.1 Build Order for Claude Code

Tell Claude Code to build in this exact sequence to avoid dependency issues:

```
PHASE 1 — Foundation (tell Claude Code first):
1. docker-compose.yml + directory structure
2. Backend: database.py + models (all 5 tables) + alembic migration
3. Backend: config.py (all env vars with pydantic-settings)
4. Backend: auth endpoints (/signup, /login, /refresh, /me) + JWT utils
5. Frontend: layout + auth pages (login/signup) + api.ts client

PHASE 2 — Core Generation:
6. Backend: muapi_client.py + all 4 AI services (script, tts, video, music)
7. Backend: composer.py (FFmpeg) + r2_client.py
8. Backend: video_worker.py (full orchestration)
9. Backend: generate endpoint + WebSocket endpoint
10. Frontend: CreateForm + GenerationProgress components + projects/:id page

PHASE 3 — Social + Payments:
11. Backend: Instagram OAuth + publish endpoint
12. Backend: YouTube OAuth + publish endpoint
13. Frontend: PublishModal component
14. Backend: Razorpay payment endpoints
15. Frontend: upgrade modal + credits indicator

PHASE 4 — Polish:
16. Frontend: Dashboard page (video grid + cards)
17. Backend: Templates seeding (10 templates)
18. Frontend: Landing page (hero + demo)
19. Tests (pytest for worker + API)
20. README + .env.example
```

### 4.2 Key Instructions for Claude Code

```
1. Use async/await throughout FastAPI — never blocking DB calls
2. All DB sessions must be properly closed (use dependency injection)
3. FFmpeg must be installed in the Docker image (add to Dockerfile)
4. The worker runs in a SEPARATE process from the API — never import
   worker functions directly in the API layer
5. WebSocket progress uses Redis pub/sub — worker publishes,
   WebSocket endpoint subscribes
6. All sensitive tokens (IG, YT) must be stored encrypted in DB
   (use Fernet symmetric encryption with SECRET_KEY)
7. Video files in /tmp must be cleaned up after R2 upload
8. MuAPI calls can take 30-60 seconds — use httpx with timeout=180
9. Razorpay webhook must verify signature before processing
10. Credits check must happen BEFORE enqueuing job — atomic decrement
```

### 4.3 Prompt to Start Claude Code

Copy this exactly:

```
Build the ReelCraft application — an AI-powered short video creation platform for Indian content creators.

Follow the PRD and architecture in reelcraft-prd-architecture.md exactly.

Tech Stack:
- Frontend: Next.js 14 (TypeScript, App Router, Tailwind CSS)
- Backend: FastAPI (Python 3.12, async)
- Queue: Redis + RQ
- DB: PostgreSQL with SQLAlchemy + Alembic
- Video: FFmpeg
- AI: OpenAI GPT-4o (scripts) + MuAPI (TTS/video/music)
- Storage: Cloudflare R2 (boto3 S3-compatible)
- Payments: Razorpay

Start with PHASE 1:
1. Create the full directory structure
2. docker-compose.yml (postgres, redis, api, worker, frontend)
3. Backend: database.py, all SQLAlchemy models, alembic migration
4. Backend: config.py with pydantic-settings
5. Backend: auth endpoints with JWT

Use the exact schema and API specifications from the document. Ask me if you need any API keys or clarification.
```

---

## APPENDIX: API Keys You Need Before Starting

| Service | Where to get | Cost |
|---|---|---|
| OpenAI GPT-4o | platform.openai.com | ~$0.005/script |
| MuAPI | muapi.ai | Pay per generation; check playground for pricing |
| Cloudflare R2 | cloudflare.com/r2 | 10GB free, $0.015/GB after |
| Instagram Graph API | developers.facebook.com | Free (need Meta developer app) |
| YouTube Data API | console.cloud.google.com | Free (10K units/day) |
| Razorpay | razorpay.com | Free; 2% per transaction |

---

*End of Document — ReelCraft PRD + Architecture v1.0*
