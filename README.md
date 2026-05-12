# ReelCraft — AI-Powered Short Video Platform

Generate studio-quality 9:16 reels in Hindi, English, or Hinglish in ~45 seconds. Type a prompt → get an MP4 with voiceover, background music, captions, and cinematic visuals.

Built for Indian content creators — pre-loaded with templates and an inspiration gallery across comedy, motivation, business, devotional, and news categories.

---

## Features

- **Prompt-to-Reel in ~45s** — GPT-4o script → MiniMax TTS voice → Suno music → WAN2.1/VEO3 video clips → FFmpeg compose
- **Inspiration Gallery** — 20 curated prompts with hover-to-play preview cards (pollo.ai-style)
- **Templates** — 10 category templates (Hindi Comedy, Motivation, Business, Devotional, News)
- **Real-time Progress** — WebSocket stream: script → voice → visuals → compose → done
- **Social Publishing** — Instagram and YouTube OAuth + one-click publish
- **Credits System** — Razorpay payments, per-generation deduction, atomic credit checks
- **Free vs Pro** — Free uses WAN2.1, Pro upgrades to VEO3 (Google's best video model)
- **Multi-language** — Hindi, English, Hinglish with language-aware TTS and captions

---

## Architecture

```
User Prompt
    │
    ▼
POST /api/v1/generate
    ├── Atomic credit deduct (PostgreSQL)
    ├── Create project row (status=pending)
    └── Enqueue RQ job → Redis
            │
            ▼
    Frontend WebSocket  ◄──── Redis pub/sub ◄──── RQ Worker
    (real-time progress)                               │
                                                       ├─ GPT-4o → script JSON
                                                       ├─ MiniMax TTS → voice.mp3
                                                       ├─ Suno → music.mp3       } parallel
                                                       ├─ WAN2.1/VEO3 → clips[]  }
                                                       ├─ FFmpeg → final.mp4
                                                       └─ Upload → Cloudflare R2
```

Progress events: `generating_script(10%)` → `script_done(20%)` → `voice_done(40%)` → `visuals_done(70%)` → `composing(85%)` → `completed(100%)`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend API | FastAPI, SQLAlchemy (async), Pydantic |
| Job Queue | Redis + RQ (Python) |
| Database | PostgreSQL 16 |
| Storage | Cloudflare R2 (S3-compatible) |
| AI — Script | OpenAI GPT-4o |
| AI — Voice | MuAPI → MiniMax Speech-2.6-HD |
| AI — Music | MuAPI → Suno Create Music |
| AI — Video | MuAPI → WAN2.1 (free) / VEO3 (pro) |
| Video Compose | FFmpeg |
| Payments | Razorpay |
| Auth | JWT (15min access + 7d refresh) |
| Social | Instagram Graph API, YouTube Data API v3 |

---

## Quick Start (Docker — Recommended)

```bash
# 1. Clone
git clone https://github.com/nitiprabhu/piku.git
cd piku

# 2. Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env — fill in all required keys (see Environment Variables below)

# 3. Configure frontend environment
cp frontend/.env.local.example frontend/.env.local
# Edit frontend/.env.local if needed (defaults work for local Docker)

# 4. Start everything
docker compose up --build

# Frontend:  http://localhost:3000
# API:       http://localhost:8005
# API Docs:  http://localhost:8005/docs
```

To watch video generation jobs in real-time:
```bash
docker compose logs -f worker
```

---

## Manual Setup (Without Docker)

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 16
- Redis 7

### Backend

```bash
cd backend
pip install -r requirements.txt

# Copy and fill env file
cp .env.example .env

# Start API
uvicorn app.main:app --reload --port 8000

# Start RQ worker (separate terminal)
python -m app.workers.worker_runner
```

### Frontend

```bash
cd frontend
npm install

# Copy env file
cp .env.local.example .env.local

# Start dev server
npm run dev        # http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Async PostgreSQL URL (asyncpg) | `postgresql+asyncpg://user:pass@localhost:5432/reelcraft` |
| `SYNC_DATABASE_URL` | Sync URL for RQ worker | `postgresql+psycopg2://user:pass@localhost:5432/reelcraft` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379/0` |
| `SECRET_KEY` | JWT signing + Fernet encryption | 32+ char random string |
| `OPENAI_API_KEY` | GPT-4o for script generation | `sk-...` |
| `MUAPI_API_KEY` | TTS + Music + Video generation | Get from muapi.ai |
| `R2_ENDPOINT_URL` | Cloudflare R2 S3 endpoint | `https://<account>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | R2 access key | — |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | — |
| `R2_BUCKET_NAME` | R2 bucket name | `reelcraft-videos` |
| `R2_PUBLIC_URL` | Public CDN URL for bucket | `https://pub.r2.dev/...` |
| `INSTAGRAM_APP_ID` | Meta app ID | — |
| `INSTAGRAM_APP_SECRET` | Meta app secret | — |
| `YOUTUBE_CLIENT_ID` | Google OAuth client ID | — |
| `YOUTUBE_CLIENT_SECRET` | Google OAuth client secret | — |
| `RAZORPAY_KEY_ID` | Razorpay key | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | — |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8005` |
| `NEXT_PUBLIC_WS_URL` | WebSocket base URL | `ws://localhost:8005` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public Razorpay key | — |

> **Security:** Never commit `.env` or `.env.local` files. Both are in `.gitignore`.

---

## API Reference

All routes prefixed `/api/v1/`. Full interactive docs at `/docs` when running.

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Get JWT tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Current user |
| POST | `/generate` | Start reel generation |
| GET | `/generate/{project_id}/status` | Poll job status |
| WS | `/ws/{job_id}` | Real-time progress stream |
| GET | `/projects` | Paginated project list |
| GET | `/projects/{id}` | Project detail + video URL |
| GET | `/templates` | All templates (filterable) |
| GET | `/inspire` | Inspiration gallery videos |
| POST | `/payments/order` | Create Razorpay order |
| POST | `/payments/verify` | Verify payment + add credits |
| GET | `/social/instagram/auth` | Start Instagram OAuth |
| GET | `/social/youtube/auth` | Start YouTube OAuth |
| POST | `/social/publish` | Publish to platform |

---

## Project Structure

```
reels-clone/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (auth, generate, social, …)
│   │   ├── models/       # SQLAlchemy models
│   │   ├── services/
│   │   │   └── ai/       # muapi_client, openai wrappers
│   │   ├── workers/      # RQ job functions (video pipeline)
│   │   ├── config.py     # Pydantic settings
│   │   ├── database.py   # Async + sync session factories
│   │   └── main.py       # App factory, lifespan, seeding
│   ├── alembic/          # DB migrations
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── (app)/        # Authenticated pages
│   │   │   ├── create/   # Prompt → generate flow
│   │   │   ├── templates/# Inspiration gallery + templates
│   │   │   ├── dashboard/# Project list
│   │   │   └── editor/   # Post-generation editor
│   │   └── (auth)/       # Login / signup
│   ├── components/       # Shared UI components
│   ├── lib/              # API client, utils
│   └── .env.local.example
├── docker-compose.yml
└── README.md
```

---

## Video Generation Pipeline (Worker)

```python
# Simplified from backend/app/workers/
async def generate_reel(project_id, prompt, language, plan):
    script = await openai_script(prompt, language)       # GPT-4o
    voice, music = await asyncio.gather(
        muapi_tts(script.narration, language),           # MiniMax
        muapi_music(script.mood),                        # Suno
    )
    clips = await asyncio.gather(*[
        muapi_video(scene, plan) for scene in script.scenes  # WAN2.1 / VEO3
    ])
    final = ffmpeg_compose(clips, voice, music, script.captions)
    url = r2_upload(final, project_id)
    return url
```

Model routing: Free plan → WAN2.1, Pro plan → VEO3. VEO3 timeout >60s → HiDream image + VEO3 Fast I2V fallback.

---

## Inspiration Gallery

The templates page includes a **Inspiration Gallery** section with 20 curated prompts across 5 categories. Hover a card to preview the video (when available). Click "Use this prompt" to jump to the create page with the prompt pre-filled.

Categories: Funny · Motivation · Business · Devotional · News

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with conventional commits: `feat:`, `fix:`, `chore:`
4. Open a PR

---

## License

MIT
