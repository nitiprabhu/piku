# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

ReelCraft — AI-powered short video creation platform for Indian content creators. Type a prompt, get a 9:16 MP4 reel (Hindi/English/Hinglish) in ~45s. Stack: Next.js 16 frontend + FastAPI backend + Redis/RQ job queue + PostgreSQL + Cloudflare R2 storage.

## Commands

### Full Stack (recommended)
```bash
docker compose up --build          # start all services
docker compose up api worker       # backend only
docker compose logs -f worker      # watch video generation jobs
```

### Frontend (`frontend/`)
```bash
npm run dev      # dev server on :3000
npm run build    # production build
npm run lint     # eslint
```

### Backend (`backend/`)
```bash
uvicorn app.main:app --reload --port 8000   # API server
python -m app.workers.worker_runner          # RQ worker (separate process)
```

**Note:** Frontend uses **Next.js 16** with breaking changes from earlier versions. Read `node_modules/next/dist/docs/` before making Next.js-specific changes (per `frontend/AGENTS.md`).

## Architecture

### Request → Video Flow

```
POST /api/v1/generate
  → deducts credit (atomic) → creates project row (status=pending)
  → enqueues RQ job to Redis
  → returns { project_id, job_id }

Frontend opens WebSocket: /api/v1/ws/{job_id}
  → WebSocket handler subscribes to Redis pub/sub channel job:{job_id}

Worker picks up job (separate process):
  1. GPT-4o → script JSON { narration, scenes[], visual_keywords[] }
  2. MuAPI MiniMax TTS → voice.mp3  |  MuAPI Suno → music.mp3  (parallel)
  3. MuAPI WAN2.1/VEO3 → video clips (parallel, one per scene)
  4. FFmpeg → compose: clips + voice + music + SRT captions + watermark
  5. Upload final.mp4 + thumb.jpg to Cloudflare R2
  6. worker publishes progress events → WebSocket pushes to client
```

Progress steps: `generating_script(10%)` → `script_done(20%)` → `voice_done(40%)` → `visuals_done(70%)` → `composing(85%)` → `completed(100%)`

### Key Architectural Rules

- **Worker is a separate process** — never import worker functions directly in the API layer
- **WebSocket uses Redis pub/sub** — worker calls `redis.publish(f"job:{job_id}", ...)`, WebSocket subscribes
- **Two DB sessions**: async (`AsyncSessionLocal` for API) and sync (`SessionLocal` for RQ worker, which calls `asyncio.run()` internally)
- **`init_db()` on startup** creates tables in dev; use Alembic for prod migrations
- **Social tokens (Instagram, YouTube) must be stored encrypted** using Fernet with `SECRET_KEY`
- **`/tmp` cleanup**: video clip temp files must be deleted after R2 upload

### Model Routing

| User plan | Video model | Notes |
|-----------|------------|-------|
| free | WAN2.1 (MuAPI) | Lower cost |
| pro | VEO3 (MuAPI) | Premium quality |
| VEO3 timeout >60s | HiDream image + VEO3 Fast I2V | Fallback |

All TTS: MiniMax Speech-2.6-HD. All music: Suno Create Music.

### MuAPI Pattern

All AI calls (except OpenAI) use async submit→poll:
```python
POST /api/v1/{model-name}  → { job_id }
GET  /api/v1/jobs/{job_id} → { status, output_url }
```
Client in `backend/app/services/ai/muapi_client.py`. Use `timeout=180` for MuAPI HTTP calls (30–60s jobs).

### API Routes

All backend routes prefixed `/api/v1/`:
- `auth.*` — JWT signup/login/refresh/me (15min access, 7d refresh tokens)
- `projects.*` — CRUD + paginated list
- `generate.*` — POST trigger + GET status
- `websocket.*` — WS progress stream
- `social.*` — Instagram + YouTube OAuth + publish
- `payments.*` — Razorpay orders/verify/webhook
- `templates.*` — 10 seeded templates (2 per category)
- `user.*` — profile + credits

### Database

PostgreSQL via SQLAlchemy async. Tables: `users`, `projects`, `publish_jobs`, `templates`, `credit_transactions`. Schema defined in `backend/app/models/`. Key: credits check + decrement must be **atomic** before enqueuing job.

### Environment

Copy `backend/.env.example` → `backend/.env`. Required keys: `DATABASE_URL` (asyncpg), `SYNC_DATABASE_URL` (psycopg2 for worker), `REDIS_URL`, `OPENAI_API_KEY`, `MUAPI_API_KEY`, R2 creds, social OAuth creds, Razorpay keys.

Frontend: `frontend/.env.local` — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`.

### Static Files (Dev Fallback)

When R2 is not configured, videos are served from `backend/app/static/videos/{project_id}/`. The FastAPI app mounts `/static` → `app/static/`.
