from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.api import auth, user, projects, generate, websocket, social, payments, templates, inspire, marketplace, series


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await seed_templates()
    await seed_inspiration_videos()
    from app.services.ai.music_service import warm_music_cache
    await warm_music_cache()
    from app.services.scheduler import scheduler, check_series_schedules
    scheduler.add_job(check_series_schedules, "interval", minutes=1, id="series_scheduler", replace_existing=True)
    scheduler.start()
    yield
    # Shutdown
    scheduler.shutdown(wait=False)


async def seed_templates():
    """Upsert canonical templates on every startup so content stays current."""
    from app.database import AsyncSessionLocal
    from app.models.publish_job import Template
    from sqlalchemy.dialects.postgresql import insert as pg_insert

    templates_data = [
        # ── Funny ────────────────────────────────────────────────────────────
        {
            "id": "funny-hindi-1", "name": "Hindi Comedy Reel", "category": "funny",
            "language": "hi", "sort_order": 1, "template_type": "regular",
            "description": "Situational comedy from everyday Indian life — office, family, jugaad",
            "prompt_examples": [
                "Office mein ek aisi situation jo sabko relatable lage — boss ki meeting ke beech mein neend aana, aur phir pakde jaana",
                "Desi jugaad ka ek funny reel — jab koi Indian problem ko ek tooti hui chiz aur duct tape se solve karta hai",
                "Bhai aur behan ki ladai ghar mein — remote control ke liye, ya last waali roti ke liye — jo dekhte hi hassi aaye",
            ],
            "style_config": {"gradient": "linear-gradient(135deg,#FF6B35,#FF8E53)", "music_genre": "upbeat", "font_style": "bold"},
        },
        {
            "id": "funny-hindi-2", "name": "Desi Meme Reel", "category": "funny",
            "language": "hi", "sort_order": 2, "template_type": "regular",
            "description": "Indian meme formats — exams, weddings, relatives, student life struggles",
            "prompt_examples": [
                "Indian wedding mein woh awkward moments jo hamesha hote hain — relatives ke silly sawal, baraat mein traffic, aur buffet mein bheed",
                "Exam ke din ki kahani — subah uthke last-minute padhna, question paper dekhke bhool jaana, aur baad mein dosto se answers compare karna",
                "Mom aur dad ki alag-alag advice ka funny reel — ek kehta hai doctor bano, doosra engineer, aur tum kuch aur hi banana chahte ho",
            ],
            "style_config": {"gradient": "linear-gradient(135deg,#F97316,#FCD34D)", "music_genre": "fun", "font_style": "comic"},
        },
        {
            "id": "funny-en-1", "name": "English Comedy Reel", "category": "funny",
            "language": "en", "sort_order": 3, "template_type": "regular",
            "description": "Relatable English-language humor for urban Indian creators",
            "prompt_examples": [
                "The brutal honesty of autocorrect in the most important work messages — a relatable comedy reel every professional will share",
                "A day in the life of someone who said 'five more minutes' at 6 AM and woke up at noon — the full emotional journey",
                "Every Indian family's reaction when you say you don't want to become a doctor or engineer — a painfully funny reel",
            ],
            "style_config": {"gradient": "linear-gradient(135deg,#FCA5A5,#F43F5E)", "music_genre": "upbeat", "font_style": "bold"},
        },
        # ── Devotional ───────────────────────────────────────────────────────
        {
            "id": "devotional-1", "name": "Morning Shloka", "category": "devotional",
            "language": "hi", "sort_order": 4, "template_type": "regular",
            "description": "Sanskrit shlokas, prayers, and morning rituals with peaceful visuals",
            "prompt_examples": [
                "Ganesh vandana ka ek sundar reel — shloka ke saath peaceful visuals, din ki shuruaat positivity aur bhakti ke saath karein",
                "Hanuman Chalisa ki kuch chaupaiyaan aur unka arth — bhakton ke liye ek short reel jo mandir jaane se pehle ya subah dekhein",
                "Subah ki prarthana ka reel — Om chanting, sunrise visuals, aur ek chhota sankalp jo din ko achha banaye",
            ],
            "style_config": {"gradient": "linear-gradient(135deg,#F59E0B,#FCD34D)", "music_genre": "devotional", "font_style": "elegant"},
        },
        {
            "id": "devotional-2", "name": "Spiritual Thought", "category": "devotional",
            "language": "hi", "sort_order": 5, "template_type": "regular",
            "description": "Deep philosophical insights from Gita, Buddha, Kabir, and modern gurus",
            "prompt_examples": [
                "Bhagavad Gita ke ek shloka ka saar — jaise 'Karma karo, phal ki chinta mat karo' — aur aaj ki zindagi mein iska matlab",
                "Buddha ke ek vichar par reel — jaise dukh ka karan attachment hai — simple visuals aur deep message ke saath",
                "Ek aisi spiritual soch jo zindagi badal de — Osho, Rumi, ya Kabir ke dohe ko modern nazar se samjhao",
            ],
            "style_config": {"gradient": "linear-gradient(135deg,#92400E,#B45309)", "music_genre": "peaceful", "font_style": "serif"},
        },
        # ── Motivation ───────────────────────────────────────────────────────
        {
            "id": "motivation-1", "name": "Hindi Motivation", "category": "motivation",
            "language": "hi", "sort_order": 6, "template_type": "regular",
            "description": "Hard-hitting motivational content for Hindi-speaking youth and hustlers",
            "prompt_examples": [
                "Safalta ka asli raaz kya hai — mehnat, consistency, ya sahi waqt par sahi decision? Ek powerful motivational reel jo log save karein",
                "Haar ke baad wapsi ka reel — kisi real Indian success story se inspired, jo bataye ki failure temporary hoti hai, giving up permanent",
                "Apne sapne poore karne ki journey par reel — dar lagta hai, log hanste hain, phir bhi aage badhna kyun zaroori hai",
            ],
            "style_config": {"gradient": "linear-gradient(135deg,#1A1A2E,#E94560)", "music_genre": "cinematic", "font_style": "bold"},
        },
        {
            "id": "motivation-2", "name": "English Motivation", "category": "motivation",
            "language": "en", "sort_order": 7, "template_type": "regular",
            "description": "Mindset and success content in English — habits, discipline, growth",
            "prompt_examples": [
                "The one morning habit that separates high achievers from everyone else — not motivation, not talent, but one simple discipline done daily",
                "Why your mindset matters more than your skills — a powerful reel on how shifting your perspective can change your entire trajectory",
                "Success isn't loud — a reel about the quiet work that happens before results show: the early mornings, the rejections, the grind nobody sees",
            ],
            "style_config": {"gradient": "linear-gradient(135deg,#0F3460,#533483)", "music_genre": "inspirational", "font_style": "modern"},
        },
        # ── Storytelling ─────────────────────────────────────────────────────
        {
            "id": "storytelling-1", "name": "Hindi Story Reel", "category": "storytelling",
            "language": "hi", "sort_order": 8, "template_type": "regular",
            "description": "Dramatic short stories with a twist — folklore, myths, life lessons",
            "prompt_examples": [
                "Ek raja ki kahani jo bahut proud tha — phir ek din ek garib bachche ne use aisi baat seekhayi jo puri duniya nahi sikha payi",
                "Akbar-Birbal ki ek aisi kahani jo aaj bhi relevant hai — ek peheli, ek muskil sawaal, aur Birbal ka zabardast jawab",
                "Ek insaan ki zindagi badal gayi jab unhone ek anjaane insaan ki madad ki — ek emotional short story jo dil chu jaaye",
            ],
            "style_config": {"gradient": "linear-gradient(135deg,#6D28D9,#8B5CF6)", "music_genre": "cinematic", "font_style": "elegant"},
        },
        {
            "id": "storytelling-2", "name": "Hinglish Story", "category": "storytelling",
            "language": "hinglish", "sort_order": 9, "template_type": "regular",
            "description": "Urban coming-of-age stories and personal journeys for young India",
            "prompt_examples": [
                "Woh din yaad hai jab maine pehli baar apna dream job reject kar diya — sirf kyunki mujhe darr tha — aur phir kya hua",
                "Teen dost, ek chai ki tapri, aur ek decision jo hamare alag-alag raste le gaya — 10 saal baad bhi hum woh waqt nahin bhuule",
                "Ek Metro ride mein ek stranger ne mujhe aisi baat boli jo meri poori soch badal gayi — a real story",
            ],
            "style_config": {"gradient": "linear-gradient(135deg,#4C1D95,#7C3AED)", "music_genre": "emotional", "font_style": "modern"},
        },
        # ── Business ─────────────────────────────────────────────────────────
        {
            "id": "business-1", "name": "Business Tips Hindi", "category": "business",
            "language": "hi", "sort_order": 10, "template_type": "regular",
            "description": "Growth, marketing, and money tips for Indian entrepreneurs and freelancers",
            "prompt_examples": [
                "Chhote business ke liye 3 low-cost marketing tricks jo instantly customers badhayein — social media, word of mouth, aur referral strategy",
                "Startup shuru karne se pehle yeh 5 galtiyan mat karna — real examples ke saath, jo Indian founders aksar karte hain",
                "Customer ko baar baar wapas laane ka secret — loyalty kaise build karein, trust kaise jeeten, aur retention kaise improve karein",
            ],
            "style_config": {"gradient": "linear-gradient(135deg,#1E3A5F,#2C5F8A)", "music_genre": "corporate", "font_style": "clean"},
        },
        {
            "id": "business-2", "name": "Product Showcase", "category": "business",
            "language": "hinglish", "sort_order": 11, "template_type": "regular",
            "description": "Launch announcements, brand stories, and sale reels in Hinglish",
            "prompt_examples": [
                "Naya product launch ka exciting reel — features highlight karein, problem solve karte dikhao, aur ek strong call-to-action ke saath khatam karein",
                "Brand ki kahani 60 seconds mein — kyun shuru kiya, kya problem solve karta hai, aur kyun customers ko choose karna chahiye",
                "Mega sale announcement reel — urgency create karo, best deals highlight karo, aur viewers ko abhi action lene ke liye motivate karo",
            ],
            "style_config": {"gradient": "linear-gradient(135deg,#7C0000,#DC2626)", "music_genre": "upbeat", "font_style": "bold"},
        },
        # ── News ─────────────────────────────────────────────────────────────
        {
            "id": "news-1", "name": "News Explainer", "category": "news",
            "language": "hi", "sort_order": 12, "template_type": "regular",
            "description": "Explain any news story in simple Hindi — politics, economy, society",
            "prompt_examples": [
                "India ki economy ke baare mein ek badi khabar explain karo — simple Hindi mein, bina jargon ke, taki aam aadmi samjhe",
                "Koi bhi political decision jo recently hua — uska common man ki zindagi par kya asar padega, short reel mein explain karo",
                "Desh mein koi bhi bada badlav jo ho raha hai — uske 3 main reasons aur aage kya hoga — 60 seconds mein explain karo",
            ],
            "style_config": {"gradient": "linear-gradient(135deg,#1A365D,#2B6CB0)", "music_genre": "news", "font_style": "news"},
        },
        {
            "id": "news-2", "name": "Tech Explainer", "category": "news",
            "language": "hinglish", "sort_order": 13, "template_type": "regular",
            "description": "Break down tech, AI, and startup stories for mainstream Indian audience",
            "prompt_examples": [
                "AI ki ek naye development ko explain karo jo actually matter karti hai — hype nahi, real use cases — aur India ke future pe kya impact hai",
                "Kisi bhi Indian startup ki success story — kaunsi problem solve ki, kaise bada hua, aur investors ne kyun invest kiya",
                "Smartphone ya gadget comparison reel — features, price, aur India mein kaunsa actually better value deta hai — honest take",
            ],
            "style_config": {"gradient": "linear-gradient(135deg,#5B21B6,#7C3AED)", "music_genre": "electronic", "font_style": "modern"},
        },
        # ── Character templates ───────────────────────────────────────────────
        {
            "id": "char-raju-bhaiya", "name": "Raju Bhaiya", "category": "funny",
            "language": "hi", "sort_order": 20, "template_type": "character",
            "description": "Desi uncle comedy in pure Hindi — UP/Bihar flavor, 100% relatable",
            "prompt_examples": ["Aaj market mein bhaav itne badh gaye ki pocket rone lagi — full comedy"],
            "style_config": {
                "character_id": "raju_bhaiya", "emoji": "🤣",
                "tags": ["comedy", "desi", "hindi"],
                "gradient": "linear-gradient(135deg,#7B2CBF,#C77DFF)",
            },
        },
        {
            "id": "char-priya-di", "name": "Priya Didi", "category": "motivation",
            "language": "hinglish", "sort_order": 21, "template_type": "character",
            "description": "Big sister energy — real talk, no sugarcoating, for youth who mean it",
            "prompt_examples": ["Bhai, 5 AM uthna mushkil hai but success aur bhi mushkil hai — real talk"],
            "style_config": {
                "character_id": "priya_di", "emoji": "💪",
                "tags": ["motivation", "youth", "girlboss"],
                "gradient": "linear-gradient(135deg,#B45309,#F59E0B)",
            },
        },
        {
            "id": "char-professor-sharma", "name": "Prof. Sharma", "category": "business",
            "language": "hi", "sort_order": 22, "template_type": "character",
            "description": "Patient teacher who explains complex concepts in the simplest way",
            "prompt_examples": ["Aaj hum samjhenge ki compound interest kaise kaam karta hai — simple aur clear"],
            "style_config": {
                "character_id": "professor_sharma", "emoji": "🎓",
                "tags": ["education", "tips", "explains"],
                "gradient": "linear-gradient(135deg,#1E40AF,#3B82F6)",
            },
        },
        {
            "id": "char-rohit-anchor", "name": "Rohit Anchor", "category": "news",
            "language": "hi", "sort_order": 23, "template_type": "character",
            "description": "Breaking news anchor — dramatic, punchy, zero filler",
            "prompt_examples": ["Badi khabar! Aaj ki taaza khabar yeh hai ki — breaking news format"],
            "style_config": {
                "character_id": "rohit_anchor", "emoji": "📺",
                "tags": ["news", "breaking", "anchor"],
                "gradient": "linear-gradient(135deg,#0F172A,#1E3A5F)",
            },
        },
        {
            "id": "char-dev-startup", "name": "Dev Bhai", "category": "business",
            "language": "hinglish", "sort_order": 24, "template_type": "character",
            "description": "Startup founder sharing raw hustle tips from the trenches",
            "prompt_examples": ["Yaar, ek crore ka idea hai mere paas — sun meri baat, seriously"],
            "style_config": {
                "character_id": "dev_startup", "emoji": "🚀",
                "tags": ["startup", "founder", "hustle"],
                "gradient": "linear-gradient(135deg,#064E3B,#10B981)",
            },
        },
        {
            "id": "char-pandit-gyani", "name": "Pandit Ji", "category": "devotional",
            "language": "hi", "sort_order": 25, "template_type": "character",
            "description": "Spiritual guru sharing timeless Vedic wisdom in everyday language",
            "prompt_examples": ["Ye jo dukh hai, ye sab maya hai — aaj ki baat sunte hain dhyan se"],
            "style_config": {
                "character_id": "pandit_gyani", "emoji": "🙏",
                "tags": ["spiritual", "vedic", "wisdom"],
                "gradient": "linear-gradient(135deg,#78350F,#D97706)",
            },
        },
    ]

    async with AsyncSessionLocal() as db:
        for t in templates_data:
            stmt = pg_insert(Template).values(**t)
            stmt = stmt.on_conflict_do_update(
                index_elements=["id"],
                set_={k: v for k, v in t.items() if k != "id"},
            )
            await db.execute(stmt)
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
app.include_router(series.router, prefix=API_PREFIX)
app.include_router(websocket.router, prefix=API_PREFIX)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "reelcraft-api"}
