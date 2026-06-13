# ReelCraft — Project Memory (Updated 2026-06-13)

## What It Is
AI-powered short-video (9:16 MP4 reels) creation platform for Indian creators.
Hindi/English/Hinglish content, ~45s generation time per video.

## Stack
- **Frontend**: Next.js 16 (TypeScript) — `frontend/`, runs on :3000
- **Backend**: FastAPI — `backend/`, runs on :8005 (mapped from container :8000)
- **Worker**: RQ (Redis Queue) — separate process, `backend/app/workers/worker_runner.py`
- **DB**: PostgreSQL 16 via SQLAlchemy async (asyncpg for API, psycopg2 sync for worker)
- **Cache/Queue**: Redis 7
- **Storage**: Cloudflare R2 (with local `/static` fallback in dev)
- **Infra**: Docker Compose (`docker-compose.yml`)

## Key Services / AI Providers
- **Script**: GPT-4o (OpenAI)
- **TTS**: MuAPI → MiniMax Speech-2.6-HD
- **Music**: MuAPI → Suno Create Music
- **Video clips**: MuAPI → WAN2.1 (free plan) / VEO3 (pro plan); fallback = HiDream I2V
- **Alternative providers**: Kling, Fal.ai (providers/kling.py, providers/falai.py)
- **SMS/OTP**: MSG91
- **Payments**: Razorpay (subscriptions + one-time ₹29 first-video offer)
- **Scheduler**: APScheduler (series auto-posting, checks every 1 min on startup)

## MuAPI Pattern
All AI calls (except OpenAI) use async submit→poll:
```
POST /api/v1/{model} → { job_id }
GET  /api/v1/jobs/{job_id} → { status, output_url }
```
Client: `backend/app/services/ai/muapi_client.py`. Timeout: 180s.

## Video Generation Pipeline
```
POST /api/v1/generate
  → deduct credit (atomic) → create project (status=pending)
  → enqueue RQ job → return { project_id, job_id }

Frontend WebSocket: /api/v1/ws/{job_id}
  → subscribes to Redis pub/sub channel job:{job_id}

Worker (separate process):
  1. GPT-4o → script JSON { narration, scenes[], visual_keywords[] }
  2. MuAPI TTS (voice.mp3) + Suno (music.mp3) — parallel
  3. WAN2.1/VEO3 → video clips per scene — parallel
  4. FFmpeg → compose: clips + voice + music + SRT captions + watermark
  5. Upload final.mp4 + thumb.jpg to R2
  6. Publish progress events → WebSocket → client
```

Progress steps: `generating_script(10%)` → `script_done(20%)` → `voice_done(40%)` → `visuals_done(70%)` → `composing(85%)` → `completed(100%)`

## Content Types
- **video**: Full AI video reel (default)
- **image post**: Single image or carousel (`image_count` field on Project)

## API Routes (prefix `/api/v1/`)
- `auth` — phone-based JWT (OTP via MSG91), 15min access / 7d refresh tokens
- `user` — profile, credits
- `projects` — CRUD + paginated list
- `generate` — POST trigger, GET status (HTTP polling fallback via Redis `job_status:` key)
- `websocket` — WS progress stream
- `social` — Instagram + YouTube OAuth + publish
- `payments` — Razorpay orders/verify/webhook
- `templates` — 20+ seeded templates (regular, character, series_preset, ai_influencer types)
- `inspire` — inspiration videos feed
- `marketplace` — brand briefs + creator deals
- `series` — series + episode management
- `websocket` — WS at `/api/v1/ws/{job_id}`

## Database Models
| Table | Key Fields |
|-------|-----------|
| `users` | id, phone (unique), name, plan (free/starter/pro/business), credits, first_video_purchased, razorpay_sub_id |
| `projects` | id, user_id, input_prompt, language, style, voice_id, content_type, image_count, status, script_json, video_url, thumbnail_url, viral_score, caption_mode, is_deleted |
| `series` | id, user_id, name, topic, style, language, schedule_type (manual/daily/every_3_days/weekly), schedule_time, is_serialized, series_type, character_profile, content_pillars |
| `series_episodes` | series_id, episode_number, project_id, status |
| `publish_jobs` | for social publishing |
| `social_accounts` | user social tokens (Fernet encrypted) |
| `Template` | seeded templates with style_config JSON |
| `InspirationVideo` | seeded inspiration prompts |
| `marketplace` models | brand briefs + creator profiles/deals |

## Model Routing
| Plan | Video Model |
|------|------------|
| free | WAN2.1 (MuAPI) |
| pro | VEO3 (MuAPI) |
| VEO3 timeout >60s | HiDream image + VEO3 Fast I2V (fallback) |

## Frontend Pages
- `/` — Landing page (`LandingClient.tsx`)
- `/(auth)/login`, `/(auth)/signup`
- `/(app)/create` — video creation form
- `/(app)/dashboard` — project list
- `/(app)/projects/[id]` — project detail
- `/(app)/series`, `/series/new`, `/series/[id]` — series management
- `/(app)/templates` — template browser
- `/(app)/pricing` — plan pricing
- `/(app)/marketplace`, `/marketplace/brief/new`, `/marketplace/creator`, `/marketplace/deals/[id]`, `/marketplace/profile/setup`

## Frontend Components (root `components/`)
- `AppShell.tsx`, `PublishModal.tsx`, `UpgradeModal.tsx`

## Key Rules / Gotchas
1. **Worker is separate process** — never import worker functions in the API
2. **Two DB sessions**: async (`AsyncSessionLocal`) for API; sync (`SessionLocal`) for worker
3. **Credits must be atomically decremented** before enqueuing job
4. **Social tokens encrypted** with Fernet using `SECRET_KEY`
5. **Temp video files** in `/tmp` must be deleted after R2 upload
6. **`init_db()`** on startup creates tables (dev); use Alembic for prod migrations
7. **Next.js 16** has breaking changes — read `node_modules/next/dist/docs/` before changes
8. **VIDEO_PROVIDER** config: `auto` | `muapi` | `kling` | `falai`
9. R2 not configured → videos served from `backend/app/static/videos/{project_id}/`

## Environment
- Backend: `backend/.env` (copy from `.env.example`)
- Frontend: `frontend/.env.local`
- Key vars: `DATABASE_URL` (asyncpg), `SYNC_DATABASE_URL` (psycopg2), `REDIS_URL`, `OPENAI_API_KEY`, `MUAPI_API_KEY`, R2 creds, Razorpay keys, MSG91 keys

## Alembic Migrations (in order)
1. `001_initial_schema.py`
2. `583df...` — add series_type + character_profile
3. `9c83e...` — add is_serialized to series
4. `a1b2c...` — add razorpay_last_payment_id to users
5. `f47a5...` — add content_type + image_count to projects

## Recent / Notable Features
- **Series auto-scheduling** — APScheduler checks every minute, generates episodes on schedule
- **Content type: image post** — carousel/single image alternative to video
- **Character templates** — Raju Bhaiya, Priya Didi, Prof. Sharma, Rohit Anchor, Dev Bhai, Pandit Ji
- **Series presets (blueprints)** — Rahasya Channel, Sach Batao, Gyaan, Bharat Ki Kahaniyaan, Startup Secrets, AI Influencer
- **Marketplace** — brand ↔ creator deal platform
- **Viral score** — calculated and stored per project
- **Caption modes** — `full_sentence` | `keyword_pop`
- **Inspire feed** — seeded inspiration videos by category
