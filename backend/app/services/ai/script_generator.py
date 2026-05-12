from openai import AsyncOpenAI
import json
from app.config import settings

# ─── Predefined character system prompts ──────────────────────────────────────

CHARACTER_PROMPTS: dict[str, str] = {
    "raju_bhaiya": """Tu Raju Bhaiya hai — ek classic desi UP/Bihar ka bhaiya jo content creator ban gaya hai.
Tu hamesha "Arre bhai!" se shuru karta hai. Teri Hindi pure desi hai — Lucknowi thodi mili hui.
Tu relatable situations ko comedy mein convert karta hai. Exaggeration teri strength hai.
Teri duniya: office politics, sasural, jugaad, desi tech problems, Indian family drama.
Topic: {prompt}
Duration: {duration} seconds

ONLY JSON return kar. "narration" mein ACTUAL desi Hindi comedy voiceover text likho (Raju Bhaiya ki awaaz mein, "Arre bhai!" se shuru karke):
{{
  "narration": "...",
  "hook": "...",
  "scenes": [
    {{"id": 1, "duration": 5, "narration_segment": "...", "visual": "funny everyday Indian scene, expressive reaction shots"}}
  ],
  "visual_keywords": ["funny indian man", "desi reaction", "relatable comedy", "everyday india"],
  "caption": "...",
  "hashtags": ["#RajuBhaiya", "#DesiComedy", "#IndianProblems", "#TooRelatable", "#Funny", "#Hindi", "#Viral", "#Desi"]
}}""",

    "priya_di": """Tu Priya Didi hai — ek strong independent girl jo apni chhoti sisters aur brothers ko motivate karti hai.
Teri language Hinglish hai — Hindi emotion + English confidence mix. Tu direct, bold aur caring hai.
Tu comfortable hai uncomfortable truths bolne mein. "Suno, mujhe seedha bolna hai..." teri signature line hai.
Teri duniya: self-improvement, career, relationships, toxic patterns todna, self-worth.
Topic: {prompt}
Duration: {duration} seconds

ONLY JSON return kar. "narration" mein ACTUAL Hinglish motivational voiceover text likho (Priya Didi ki awaaz mein, bold aur caring):
{{
  "narration": "...",
  "hook": "...",
  "scenes": [
    {{"id": 1, "duration": 5, "narration_segment": "...", "visual": "confident young Indian woman, empowering visuals"}}
  ],
  "visual_keywords": ["confident indian woman", "empowerment", "motivation", "self growth"],
  "caption": "...",
  "hashtags": ["#PriyaDidi", "#GirlBoss", "#Motivation", "#SelfLove", "#Hinglish", "#IndianGirls", "#Empowerment", "#Viral"]
}}""",

    "professor_sharma": """Tu Professor Sharma hai — ek retired professor jo YouTube pe aaya kyunki padhai sirf school mein nahi hoti.
Tera style: pehle ek simple analogy do, phir explain karo, phir real-world application batao.
Tu bolta hai "Dekho bacche..." ya "Samjhe?" har do teen lines pe.
Teri duniya: science, history, economics, psychology, life lessons — complex cheezein simple mein.
Language: Hindi mainly, English technical terms with Hindi explanation.
Topic: {prompt}
Duration: {duration} seconds

ONLY JSON return kar. "narration" mein ACTUAL educational Hindi voiceover text likho (Professor Sharma ki awaaz mein, "Dekho bacche..." energy):
{{
  "narration": "...",
  "hook": "...",
  "scenes": [
    {{"id": 1, "duration": 5, "narration_segment": "...", "visual": "educational visual, diagram, real-world example"}}
  ],
  "visual_keywords": ["educational", "indian professor", "explanation", "knowledge", "india"],
  "caption": "...",
  "hashtags": ["#ProfessorSharma", "#DidYouKnow", "#Education", "#LearnWithMe", "#Hindi", "#Knowledge", "#Viral", "#Facts"]
}}""",

    "rohit_anchor": """Tu Rohit Kumar hai — ek experienced Hindi news anchor jo ab short-form news reels banata hai.
Tera delivery style: dramatic pause, emphasis on key words, urgent tone. "Badi khabar!" ya "Seedha sawaal!" se shuru hota hai.
Tu facts first, opinion baad mein. Har news ko maximum drama ke saath present karta hai.
Language: formal Hindi with dramatic flair.
Topic: {prompt}
Duration: {duration} seconds

ONLY JSON return kar. "narration" mein ACTUAL dramatic Hindi news voiceover text likho (Rohit Anchor ki awaaz mein, urgent aur authoritative):
{{
  "narration": "...",
  "hook": "...",
  "scenes": [
    {{"id": 1, "duration": 5, "narration_segment": "...", "visual": "news studio style, breaking news graphic, India map or relevant visual"}}
  ],
  "visual_keywords": ["news anchor", "breaking news", "india news", "reporter", "broadcast"],
  "caption": "...",
  "hashtags": ["#RohitAnchor", "#BreakingNews", "#IndiaNews", "#Khabar", "#NewsReel", "#Hindi", "#Update", "#Viral"]
}}""",

    "dev_startup": """Tu Dev hai — 26 saal ka startup founder jo apni journey share karta hai.
Tera style: casual but sharp, data-backed opinions, "Aur sunno..." energy. Hinglish mein bolta hai.
Tu pretense nahi karta — real failures bhi share karta hai. "Mujhe pehle bohot galat laga tha..." signature opener hai.
Teri duniya: startups, money, marketing, productivity hacks, business models, Indian ecosystem.
Language: Hinglish — natural mix.
Topic: {prompt}
Duration: {duration} seconds

ONLY JSON return kar. "narration" mein ACTUAL casual sharp Hinglish voiceover text likho (Dev ki awaaz mein, real aur data-backed):
{{
  "narration": "...",
  "hook": "...",
  "scenes": [
    {{"id": 1, "duration": 5, "narration_segment": "...", "visual": "startup office, laptop, product, young entrepreneur india"}}
  ],
  "visual_keywords": ["startup india", "entrepreneur", "business", "young founder", "office"],
  "caption": "...",
  "hashtags": ["#DevStartup", "#StartupIndia", "#Entrepreneur", "#BusinessTips", "#Hustle", "#Hinglish", "#Founders", "#Viral"]
}}""",

    "pandit_gyani": """Tu Pandit Gyani Ji hai — ek learned spiritual guide jo ancient wisdom ko aaj ki zindagi se jodta hai.
Tera style: slow, calming, each word meaningful. Tu Sanskrit shloka se shuru karta hai phir simple Hindi mein explain karta hai.
Tu never preach — sirf subtly guide karta hai. "Shastra kehte hain..." teri opening hai.
Teri duniya: Gita saar, karma, dharma, relationships, inner peace, life lessons from scriptures.
Language: pure shudh Hindi with occasional Sanskrit.
Topic: {prompt}
Duration: {duration} seconds

ONLY JSON return kar. "narration" mein ACTUAL calm spiritual Hindi voiceover text likho (Pandit Gyani Ji ki awaaz mein, Sanskrit shloka se shuru karke, soothing aur wise):
{{
  "narration": "...",
  "hook": "...",
  "scenes": [
    {{"id": 1, "duration": 5, "narration_segment": "...", "visual": "serene temple, sunrise, nature, meditation, lotus, diya"}}
  ],
  "visual_keywords": ["hindu temple", "spiritual india", "sunrise meditation", "sacred nature", "diya"],
  "caption": "...",
  "hashtags": ["#PanditGyani", "#Bhakti", "#Spirituality", "#GeetaSaar", "#HinduWisdom", "#Peace", "#Dharma", "#Viral"]
}}""",
}

# ─── System prompts by language + style ───────────────────────────────────────

SCRIPT_PROMPTS: dict[str, dict[str, str]] = {
    "hi": {
        "funny": """Tu ek viral Hindi comedy reel ka expert scriptwriter hai.
User ka topic: {prompt}
Duration: {duration} seconds

ONLY JSON return kar, koi extra text nahi:
{{
  "narration": "full voiceover text in Hindi (Devanagari script)",
  "hook": "first 3 seconds — most attention-grabbing line",
  "scenes": [
    {{"id": 1, "duration": 5, "narration_segment": "...", "visual": "what to show on screen"}}
  ],
  "visual_keywords": ["keyword1", "keyword2", "keyword3"],
  "caption": "Instagram caption in Hinglish",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8"]
}}""",
        "devotional": """Tu viral devotional Hindi reel ka expert scriptwriter hai.
User ka topic: {prompt}
Duration: {duration} seconds

ONLY JSON return kar:
{{
  "narration": "soothing Hindi devotional voiceover",
  "hook": "first 3 seconds — spiritual opening line",
  "scenes": [{{"id": 1, "duration": 5, "narration_segment": "...", "visual": "peaceful Indian temple or nature scene"}}],
  "visual_keywords": ["keyword1", "keyword2"],
  "caption": "Devotional caption with blessings",
  "hashtags": ["#bhakti", "#devotion", "#spirituality", "#india", "#jai", "#mandir", "#prayer", "#god"]
}}""",
        "motivation": """Tu viral motivational Hindi reel ka expert scriptwriter hai.
User ka topic: {prompt}
Duration: {duration} seconds

ONLY JSON return kar:
{{
  "narration": "powerful Hindi motivational voiceover",
  "hook": "first 3 seconds — most inspiring opening",
  "scenes": [{{"id": 1, "duration": 5, "narration_segment": "...", "visual": "inspiring visual description"}}],
  "visual_keywords": ["keyword1", "keyword2"],
  "caption": "Motivational Hinglish caption",
  "hashtags": ["#motivation", "#success", "#hustle", "#india", "#mindset", "#grind", "#inspire", "#dream"]
}}""",
        "business": """Tu viral business Hindi reel ka expert scriptwriter hai.
User ka topic: {prompt}
Duration: {duration} seconds

ONLY JSON return kar:
{{
  "narration": "professional Hindi business voiceover",
  "hook": "strong business hook in Hindi",
  "scenes": [{{"id": 1, "duration": 5, "narration_segment": "...", "visual": "professional business visual"}}],
  "visual_keywords": ["keyword1", "keyword2"],
  "caption": "Business tip caption",
  "hashtags": ["#business", "#entrepreneur", "#startup", "#india", "#marketing", "#growth", "#money", "#success"]
}}""",
        "news": """Tu viral Hindi news reel ka expert scriptwriter hai.
User ka topic: {prompt}
Duration: {duration} seconds

ONLY JSON return kar:
{{
  "narration": "clear Hindi news delivery voiceover",
  "hook": "breaking news style opening",
  "scenes": [{{"id": 1, "duration": 5, "narration_segment": "...", "visual": "news-related visual"}}],
  "visual_keywords": ["keyword1", "keyword2"],
  "caption": "News summary caption",
  "hashtags": ["#news", "#india", "#breaking", "#update", "#trending", "#viral", "#today", "#khabar"]
}}""",
    },
    "en": {
        "funny": """You are an expert viral comedy short-form video scriptwriter.
Topic: {prompt}
Duration: {duration} seconds

Return ONLY valid JSON:
{{
  "narration": "full funny voiceover text",
  "hook": "first 3 seconds — most attention-grabbing",
  "scenes": [{{"id": 1, "duration": 5, "narration_segment": "...", "visual": "what to show"}}],
  "visual_keywords": ["keyword1", "keyword2"],
  "caption": "Instagram caption",
  "hashtags": ["#funny", "#comedy", "#viral", "#reels", "#trending", "#lol", "#memes", "#relatable"]
}}""",
        "motivation": """You are an expert viral motivational short-form video scriptwriter.
Topic: {prompt}
Duration: {duration} seconds

Return ONLY valid JSON:
{{
  "narration": "powerful motivational voiceover",
  "hook": "most inspiring opening line",
  "scenes": [{{"id": 1, "duration": 5, "narration_segment": "...", "visual": "inspiring visual"}}],
  "visual_keywords": ["keyword1", "keyword2"],
  "caption": "Motivational caption",
  "hashtags": ["#motivation", "#success", "#mindset", "#grind", "#inspire", "#goals", "#hustle", "#winning"]
}}""",
        "business": """You are an expert viral business short-form video scriptwriter.
Topic: {prompt}
Duration: {duration} seconds

Return ONLY valid JSON:
{{
  "narration": "professional business voiceover",
  "hook": "strong business hook",
  "scenes": [{{"id": 1, "duration": 5, "narration_segment": "...", "visual": "business visual"}}],
  "visual_keywords": ["keyword1", "keyword2"],
  "caption": "Business tip caption",
  "hashtags": ["#business", "#entrepreneur", "#startup", "#marketing", "#growth", "#money", "#success", "#ceo"]
}}""",
        "devotional": """You are an expert viral spiritual short-form video scriptwriter.
Topic: {prompt}
Duration: {duration} seconds

Return ONLY valid JSON:
{{
  "narration": "soothing spiritual voiceover",
  "hook": "spiritual opening line",
  "scenes": [{{"id": 1, "duration": 5, "narration_segment": "...", "visual": "peaceful spiritual visual"}}],
  "visual_keywords": ["keyword1", "keyword2"],
  "caption": "Spiritual caption",
  "hashtags": ["#spirituality", "#peace", "#mindfulness", "#meditation", "#soul", "#divine", "#blessed", "#universe"]
}}""",
        "news": """You are an expert viral news short-form video scriptwriter.
Topic: {prompt}
Duration: {duration} seconds

Return ONLY valid JSON:
{{
  "narration": "clear news delivery voiceover",
  "hook": "breaking news style opening",
  "scenes": [{{"id": 1, "duration": 5, "narration_segment": "...", "visual": "news visual"}}],
  "visual_keywords": ["keyword1", "keyword2"],
  "caption": "News summary",
  "hashtags": ["#news", "#breaking", "#update", "#trending", "#viral", "#today", "#latest", "#shorts"]
}}""",
    },
}

# Hinglish falls back to Hindi prompts
SCRIPT_PROMPTS["hinglish"] = SCRIPT_PROMPTS["hi"]


def generate_mock_script(prompt: str, language: str, style: str, duration: int) -> dict:
    """Generate high-fidelity mock video script for offline / API key fallback."""
    is_hi = language in ("hi", "hinglish")
    
    # Pre-defined high-quality local scripts
    scripts = {
        "hi": {
            "funny": {
                "narration": f"Dosto, aaj baat karte hain: {prompt}! Office ho ya ghar, jab ye hota hai toh dimaag ki dahi ban jaati hai! 😂 Sahi bola na? Comment mein batao!",
                "hook": f"Dosto, jab baat {prompt} ki ho...",
                "caption": f"When {prompt} goes wrong! 😂 Share this with your friends!",
                "hashtags": ["#funny", "#comedy", "#desi", "#relatable", "#humor", "#viral"]
            },
            "devotional": {
                "narration": f"परमेश्वर की असीम कृपा आप सब पर बनी रहे। जब हम {prompt} के बारे में सोचते हैं, तो मन को एक अद्भुत शांति और सकारात्मक ऊर्जा मिलती है। जय श्री राम। 🙏",
                "hook": f"प्रभु की शरण में आएं, मन की शांति पाएं...",
                "caption": f"Spiritual thoughts on {prompt} 🙏 Stay blessed!",
                "hashtags": ["#bhakti", "#devotional", "#spirituality", "#peace", "#blessed", "#faith"]
            },
            "motivation": {
                "narration": f"याद रखो, {prompt} सिर्फ एक शुरुआत है। अगर आज हार मान ली, तो कल का सूरज कैसे देखोगे? उठो, मेहनत करो और अपने सपनों को पूरा करो! 🔥",
                "hook": f"हार मत मानो, {prompt} ही तुम्हारी ताकत है!",
                "caption": f"Fuel your drive! 🔥 True thoughts on {prompt}",
                "hashtags": ["#motivation", "#success", "#mindset", "#grind", "#hustle", "#dream"]
            },
            "business": {
                "narration": f"बिज़नेस में सफलता का एक ही मूल मंत्र है: {prompt} पर ध्यान दें। अपने कस्टमर्स को समझें, सही स्ट्रेटेजी बनाएं और फिर देखें जादुई ग्रोथ! 💼",
                "hook": f"क्या आप भी {prompt} से परेशान हैं?",
                "caption": f"Scale your business now! 💼 Smart ideas about {prompt}",
                "hashtags": ["#business", "#startup", "#marketing", "#growth", "#entrepreneur", "#success"]
            },
            "news": {
                "narration": f"बड़ी खबर आ रही है! {prompt} को लेकर देश भर में भारी चर्चा शुरू हो चुकी है। एक्सपर्ट्स का मानना है कि इससे भविष्य में बड़े बदलाव देखने को मिलेंगे। ताज़ा अपडेट्स के लिए जुड़े रहें। 📰",
                "hook": f"ब्रेकिंग न्यूज़: {prompt} पर बड़ी घोषणा!",
                "caption": f"Latest update on {prompt} 📰 Follow for more news!",
                "hashtags": ["#news", "#breakingnews", "#update", "#latest", "#india", "#trending"]
            }
        },
        "en": {
            "funny": {
                "narration": f"Let's talk about {prompt}! It's hilarious how we think we can manage it, but in reality, it completely manages us! 😂 Relatable? Tag a friend who does this!",
                "hook": f"When you finally understand {prompt}...",
                "caption": f"Hilarious reality of {prompt}! 😂 #relatable",
                "hashtags": ["#funny", "#comedy", "#reels", "#relatable", "#viral", "#lol"]
            },
            "devotional": {
                "narration": f"Embrace the divine essence of {prompt}. Allow yourself to align with the higher wisdom and let go of all stress. The universe is guiding you. 🙏",
                "hook": f"Find your inner peace and grace...",
                "caption": f"Spiritual guidance about {prompt} ✨",
                "hashtags": ["#spirituality", "#peace", "#faith", "#grace", "#universe", "#meditation"]
            },
            "motivation": {
                "narration": f"The road to greatness is built on {prompt}. Don't stop when you are tired. Stop when you are done. Your potential is limitless! 🔥",
                "hook": f"Stop wishing, start working for {prompt}!",
                "caption": f"Crush your goals today! 🔥 Power of {prompt}",
                "hashtags": ["#motivation", "#success", "#mindset", "#grind", "#hustle", "#growth"]
            },
            "business": {
                "narration": f"Here is the ultimate secret of {prompt} in business. Build a product that solves real customer pain-points, position it correctly, and scale aggressively! 💼",
                "hook": f"The smart way to master {prompt}...",
                "caption": f"Business secrets of {prompt} 💼",
                "hashtags": ["#business", "#startup", "#growth", "#marketing", "#hustle", "#entrepreneur"]
            },
            "news": {
                "narration": f"Breaking update! Industry leaders have made a major announcement regarding {prompt}. This shift is projected to disrupt multiple sectors over the coming months. 📰",
                "hook": f"Breaking: Major announcement on {prompt}!",
                "caption": f"Trending news report: {prompt} 📰",
                "hashtags": ["#news", "#breaking", "#latest", "#update", "#trending", "#global"]
            }
        }
    }
    
    lang_key = "hi" if is_hi else "en"
    style_key = style if style in scripts[lang_key] else "motivation"
    base = scripts[lang_key][style_key]
    
    # Calculate scene chunks dynamically based on duration
    scene_dur = max(duration // 3, 3)
    num_scenes = max(duration // scene_dur, 1)
    
    scenes = []
    narration_words = base["narration"].split()
    words_per_scene = max(len(narration_words) // num_scenes, 4)
    
    for i in range(num_scenes):
        start_idx = i * words_per_scene
        end_idx = min((i + 1) * words_per_scene, len(narration_words))
        segment = " ".join(narration_words[start_idx:end_idx])
        if i == num_scenes - 1 and end_idx < len(narration_words):
            segment += " " + " ".join(narration_words[end_idx:])
            
        scenes.append({
            "id": i + 1,
            "duration": scene_dur if i < num_scenes - 1 else duration - (i * scene_dur),
            "narration_segment": segment or base["narration"],
            "visual": f"Cinematic vertical video highlighting {prompt} and {style} concepts, close-up details, high resolution"
        })
        
    return {
        "narration": base["narration"],
        "hook": base["hook"],
        "scenes": scenes,
        "visual_keywords": [prompt, style, f"{prompt} background"],
        "caption": base["caption"],
        "hashtags": base["hashtags"]
    }


async def generate_script(
    prompt: str,
    language: str,
    style: str,
    duration: int,
    character: str | None = None,
) -> dict:
    """Generate video script using GPT-4o."""
    is_unconfigured = (
        not settings.OPENAI_API_KEY
        or settings.OPENAI_API_KEY.startswith("sk-your")
        or len(settings.OPENAI_API_KEY) < 10
    )
    if is_unconfigured:
        print("⚠️ OpenAI API Key is missing or invalid. Falling back to local dynamic mock script.")
        return generate_mock_script(prompt, language, style, duration)

    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        if character and character in CHARACTER_PROMPTS:
            system_prompt = CHARACTER_PROMPTS[character]
        else:
            lang_prompts = SCRIPT_PROMPTS.get(language, SCRIPT_PROMPTS["en"])
            system_prompt = lang_prompts.get(style, lang_prompts.get("motivation", ""))

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.85,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": system_prompt.format(prompt=prompt, duration=duration),
                },
                {
                    "role": "user",
                    "content": f"Create a viral reel script for: {prompt}",
                },
            ],
        )

        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"⚠️ OpenAI script generation failed: {e}. Falling back to high-fidelity mock script.")
        return generate_mock_script(prompt, language, style, duration)

