from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.api import auth, user, projects, generate, websocket, social, payments, templates, inspire, marketplace


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await seed_templates()
    await seed_inspiration_videos()
    yield
    # Shutdown


async def seed_templates():
    """Seed 10 default templates on startup if DB is empty."""
    from app.database import AsyncSessionLocal
    from app.models.publish_job import Template
    from sqlalchemy import select, func

    async with AsyncSessionLocal() as db:
        count = await db.execute(select(func.count()).select_from(Template))
        if count.scalar() > 0:
            return

        templates_data = [
            {
                "id": "funny-hindi-1", "name": "Hindi Comedy Reel", "category": "funny",
                "language": "hi", "sort_order": 1,
                "prompt_examples": ["Office mein kya hota hai", "Bhai ne kya kiya", "Desi jugaad"],
                "style_config": {"color_overlay": "#FF6B35", "music_genre": "upbeat", "font_style": "bold"},
            },
            {
                "id": "funny-hindi-2", "name": "Desi Meme Reel", "category": "funny",
                "language": "hi", "sort_order": 2,
                "prompt_examples": ["Indian wedding problems", "Exam time struggle", "Mom vs dad"],
                "style_config": {"color_overlay": "#F7C59F", "music_genre": "fun", "font_style": "comic"},
            },
            {
                "id": "devotional-1", "name": "Morning Shloka", "category": "devotional",
                "language": "hi", "sort_order": 3,
                "prompt_examples": ["Ganesh vandana", "Hanuman chalisa highlights", "Subah ki prarthana"],
                "style_config": {"color_overlay": "#FFD700", "music_genre": "devotional", "font_style": "elegant"},
            },
            {
                "id": "devotional-2", "name": "Spiritual Thought", "category": "devotional",
                "language": "hi", "sort_order": 4,
                "prompt_examples": ["Bhagwad Gita saar", "Buddha ke vichar", "Osho quotes"],
                "style_config": {"color_overlay": "#8B4513", "music_genre": "peaceful", "font_style": "serif"},
            },
            {
                "id": "motivation-1", "name": "Hindi Motivation", "category": "motivation",
                "language": "hi", "sort_order": 5,
                "prompt_examples": ["Safalta ka raaz", "Haar mat mano", "Apne sapne pura karo"],
                "style_config": {"color_overlay": "#1A1A2E", "music_genre": "cinematic", "font_style": "bold"},
            },
            {
                "id": "motivation-2", "name": "English Motivation", "category": "motivation",
                "language": "en", "sort_order": 6,
                "prompt_examples": ["Rise and grind", "Success habits", "Mindset shift"],
                "style_config": {"color_overlay": "#0F3460", "music_genre": "inspirational", "font_style": "modern"},
            },
            {
                "id": "business-1", "name": "Business Tips Hindi", "category": "business",
                "language": "hi", "sort_order": 7,
                "prompt_examples": ["Startup tips", "Marketing tricks", "Customer retention"],
                "style_config": {"color_overlay": "#2C3E50", "music_genre": "corporate", "font_style": "clean"},
            },
            {
                "id": "business-2", "name": "Product Showcase", "category": "business",
                "language": "hinglish", "sort_order": 8,
                "prompt_examples": ["New product launch", "Sale announcement", "Brand story"],
                "style_config": {"color_overlay": "#E74C3C", "music_genre": "upbeat", "font_style": "bold"},
            },
            {
                "id": "news-1", "name": "Daily News Reel", "category": "news",
                "language": "hi", "sort_order": 9,
                "prompt_examples": ["Aaj ki khabar", "Breaking news summary", "Weekly highlights"],
                "style_config": {"color_overlay": "#2980B9", "music_genre": "news", "font_style": "news"},
            },
            {
                "id": "news-2", "name": "Tech News", "category": "news",
                "language": "hinglish", "sort_order": 10,
                "prompt_examples": ["AI news today", "Startup funding", "iPhone vs Android"],
                "style_config": {"color_overlay": "#8E44AD", "music_genre": "electronic", "font_style": "modern"},
            },
        ]

        for t in templates_data:
            db.add(Template(**t))
        await db.commit()


async def seed_inspiration_videos():
    """Seed inspiration videos on startup if table is empty."""
    from app.database import AsyncSessionLocal
    from app.models.publish_job import InspirationVideo
    from sqlalchemy import select, func

    async with AsyncSessionLocal() as db:
        count = await db.execute(select(func.count()).select_from(InspirationVideo))
        if count.scalar() > 0:
            return

        videos = [
            # funny
            {"id": "funny-wifi", "title": "WiFi Band Drama", "category": "funny", "language": "hi", "sort_order": 1,
             "prompt": "Aaj ghar pe WiFi band ho gaya aur poora family ek dusre se baat karne lagi — bada emotional scene tha yaar"},
            {"id": "funny-sabzi", "title": "Sabzi Mandi Shock", "category": "funny", "language": "hi", "sort_order": 2,
             "prompt": "Sabzi mandi mein bhaav pooch ke mere boss ko dil ka daura padne wala tha — full comedy"},
            {"id": "funny-auto", "title": "Auto GPS Fail", "category": "funny", "language": "hi", "sort_order": 3,
             "prompt": "Auto wale bhaiya ne GPS se zyada apna dimag use kiya — aur hum abhi bhi ghoom rahe hain"},
            {"id": "funny-alarm", "title": "Indian Student Philosophy", "category": "funny", "language": "hi", "sort_order": 4,
             "prompt": "Exam ke din alarm ne 3 baar bajaya, 3 baar maine snooz kiya — philosophy of Indian student"},
            # motivation
            {"id": "motiv-kal", "title": "Kal Wali Soch", "category": "motivation", "language": "hinglish", "sort_order": 5,
             "prompt": "Yaar tu roz uthta hai aur kehta hai kal se — kal kab aayega bata? Aaj shuru kar"},
            {"id": "motiv-failure", "title": "Failure = Practice", "category": "motivation", "language": "hinglish", "sort_order": 6,
             "prompt": "Failure matlab end nahi, failure matlab next attempt ki practice — real talk for hustlers"},
            {"id": "motiv-growth", "title": "5 Saal Pehle", "category": "motivation", "language": "hinglish", "sort_order": 7,
             "prompt": "5 saal pehle wali photo dekhi — aaj woh insaan aur main kaafi alag hain. Growth real hai"},
            {"id": "motiv-habit", "title": "Ek Chhoti Habit", "category": "motivation", "language": "hi", "sort_order": 8,
             "prompt": "Ek chhoti si habit jo roz karo — 1 saal baad tum khud apne aap ko pehchan nahi paoge"},
            # business
            {"id": "biz-zero", "title": "Zero Se Startup", "category": "business", "language": "hinglish", "sort_order": 9,
             "prompt": "Zero se ek startup kaise banaya — bina funding, bina connections, sirf ek idea aur WiFi"},
            {"id": "biz-compound", "title": "Compound Interest Power", "category": "business", "language": "hi", "sort_order": 10,
             "prompt": "Compound interest ki power samjho — 10 saal mein 10 lakh kaise 50 lakh ban jaata hai"},
            {"id": "biz-freelance", "title": "Freelancing Mistakes", "category": "business", "language": "hinglish", "sort_order": 11,
             "prompt": "Freelancing shuru karna chahte ho? Yeh 3 mistakes mat karo jo maine ki thi"},
            {"id": "biz-ideas", "title": "Untapped India Ideas", "category": "business", "language": "hinglish", "sort_order": 12,
             "prompt": "India mein teen business ideas jo abhi bhi untapped hain — serious founders ke liye"},
            # devotional
            {"id": "dev-gita", "title": "Gita Ka Jawab", "category": "devotional", "language": "hi", "sort_order": 13,
             "prompt": "Bhagavad Gita ka ek shlok jo aaj bhi modern life ki har problem ka jawab deta hai"},
            {"id": "dev-subah", "title": "Subah 5 Minute", "category": "devotional", "language": "hi", "sort_order": 14,
             "prompt": "Subah uthke 5 minute yeh karo — din ka tone set ho jaayega, guarantee hai"},
            {"id": "dev-karma", "title": "Karma Asli Matlab", "category": "devotional", "language": "hi", "sort_order": 15,
             "prompt": "Karma kya hota hai? Asli matlab jo school mein koi nahi sikhata"},
            {"id": "dev-hanuman", "title": "Hanuman Chalisa Seekh", "category": "devotional", "language": "hi", "sort_order": 16,
             "prompt": "Hanuman Chalisa ke is chaupaai mein chupi hai life ki sabse badi seekh"},
            # news
            {"id": "news-gdp", "title": "India GDP 5 Saal", "category": "news", "language": "hi", "sort_order": 17,
             "prompt": "Aaj ki sabse badi khabar: India ki GDP kya kehti hai aane wale 5 saalon ke baare mein"},
            {"id": "news-startup", "title": "Startup Age Trend", "category": "news", "language": "hinglish", "sort_order": 18,
             "prompt": "Breaking: Startup ecosystem mein aaya naya trend — founders ki umra ghaat rahi hai"},
            {"id": "news-ai", "title": "AI Ne Badla India", "category": "news", "language": "hinglish", "sort_order": 19,
             "prompt": "Tech news: AI ne India mein in 5 jobs ko badla — aage kya hoga"},
            {"id": "news-petrol", "title": "Aaj Ka Bhaav", "category": "news", "language": "hi", "sort_order": 20,
             "prompt": "Aaj ka bhaav: petrol, gold, rupee — aur aam aadmi ki jeb pe kya fark pada"},
        ]

        for v in videos:
            db.add(InspirationVideo(**v))
        await db.commit()


app = FastAPI(
    title="ReelCraft API",
    description="AI-powered short video creation platform",
    version="1.0.0",
    lifespan=lifespan,
)

from fastapi.staticfiles import StaticFiles
import os

# Create static fallback directory for development uploads
os.makedirs("app/static", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(user.router, prefix=API_PREFIX)
app.include_router(projects.router, prefix=API_PREFIX)
app.include_router(generate.router, prefix=API_PREFIX)
app.include_router(social.router, prefix=API_PREFIX)
app.include_router(payments.router, prefix=API_PREFIX)
app.include_router(templates.router, prefix=API_PREFIX)
app.include_router(inspire.router, prefix=API_PREFIX)
app.include_router(marketplace.router, prefix=API_PREFIX)
app.include_router(websocket.router, prefix=API_PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "reelcraft-api"}
