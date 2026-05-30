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
        {"id":"funny-hindi-1","name":"Hindi Comedy Reel","category":"funny","language":"hi","sort_order":1,"template_type":"regular","description":"Situational comedy from everyday Indian life","prompt_examples":["Bhai, yeh sirf India mein hi ho sakta hai — office meeting ke beech mein neend aa gayi aur boss ne pakad liya, pure cinema tha","Jab Indian mom kehti hai bas 5 minute mein khaana ready hai aur 45 minute lagte hain — yeh sirf hum Indians samjhenge","Remote control ke liye bhai-behan ki ladai jo UN mein bhi nahi hoti itni intense, full comedy reel","Ek cheez jo hum Indians kabhi nahi chhod sakte — relatives ke beta shaadi kab kar rahe ho wala annual tradition"],"style_config":{"gradient":"linear-gradient(135deg,#FF6B35,#FF8E53)","music_genre":"upbeat","font_style":"bold"}},
        {"id":"funny-hindi-2","name":"Desi Meme Reel","category":"funny","language":"hi","sort_order":2,"template_type":"regular","description":"Indian meme formats — exams, weddings, relatives","prompt_examples":["Indian wedding mein relatives ke beta shaadi kab karoge — woh ek sawaal jo har single Indian ka annual exam hai","Exam ke 3 ghante pehle 6 ghante ka syllabus padhna — ek Indian student ki survival story jo 100% relatable hai","Jab mom aur dad dono alag advice dete hain aur tum beech mein khade ho jaise India-Pakistan match mein umpire"],"style_config":{"gradient":"linear-gradient(135deg,#F97316,#FCD34D)","music_genre":"fun","font_style":"comic"}},
        {"id":"funny-en-1","name":"English Comedy Reel","category":"funny","language":"en","sort_order":3,"template_type":"regular","description":"Relatable English-language humor for urban Indian creators","prompt_examples":["That moment when autocorrect changes something in an important email to your boss — the full emotional journey","The complete psychological breakdown of hitting snooze 7 times and still convincing yourself you are on time","Every Indian parent reaction when you say I want to be a YouTuber — a 5-stage grief reel they will all share"],"style_config":{"gradient":"linear-gradient(135deg,#FCA5A5,#F43F5E)","music_genre":"upbeat","font_style":"bold"}},
        {"id":"devotional-1","name":"Morning Shloka","category":"devotional","language":"hi","sort_order":4,"template_type":"regular","description":"Sanskrit shlokas, prayers, and morning rituals","prompt_examples":["Kya aap jaante hain Ganesh ji ke 108 naamon mein ek aisa naam hai jise subah bolne se din ki mushkilein halki ho jaati hain?","Hanuman Chalisa ki yeh ek chaupaai jiska seedha matlab hum sab galat samajh rahe the itne saalon se — aaj reveal karein","Subah uthke sirf 5 minute yeh Sanskrit shloka bolne se kya hota hai — Japan aur Korea ke athletes bhi yahi karte hain"],"style_config":{"gradient":"linear-gradient(135deg,#F59E0B,#FCD34D)","music_genre":"devotional","font_style":"elegant"}},
        {"id":"devotional-2","name":"Spiritual Thought","category":"devotional","language":"hi","sort_order":5,"template_type":"regular","description":"Deep philosophical insights from Gita, Buddha, Kabir","prompt_examples":["Bhagavad Gita mein ek aisi line hai jo aaj ke anxiety aur depression ka 5000 saal pehle ka jawab deti hai — sunoge toh hairan ho jaoge","Buddha ne marne se pehle ek aisi baat kahi jo unke shishyon ne tab tak chupaaye rakhi — aaj pehli baar suno","Kabir ke is dohe mein chupi hai life ki sabse badi galti jo hum roz karte hain — sirf 2 lines mein poori philosophy"],"style_config":{"gradient":"linear-gradient(135deg,#92400E,#B45309)","music_genre":"peaceful","font_style":"serif"}},
        {"id":"motivation-1","name":"Hindi Motivation","category":"motivation","language":"hi","sort_order":6,"template_type":"regular","description":"Hard-hitting motivational content for Hindi-speaking youth","prompt_examples":["90% log fail isliye hote hain kyunki woh yeh ek cheez karte hain — aur success wale isko jaante hain aur avoid karte hain","Ek Indian IAS officer ne pehle 4 attempts fail kiye — woh cheez jo 5th attempt mein ki, aaj tum seekhoge in 60 seconds","Agar aaj se sirf yeh ek chhoti si cheez band kar do — 90 din mein apne aap ko pehchan nahi paoge, guarantee hai"],"style_config":{"gradient":"linear-gradient(135deg,#1A1A2E,#E94560)","music_genre":"cinematic","font_style":"bold"}},
        {"id":"motivation-2","name":"English Motivation","category":"motivation","language":"en","sort_order":7,"template_type":"regular","description":"Mindset and success content in English","prompt_examples":["The one thing every successful person does before 7 AM that almost nobody else does — and it is not waking up early","Your skills matter far less than this one thing — and most people figure this out way too late in life","The real reason most people never achieve their goals is not lack of talent money or time — it is something you can fix today"],"style_config":{"gradient":"linear-gradient(135deg,#0F3460,#533483)","music_genre":"inspirational","font_style":"modern"}},
        {"id":"storytelling-1","name":"Hindi Story Reel","category":"storytelling","language":"hi","sort_order":8,"template_type":"regular","description":"Dramatic short stories with a twist — folklore, myths","prompt_examples":["Ek raja tha jo sochta tha woh sab kuch jaanta hai — phir ek 8 saal ke bachche ne use aisi cheez sikhaayi jo puri saltanat nahi sikha payi","Akbar ne Birbal se ek sawaal poochha jiska jawab duniya ka koi hakim nahi de paaya — Birbal ka jawab sunkar darbar chup ho gaya","Ek stranger ne metro mein mujhe sirf 2 minute mein woh bata diya jo 25 saalon mein koi nahi bata paaya"],"style_config":{"gradient":"linear-gradient(135deg,#6D28D9,#8B5CF6)","music_genre":"cinematic","font_style":"elegant"}},
        {"id":"storytelling-2","name":"Hinglish Story","category":"storytelling","language":"hinglish","sort_order":9,"template_type":"regular","description":"Urban coming-of-age stories for young India","prompt_examples":["Woh din jab maine apna dream job offer turn down kiya — aur 6 mahine baad samjha ki woh actually sabse acha decision tha","Teen doston ne ek chai ki tapri pe ek decision kiya — 10 saal baad unki zindagi itni alag thi ki yaqeen nahi hoga","Ek 2-minute phone call ne meri poori zindagi ka direction badal diya — yeh story har 20-something ko sunni chahiye"],"style_config":{"gradient":"linear-gradient(135deg,#4C1D95,#7C3AED)","music_genre":"emotional","font_style":"modern"}},
        {"id":"business-1","name":"Business Tips Hindi","category":"business","language":"hi","sort_order":10,"template_type":"regular","description":"Growth, marketing, and money tips for Indian entrepreneurs","prompt_examples":["Woh 3 mistakes jo har Indian small business owner karta hai — aur inme se ek ne mujhe personally 2 lakh ka nuksan diya","Zero budget mein business grow karna hai? Yeh ek Indian founder ne kiya jab uske paas kuch bhi nahi tha","Customer baar baar wapas aaye — iska formula ek Udupi restaurant owner ne 40 saalon mein perfect kiya hai"],"style_config":{"gradient":"linear-gradient(135deg,#1E3A5F,#2C5F8A)","music_genre":"corporate","font_style":"clean"}},
        {"id":"business-2","name":"Product Showcase","category":"business","language":"hinglish","sort_order":11,"template_type":"regular","description":"Launch announcements, brand stories, and sale reels","prompt_examples":["Apna product 10 seconds mein kaise explain karein ki koi bhi immediately purchase kare — yeh framework use karo","Rs 99 mein launch kiya Rs 99 lakh mein scale kiya — ek Indian brand ki 60-second origin story","Mega sale se pehle yeh ek cheez na karo — warna conversion rate 80% down ho jaata hai"],"style_config":{"gradient":"linear-gradient(135deg,#7C0000,#DC2626)","music_genre":"upbeat","font_style":"bold"}},
        {"id":"news-1","name":"News Explainer","category":"news","language":"hi","sort_order":12,"template_type":"regular","description":"Explain any news story in simple Hindi","prompt_examples":["Yeh khabar aaj ki sabse badi hai — aur mainstream media isko theek se explain nahi kar raha, hum karte hain simple Hindi mein","Ek political decision jo recently hua — uska common man ki zindagi par kya asar padega, 60 seconds mein seedha jawab","Desh mein jo bada badlav ho raha hai — uske 3 main reasons aur aage kya hoga — bina jargon ke aam aadmi ke liye"],"style_config":{"gradient":"linear-gradient(135deg,#1A365D,#2B6CB0)","music_genre":"news","font_style":"news"}},
        {"id":"news-2","name":"Tech Explainer","category":"news","language":"hinglish","sort_order":13,"template_type":"regular","description":"Break down tech, AI, and startup stories","prompt_examples":["AI ki ek naye development jo actually matter karti hai — hype nahi real use cases — aur India ke future pe kya impact hai","Ek Indian startup ki success story jo kisi ne predict nahi ki thi — kaunsi problem solve ki kaise zero se crores tak","Smartphone comparison reel — features price aur India mein kaunsa actually better value deta hai — honest take no sponsorship"],"style_config":{"gradient":"linear-gradient(135deg,#5B21B6,#7C3AED)","music_genre":"electronic","font_style":"modern"}},
        {"id":"mystery-1","name":"India Rahasya","category":"mystery","language":"hi","sort_order":14,"template_type":"regular","description":"Unsolved mysteries, hidden truths, and eerie facts about India","prompt_examples":["Kya aap jaante hain India mein ek aisi jagah hai jahan compass kaam karna band kar deta hai — science abhi bhi explain nahi kar pa rahi","Woh Indian temple jo 1200 saal pehle bana tha — aur uski engineering aaj ke engineers bhi copy nahi kar sakte kyun?","India ke ek gaon mein ek aisi parampara hai jo 500 saalon se chal rahi hai — aur koi nahi jaanta yeh shuru kab aur kyun hua"],"style_config":{"gradient":"linear-gradient(135deg,#1C1917,#44403C)","music_genre":"mysterious","font_style":"dramatic"}},
        {"id":"mystery-2","name":"Ancient Secrets","category":"mystery","language":"hinglish","sort_order":15,"template_type":"regular","description":"Ancient civilizations, conspiracy angles, and unexplained phenomena","prompt_examples":["Woh historical event jo textbooks mein hai — par uske peeche ki asli kahani government ne kabhi public nahi ki aaj reveal karte hain","Ek aisi ancient Indian technology ka proof mile jise mainstream history accept nahi karti — yeh evidence dekhke hairan ho jaoge","Is jagah ke baare mein yeh fact sunke aapki roh kaanp jaayegi — aur yeh sirf legend nahi documented fact hai"],"style_config":{"gradient":"linear-gradient(135deg,#111827,#374151)","music_genre":"cinematic","font_style":"dramatic"}},
        {"id":"facts-1","name":"India Facts","category":"facts","language":"hi","sort_order":16,"template_type":"regular","description":"Surprising lesser-known facts about India","prompt_examples":["Kya aap jaante hain ki India ne yeh duniya ko diya — aur duniya ne credit kisi aur ko de diya? 99% Indians nahi jaante","India ke baare mein woh 5 facts jo school mein nahi padhaaye gaye — aur padhaaye jaane chahiye the","Yeh ek fact sunke aaj se India ko alag nazar se dekhoge — seriously yeh duniya ke kisi aur desh mein nahi hai"],"style_config":{"gradient":"linear-gradient(135deg,#164E63,#0891B2)","music_genre":"upbeat","font_style":"bold"}},
        {"id":"facts-2","name":"Did You Know","category":"facts","language":"hinglish","sort_order":17,"template_type":"regular","description":"Mind-blowing facts on science, history, psychology","prompt_examples":["Did you know yeh psychological fact roz aapke decisions affect karta hai — aur aap iske baare mein bilkul unaware hain?","Woh science fact jo dimaag hila dega — aur iske baad aap X ko kabhi same way mein nahi dekhoge","Human brain ke baare mein yeh fact 99% log nahi jaante — jaanne ke baad aap apni productivity 2x kar sakte hain"],"style_config":{"gradient":"linear-gradient(135deg,#0C4A6E,#0284C7)","music_genre":"electronic","font_style":"modern"}},
        {"id":"char-raju-bhaiya","name":"Raju Bhaiya","category":"funny","language":"hi","sort_order":20,"template_type":"character","description":"Desi uncle comedy in pure Hindi — UP/Bihar flavor, 100% relatable","prompt_examples":["Aaj market mein bhaav itne badh gaye ki pocket rone lagi — full comedy Raju Bhaiya style"],"style_config":{"character_id":"raju_bhaiya","emoji":"🤣","tags":["comedy","desi","hindi"],"gradient":"linear-gradient(135deg,#7B2CBF,#C77DFF)"}},
        {"id":"char-priya-di","name":"Priya Didi","category":"motivation","language":"hinglish","sort_order":21,"template_type":"character","description":"Big sister energy — real talk, no sugarcoating","prompt_examples":["Bhai, 5 AM uthna mushkil hai but success aur bhi mushkil hai — real talk jo log sunna nahi chahte"],"style_config":{"character_id":"priya_di","emoji":"💪","tags":["motivation","youth","girlboss"],"gradient":"linear-gradient(135deg,#B45309,#F59E0B)"}},
        {"id":"char-professor-sharma","name":"Prof. Sharma","category":"business","language":"hi","sort_order":22,"template_type":"character","description":"Patient teacher who explains complex concepts simply","prompt_examples":["Aaj hum samjhenge ki compound interest kaise kaam karta hai — simple aur clear Professor Sharma style"],"style_config":{"character_id":"professor_sharma","emoji":"🎓","tags":["education","tips","explains"],"gradient":"linear-gradient(135deg,#1E40AF,#3B82F6)"}},
        {"id":"char-rohit-anchor","name":"Rohit Anchor","category":"news","language":"hi","sort_order":23,"template_type":"character","description":"Breaking news anchor — dramatic, punchy, zero filler","prompt_examples":["Badi khabar! Aaj ki taaza khabar yeh hai ki — breaking news dramatic anchor format"],"style_config":{"character_id":"rohit_anchor","emoji":"📺","tags":["news","breaking","anchor"],"gradient":"linear-gradient(135deg,#0F172A,#1E3A5F)"}},
        {"id":"char-dev-startup","name":"Dev Bhai","category":"business","language":"hinglish","sort_order":24,"template_type":"character","description":"Startup founder sharing raw hustle tips from the trenches","prompt_examples":["Yaar ek crore ka idea hai mere paas — sun meri baat seriously Dev Bhai style raw founder talk"],"style_config":{"character_id":"dev_startup","emoji":"🚀","tags":["startup","founder","hustle"],"gradient":"linear-gradient(135deg,#064E3B,#10B981)"}},
        {"id":"char-pandit-gyani","name":"Pandit Ji","category":"devotional","language":"hi","sort_order":25,"template_type":"character","description":"Spiritual guru sharing timeless Vedic wisdom","prompt_examples":["Ye jo dukh hai ye sab maya hai — aaj ki baat sunte hain dhyan se Pandit Ji style"],"style_config":{"character_id":"pandit_gyani","emoji":"🙏","tags":["spiritual","vedic","wisdom"],"gradient":"linear-gradient(135deg,#78350F,#D97706)"}},
        {"id":"blueprint-rahasya","name":"🔮 Rahasya Channel","category":"mystery","language":"hi","sort_order":30,"template_type":"series_preset","description":"Launch a Mystery and Secrets channel — India hidden truths, ancient mysteries. Highest-performing faceless niche.","prompt_examples":["Kya aap jaante hain ki India mein ek aisi jagah hai jo saalon se ek rahasya ban ke rahi hai — science abhi bhi explain nahi kar pa rahi","Woh ancient Indian technology ka proof jo mainstream history accept nahi karti — yeh evidence dekhke hairan ho jaoge"],"style_config":{"channel_type":"rahasya","content_pillars":["temple secrets","ancient India mysteries","unexplained events","historical hidden truths","conspiracy angles","supernatural India"],"posting_schedule":"daily","recommended_series_topic":"India ke ansuljhe rahasya — woh sach jo history books mein nahi hai","visual_style":"dark cinematic temple corridors ancient manuscripts dramatic shadows","opening_signature":"Ek aisi kahani jo aaj tak sunayi nahi gayi...","gradient":"linear-gradient(135deg,#1C1917,#7C3AED)"}},
        {"id":"blueprint-sach-batao","name":"🧠 Sach Batao Channel","category":"facts","language":"hinglish","sort_order":31,"template_type":"series_preset","description":"Launch a Did-You-Know Facts channel — the number 1 shareable content format globally.","prompt_examples":["Kya aap jaante hain ki yeh psychological trick roz aapke decisions affect karti hai aur aap bilkul unaware hain","India ke baare mein woh 5 facts jo school mein nahi padhaaye gaye — aur padhaaye jaane chahiye the"],"style_config":{"channel_type":"sach_batao","content_pillars":["psychology facts","India history facts","science facts","human body facts","money facts","space facts"],"posting_schedule":"daily","recommended_series_topic":"Woh facts jo aapke dimaag ko hila denge — India science psychology aur zyada","visual_style":"bright infographic maps close-ups dramatic reenactments","opening_signature":"Kya aap jaante hain ki...","gradient":"linear-gradient(135deg,#0C4A6E,#7C3AED)"}},
        {"id":"blueprint-motivation-hindi","name":"🔥 Gyaan Channel","category":"motivation","language":"hi","sort_order":32,"template_type":"series_preset","description":"Launch a Daily Hindi Motivation channel for India 500M Hindi audience.","prompt_examples":["90% log yeh ek galti karte hain aur isliye fail hote hain — aaj jaano kya hai woh","Ek chhoti si habit jo roz karo — 1 saal baad tum khud apne aap ko pehchan nahi paoge"],"style_config":{"channel_type":"motivation_hindi","content_pillars":["success habits","failure lessons","discipline mindset","Indian success stories","self-improvement tips","morning routine"],"posting_schedule":"daily","recommended_series_topic":"Roz ki ek motivation — woh gyaan jo zindagi badal de","visual_style":"high-contrast dramatic mountains athletes sunrise bold typography","opening_signature":"Aaj ki baat dhyan se sunna...","gradient":"linear-gradient(135deg,#7F1D1D,#DC2626)"}},
        {"id":"blueprint-bharat-kahani","name":"🏛️ Bharat Ki Kahaniyaan","category":"storytelling","language":"hi","sort_order":33,"template_type":"series_preset","description":"Launch an Indian History Stories channel — mythology folklore forgotten heroes.","prompt_examples":["Ek raja ki kahani jo 500 saal pehle hua — aur aaj bhi usse hum bhool nahi sake","Woh Indian hero jisko history books ne bhula diya — aaj unki asli kahani sunte hain"],"style_config":{"channel_type":"bharat_kahani","content_pillars":["forgotten Indian heroes","Mughal era stories","mythology deep dives","freedom struggle untold stories","regional kingdom tales","ancient India facts"],"posting_schedule":"every_3_days","recommended_series_topic":"Bharat ki woh kahaniyaan jo school mein nahi padhayi gayi","visual_style":"dark cinematic Mughal architecture ancient battles dramatic lighting","opening_signature":"Yeh kahani saalon pehle ki hai par aaj bhi relevant hai...","gradient":"linear-gradient(135deg,#78350F,#B45309)"}},
        {"id":"blueprint-startup-secrets","name":"🚀 Startup Secrets","category":"business","language":"hinglish","sort_order":34,"template_type":"series_preset","description":"Launch an Indian Startup and Money channel — Hinglish business content for aspiring founders.","prompt_examples":["Woh ek business mistake jo India ke best founders ne ki — aur tum isko avoid kar sakte ho abhi","Zero se ek startup kaise banaya — bina funding bina connections sirf ek idea aur dedication"],"style_config":{"channel_type":"startup_secrets","content_pillars":["startup founder stories","money and investing","business models","marketing hacks","Indian unicorn journeys","freelancing tips"],"posting_schedule":"every_3_days","recommended_series_topic":"Indian startup aur money secrets — woh gyaan jo MBA mein nahi milta","visual_style":"clean modern laptops offices graphs young entrepreneurs","opening_signature":"Yaar sunna zaroori hai yeh...","gradient":"linear-gradient(135deg,#064E3B,#0284C7)"}},
        {"id":"blueprint-ai-influencer","name":"✨ AI Influencer Channel","category":"storytelling","language":"hinglish","sort_order":35,"template_type":"ai_influencer","description":"Launch an ultra-consistent AI Influencer series with matching face across videos. Best for building a loyal following.","prompt_examples":["A day in the life of a digital creator navigating Mumbai's fast-paced tech scene.","My morning routine as an AI creator working from a cozy beach house in Goa."],"style_config":{"channel_type":"ai_influencer","content_pillars":["daily routines","relatable creator life","behind the scenes","productivity hacks","fashion and outfits","travel diaries"],"posting_schedule":"daily","recommended_series_topic":"Life of an AI Influencer — daily routines and digital creator struggles","visual_style":"bright aesthetic, influencer close-ups, modern outfits, high-end apartments","opening_signature":"Hey guys! Welcome back to my life...","gradient":"linear-gradient(135deg,#EC4899,#F43F5E)"}},
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
