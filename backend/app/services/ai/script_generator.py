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


def _build_prompt(
    language: str,
    style: str,
    prompt: str,
    duration: int,
    num_scenes: int,
    is_serialized: bool = False,
    previous_episode_context: str | None = None,
    series_type: str = "regular",
    character_profile: dict | None = None,
    episode_number: int = 1,
) -> str:
    """Build a structured scene-by-scene script prompt for GPT with hook science."""
    lang_note = (
        "Hindi (Devanagari script)" if language == "hi"
        else "Hinglish (natural Hindi+English mix, Roman script)" if language == "hinglish"
        else (
            "Kannada (ಕನ್ನಡ script). STRICT RULES:\n"
            "- Write ONLY in standard, grammatically correct Kannada as spoken by a native Kannadiga.\n"
            "- Use natural spoken Kannada — conversational, NOT textbook. Avoid overly formal or archaic words.\n"
            "- NEVER repeat words/phrases (e.g., 'ಸುಳ್ಳು ಸುಳ್ಳು' is wrong — say it once).\n"
            "- Use correct verb forms: 'ಬಳಸಿ' not 'ಬಳಸ್ಯೇ', 'ಆಗಿದೆ' not 'ಆಗಿದ' etc.\n"
            "- Do NOT mix in Hindi, English or other languages unless it's a natural loanword (e.g. 'camera', 'police').\n"
            "- Hooks and CTAs must be in Kannada too."
        ) if language == "kn"
        else "English"
    )

    # ── Psychological hook formulas per style ──────────────────────────────────
    hook_bank = {
        "storytelling": [
            "Kya aap jaante hain ki [X] ke peeche ki woh sach jo history books mein nahi hai?",
            "[Historical moment] — yeh ek aisi kahani hai jo [N] saalon se chupayi gayi thi...",
            "Agar [X] sach hai, toh hamari poori soch galat hai.",
            "Woh [ek secret] jo [person/place] ke baare mein koi nahi jaanta — aaj reveal hoga.",
        ],
        "mystery": [
            "Kya [X] actually sach hai? Science abhi bhi explain nahi kar pa rahi...",
            "India ke [place/event] ke baare mein yeh fact sunke aapki roh kaanp jaayegi",
            "Woh [mystery] jo [N] saalon se unsolved hai — aaj hum try karte hain",
            "[Title/Place] ke peeche ka woh andha sach jo government ne chupaaya",
        ],
        "facts": [
            "Kya aap jaante hain ki [surprising fact about topic]? 99% log nahi jaante.",
            "India ke baare mein yeh [N] facts aapko school mein kyun nahi padhaaye gaye?",
            "[Topic] ke baare mein woh fact jo aapka dimaag hila dega — seriously.",
            "Aaj se [X] ko alag nazar se dekhoge — yeh ek fact ke baad.",
        ],
        "devotional": [
            "Shastra kehte hain: '[Sanskrit line]' — aaj ki zindagi mein iska matlab kya hai?",
            "Bhagavad Gita mein ek aisi line hai jo [modern problem] ka [N] saal purana jawab hai.",
            "[Deity/Saint] ne ek baar kuch aisa kiya jo aaj science bhi explain nahi kar sakti.",
            "Yeh ek prayer hai jo [N] saalon se log karte aa rahe hain — aur iska karan pata chala.",
        ],
        "motivation": [
            "90% log [common mistake] karte hain — aur isi wajah se fail hote hain.",
            "Woh ek chhoti si cheez jo successful log roz karte hain aur baaki log ignore karte hain.",
            "Agar aaj se sirf [X] band kar do, toh [timeframe] mein zindagi badal jaayegi.",
            "Failure ko success mein kaise badle — woh formula jo koi nahi batata.",
        ],
        "funny": [
            "Bhai, ye sirf India mein hi ho sakta hai — [relatable situation].",
            "Jab [typical Indian scenario] hota hai — [exaggerated reaction]. Sach mein!",
            "[Indian stereotype] ki asli kahani — jo sirf hum Indians samjhenge.",
            "Ek cheez jo hum Indians kabhi nahi chhod sakte — [relatable quirk].",
        ],
        "business": [
            "Woh ek business mistake jo [industry leaders] baar baar karte hain — aur aap bhi shayad.",
            "₹0 se [X] tak — woh secret formula jo mainstream media nahi batata.",
            "India ke top founders ne [X] kiya — yeh ek counterintuitive decision tha.",
            "Agar [business principle] follow karo, toh [outcome] guaranteed hai.",
        ],
        "news": [
            "Breaking: [topic] ko lekar aaj jo hua, woh kisi ne expect nahi kiya tha.",
            "Yeh khabar [N] saalon mein sabse badi hai — aur mainstream media khamosh hai.",
            "[Event] ke peeche ki asli kahani — jo aapko news channels nahi dikhayenge.",
            "Sirf [duration] mein [major change] — India ke liye kya matlab hai?",
        ],
        "daily_routine": [
            "Meri realistic subah ki routine — koi filter nahi, sirf asli zindagi.",
            "5 kaam jo main roz 9 baje se pehle karta/karti hoon — aur aap bhi kar sakte hain.",
            "Ek chaotic subah mere saath — dekho kaise main ready hota/hoti hoon.",
            "My morning routine as a creator — yeh dekhke tumhari mornings bhi badal jaayengi.",
        ],
        "outfit_check": [
            "Aaj ka look check karo — rate karo 1 se 10 mein comments mein!",
            "Get ready with me — ek naya outfit, ek naya vibe.",
            "GRWM: yeh outfit style karke batata/batati hoon ek quick story.",
            "Outfit transition: casual se boss look — sirf kuch seconds mein.",
        ],
        "dance_trend": [
            "Yeh dance trend easy lagta hai — lekin iska asli secret yeh hai...",
            "15 seconds mein seekho yeh viral hook step — guarantee hai sab dekhenge.",
            "Chalo mil ke try karte hain yeh trending dance transition!",
            "Agar yeh dance kar paaye toh tera rhythm next level hai — try karo!",
        ],
        "travel_vlog": [
            "India ka yeh hidden gem ekdum movie jaisa lagta hai — yaqeen nahi hoga.",
            "24 ghante mere saath — explore karte hain is khoobsurat jagah ko!",
            "Sabse underrated jagah jo aapko is saal zaroor dekhni chahiye.",
            "Travel vlog: [Jagah] ka sabse best local khana dhundhne nikla/nikli hoon.",
        ],
        "product_review": [
            "Maine yeh viral product ek hafte use kiya — yeh raha honest review.",
            "Kya yeh product actually hype ke laayak hai? Aaj pata chalega.",
            "Unboxing: 2026 ka sabse satisfying gadget — dekho reaction!",
            "Yeh [product] mat kharido jab tak yeh video nahi dekh lete — seriously.",
        ],
    }

    # ── Format-specific scene structures ──────────────────────────────────────
    scene_structures = {
        "storytelling": (
            f"Scene 1: MYSTERY HOOK — dark/ancient setting, shocking opening line.\n"
            f"Scenes 2–{max(2, num_scenes-2)}: BUILD TENSION — escalating facts, each scene reveals a new layer.\n"
            f"Scene {num_scenes-1}: SHOCKING REVELATION — deliver the actual truth or answer.\n"
            f"Scene {num_scenes}: CTA — 'Follow karo aur aisi kahaniyan paate raho.'"
        ),
        "mystery": (
            f"Scene 1: FEAR/CURIOSITY HOOK — open with the unsolved mystery or shocking claim.\n"
            f"Scenes 2–{max(2, num_scenes-2)}: EVIDENCE BUILD — escalating facts, each more surprising than the last.\n"
            f"Scene {num_scenes-1}: FULL REVEAL — deliver the actual answer or truth. Do not leave it unsolved.\n"
            f"Scene {num_scenes}: CTA — 'Follow for more hidden truths.'"
        ),
        "facts": (
            f"Scene 1: SHOCKING FACT HOOK — the most surprising fact first.\n"
            f"Scenes 2–{max(2, num_scenes-2)}: FACT CHAIN — each scene = one new surprising fact, building on previous.\n"
            f"Scene {num_scenes-1}: THE MOST MIND-BLOWING FACT — save the best for last.\n"
            f"Scene {num_scenes}: CTA — 'Follow karo daily amazing facts ke liye!'"
        ),
        "devotional": (
            f"Scene 1: SHLOKA/SPIRITUAL HOOK — open with Sanskrit or a powerful divine line.\n"
            f"Scenes 2–{max(2, num_scenes-2)}: MEANING REVEAL — break it down simply, connect to modern life.\n"
            f"Scene {num_scenes-1}: LIFE APPLICATION — one clear takeaway for today.\n"
            f"Scene {num_scenes}: BLESSING CTA — peaceful close, 'Follow karo aise gyan ke liye.'"
        ),
        "motivation": (
            f"Scene 1: CONTRAST HOOK — shocking contrast between success and failure mindset.\n"
            f"Scenes 2–{max(2, num_scenes-2)}: THE PROBLEM then THE SOLUTION — relatable struggle → insight.\n"
            f"Scene {num_scenes-1}: THE KEY ACTION — one specific thing to do today.\n"
            f"Scene {num_scenes}: CHALLENGE CTA — 'Aaj se yeh karo. Share karo jise zaroorat hai.'"
        ),
        "funny": (
            f"Scene 1: RELATABLE SETUP — introduce the painfully familiar Indian situation.\n"
            f"Scenes 2–{max(2, num_scenes-2)}: ESCALATION — build the comedy, exaggerate each step.\n"
            f"Scene {num_scenes-1}: PUNCHLINE MOMENT — the peak comedy beat.\n"
            f"Scene {num_scenes}: REACTION CTA — 'Tag karo us dost ko jise yeh daily hota hai!'"
        ),
        "business": (
            f"Scene 1: COUNTERINTUITIVE HOOK — claim that challenges common belief.\n"
            f"Scenes 2–{max(2, num_scenes-2)}: PROOF — real examples or numbers backing the claim.\n"
            f"Scene {num_scenes-1}: ACTIONABLE FRAMEWORK — 2-3 steps anyone can apply.\n"
            f"Scene {num_scenes}: AUTHORITY CTA — 'Follow karo daily business gyaan ke liye.'"
        ),
        "news": (
            f"Scene 1: URGENT HEADLINE — breaking, dramatic opening with the key fact.\n"
            f"Scenes 2–{max(2, num_scenes-2)}: CONTEXT — who, what, why — quickly and clearly.\n"
            f"Scene {num_scenes-1}: IMPACT — what does this mean for common people/India?\n"
            f"Scene {num_scenes}: OPINION CTA — 'Comment mein batao aapki kya soch hai?'"
        ),
        "daily_routine": (
            f"Scene 1: HOOK — morning waking up/stretching, coffee pour, or looking in the mirror.\n"
            f"Scenes 2–{max(2, num_scenes-2)}: ROUTINE BEATS — quick cuts of skincare, outfit picking, working, fast-paced vlogging edits.\n"
            f"Scene {num_scenes-1}: READY REVEAL — posing ready, smile, energetic transition.\n"
            f"Scene {num_scenes}: CTA — 'Follow for daily routine tips!'"
        ),
        "outfit_check": (
            f"Scene 1: BEFORE STATE HOOK — standing in simple/plain clothes, looking at camera.\n"
            f"Scenes 2–{max(2, num_scenes-2)}: STYLING DETAIL — picking out sneakers, adding accessories, snapping fingers to transition.\n"
            f"Scene {num_scenes-1}: FINAL REVEAL — full body look, spinning/posing confidently, stylish posture.\n"
            f"Scene {num_scenes}: CTA — 'Let me know: Fit 1 or 2? Follow for daily style fits!'"
        ),
        "dance_trend": (
            f"Scene 1: HOOK STEP — doing a viral dance transition, high energy, smiling at lens.\n"
            f"Scenes 2–{max(2, num_scenes-2)}: STEP BREAKDOWN — slow motion details of footwork or arm movements.\n"
            f"Scene {num_scenes-1}: FULL DANCE RUN — smooth transition, dancing with high energy, looking stylish.\n"
            f"Scene {num_scenes}: CTA — 'Try this trend now! Tag me, and follow for more tutorials!'"
        ),
        "travel_vlog": (
            f"Scene 1: SCENIC LANDSCAPE HOOK — stunning outdoor landmark background, looking at camera.\n"
            f"Scenes 2–{max(2, num_scenes-2)}: EXPLORATION BEATS — walking down streets, trying street food, aesthetic dynamic camera pan.\n"
            f"Scene {num_scenes-1}: GOLDEN HOUR SHOT — beautiful emotional sunset background, spinning/posing.\n"
            f"Scene {num_scenes}: CTA — 'Save this reel for your next trip! Follow for more travel spots!'"
        ),
        "product_review": (
            f"Scene 1: UNBOXING HOOK — peeling off wrap, exciting open, close-up of product.\n"
            f"Scenes 2–{max(2, num_scenes-2)}: USAGE DEMONSTRATION — showing texture, application, aesthetic close-ups.\n"
            f"Scene {num_scenes-1}: HONEST RATING — showing final face reaction/thumbs up.\n"
            f"Scene {num_scenes}: CTA — 'Link is in bio! Follow for more honest reviews!'"
        ),
    }

    # ── Visual palette anchors per style — serialized styles rotate per episode ─
    _storytelling_palettes = [
        # Warm gold
        "Ancient Himalayan cave at dawn — rishi meditating, sacred fire glow, stone carvings, warm amber and gold light, tight dramatic close-ups.",
        # Cool blue-silver
        "Riverside ghaat at midnight — cool silver moonlight on still water, lone sage with manuscript, blue-white mist, high contrast shadows.",
        # Deep orange-red
        "Mountain peak at blazing sunset — lone ascetic silhouette against burning orange-red sky, vast dramatic landscape, wide establishing shot.",
        # Teal-green dark
        "Dense ancient jungle at dusk — moss-covered ruins, deep teal-green light, torchlight, ancient stone pillars, mysterious wide angle.",
        # Bright white-gold
        "Open Himalayan plateau at noon — bright white sky, snow peaks, guru teaching disciples, clean high-key light, serene and vast.",
        # Purple-indigo night
        "Ancient rooftop observatory at night — deep indigo sky, stars, astronomer-sage with scrolls, purple moonlight, mystical and wide.",
        # Sepia-brown library
        "Ancient royal library — palm-leaf manuscripts, scholar with oil lamp, warm sepia light, towering wooden shelves fading into darkness.",
        # Misty green-grey
        "Sacred banyan grove at dawn — grey-green morning mist, roots and offerings, havan smoke rising, soft diffused light, macro ritual objects.",
    ]
    _devotional_palettes = [
        # Warm sunrise orange
        "Sunrise over Ganges — bright orange sun rising, ghaat steps, lamp floating on water, warm golden hour glow, wide devotional shot.",
        # Cool blue-white night
        "Temple sanctum at midnight — cool blue moonlight through dome, single diya flame, deity idol, deep blue-white contrast, intimate close-up.",
        # Bright white snow
        "Himalayan ashram at noon — monk in white, snow-capped peaks, bright open sky, clean crisp light, serene wide establishing shot.",
        # Soft pink morning
        "Garden at early morning — pink-rose light, dew on flowers, hands in prayer, sindoor, soft diffused glow, macro spiritual close-ups.",
    ]
    _mystery_palettes = [
        # Dark grey-brown fog
        "Abandoned hilltop fort at dusk — cold grey fog rolling in, iron doors, strange symbols, dim flickering torchlight, unsettling wide angle.",
        # Eerie blue
        "Dense jungle at night — eerie cold blue moonlight, shadow figure near ancient monolith, deep blue-black shadows, cryptic stone carving close-up.",
        # Green-yellow horror
        "Old haveli corridor — sickly yellow-green flickering bulb, cracked walls, long shadows, slow push-in camera movement.",
        # Aqua-blue underwater
        "Sunken temple underwater — aqua-blue shafts of light, ancient stone inscriptions, fish drifting past, haunting and ethereal.",
    ]

    ep_idx = max(0, episode_number - 1)
    rotating_palettes = {
        "storytelling": _storytelling_palettes[ep_idx % len(_storytelling_palettes)],
        "devotional": _devotional_palettes[ep_idx % len(_devotional_palettes)],
        "mystery": _mystery_palettes[ep_idx % len(_mystery_palettes)],
    }
    visual_palettes = {
        **rotating_palettes,
        "facts": "Clean infographic-style — maps, historical photographs, dramatic reenactments, close-ups of objects, split-screen comparisons. Bright but informative.",
        "motivation": "High-contrast dramatic — mountain peaks, lone athlete training at sunrise, empty road ahead, hands writing, city skyline at dawn. Bold, energetic.",
        "funny": "Bright saturated everyday India — chai stalls, family dinner, metro, office, markets. Expressive faces and recognizable settings.",
        "business": "Clean modern India — glass offices, laptops, pitch decks, startup hubs, graphs. Sharp and authoritative.",
        "news": "Broadcast-style drama — news studio feel, India map overlays, city aerials, government buildings. Urgent and high-contrast.",
        "daily_routine": "Handheld vlogging style, natural bright indoor light, cozy modern apartment, morning bedroom, kitchen, dynamic close-up cuts.",
        "outfit_check": "Bright studio background, full-length mirror style, elegant styling items, high-fashion wardrobe, close-ups of texture/jewelry.",
        "dance_trend": "Dynamic motion blur, neon accents, modern dance studio or urban street, energetic moving camera, front angle facing the lens.",
        "travel_vlog": "Vibrant cinematic landscapes, sun-kissed outdoor photography, epic nature views, bustling markets, traveler's perspective shots.",
        "product_review": "Clean studio desk, soft ring lighting, product close-ups, macro texture shots, aesthetic shelf backgrounds, modern minimalist styling.",
    }

    hooks = hook_bank.get(style, hook_bank["motivation"])
    structure = scene_structures.get(style, scene_structures["motivation"])
    palette = visual_palettes.get(style, "Cinematic, high-quality vertical 9:16 visuals.")
    hooks_fmt = "\n".join(f"  {i+1}. {h}" for i, h in enumerate(hooks))

    avg_scene_dur = max(5, duration // num_scenes)
    example_scenes = "\n".join(
        f'    {{"id": {i+1}, "duration": {avg_scene_dur}, "narration_segment": "...", '
        f'"visual": "SPECIFIC 15-20 word scene: who/what + setting + lighting + mood + camera angle (scene {i+1})"}}'
        for i in range(num_scenes)
    )
    example_keywords = ", ".join(f'"3-5 word tag {i+1}"' for i in range(num_scenes))

    serialized_rules = ""
    if is_serialized:
        reveal_gate = ""
        if episode_number >= 4:
            reveal_gate = (
                f"\n- REVEAL GATE (episode {episode_number}): By now the audience has waited long enough. "
                "If ANY specific name, mantra, secret, formula, or answer was promised in prior episodes and NOT yet stated explicitly in the narrations — state it CLEARLY and COMPLETELY in THIS episode. "
                "Do NOT use vague phrases like 'यह मंत्र', 'वह रहस्य', 'इस साधना' without naming the actual thing. "
                "Name it. Spell it out. Explain it. This is non-negotiable."
            )
        serialized_rules = (
            "- This is a SERIALIZED, CONTINUOUS episode. The narrative MUST flow directly from the previous episode's context.\n"
            "- Pick up the story/explanation where the previous episode left off. Do NOT start from scratch.\n"
            "- Scene 1 narration must hook the viewer by referencing the previous episode's cliffhanger or continuing the flow.\n"
            "- CRITICAL: If the current episode prompt promises a reveal, discovery, or answer — you MUST deliver it fully in this episode. Do NOT tease again.\n"
            "- End with a cliffhanger ONLY if there is genuinely more story to tell. If this episode delivers the promised reveal, end with a satisfying conclusion + follow CTA instead."
            + reveal_gate
        )
        if previous_episode_context:
            serialized_rules += f"\n- PREVIOUS EPISODES CONTEXT (do NOT repeat this content — advance beyond it):\n{previous_episode_context}"
    else:
        serialized_rules = (
            "- Each episode is COMPLETELY STANDALONE — viewer needs zero context from other episodes.\n"
            "- NO serialized story — NO 'sage continues', 'next part', 'previously'.\n"
            "- Scene 1 narration MUST be the hook — it decides if viewers stay or scroll."
        )

    influencer_rules = ""
    if series_type == "ai_influencer" and character_profile:
        from app.services.ai.image_service import build_character_anchor_prompt
        anchor = build_character_anchor_prompt(character_profile)
        influencer_rules = (
            f"- CRITICAL: This is an AI INFLUENCER video starring the virtual persona character: '{anchor}'.\n"
            f"- Make sure the character is the direct focus and is active/doing actions in every single scene.\n"
            f"- The character's clothing and environment CAN change between scenes to show progression, but keep the face identical.\n"
            f"- Every scene visual description must include: '{anchor}' as the main subject.\n"
            f"- Do NOT use different names for the influencer character.\n"
            f"- The tone must be engaging, trendy, vlogging style, high energy.\n"
        )

    # For serialized reveal episodes, override hooks to direct-reveal format
    is_force_reveal = is_serialized and episode_number >= 4
    if is_force_reveal:
        reveal_hooks_fmt = (
            "  1. '[MANTRA/SECRET NAME] — यही है वह रहस्य जिसका इंतज़ार था' (direct name drop)\n"
            "  2. 'आज पहली बार सुनिए: [SPECIFIC NAME] — वह प्राचीन साधना जो बदल देती है सब कुछ' (first reveal)\n"
            "  3. '[SPECIFIC MANTRA] — इन तीन शब्दों में छुपा है हज़ारों साल का ज्ञान' (specific content)\n"
            "  4. 'रहस्य खुलता है आज: [NAME] साधना का वह सूत्र जो ऋषियों ने छुपाया' (revelation format)\n"
            "CRITICAL: Hook MUST start with the specific name/mantra — NOT a question. Do NOT use 'क्या आपने', 'क्या आप जानते'. State the name directly."
        )
        hooks_section = f"━━ REVEAL HOOKS — use one of these (NOT question hooks):\n{reveal_hooks_fmt}"
        structure_section = (
            f"━━ SCENE STRUCTURE — REVEAL FORMAT:\n"
            f"Scene 1: DIRECT REVEAL — state the specific mantra/secret NAME immediately. No question hook.\n"
            f"Scenes 2–{max(2, num_scenes-2)}: EXPLAIN IT — what it means, how to practice it, step by step.\n"
            f"Scene {num_scenes-1}: TRANSFORMATION — what changes when you apply this. Concrete outcome.\n"
            f"Scene {num_scenes}: CLOSING CTA — 'Follow karo aur aisi vidya paate raho.'"
        )
    else:
        hooks_section = f"━━ HOOK FORMULAS — adapt the best-fitting one for this topic:\n{hooks_fmt}"
        structure_section = f"━━ SCENE STRUCTURE — follow this format exactly:\n{structure}"

    return f"""You are an expert viral short-form video scriptwriter for Indian content creators. You understand psychological hooks, scroll-stopping openers, and emotional pacing.

CRITICAL — PROPER NOUN SPELLING:
- If the topic contains any Sanskrit, Hindi, or Indian proper noun written in Roman/English script (e.g. "Asta Vakra", "Ashtavakra", "Ramayan", "Hanuman", "Gita"), identify it correctly and use the standard native-script spelling in the narration.
- NEVER phonetically transliterate Roman characters into Devanagari/native script letter-by-letter. Example: "Asta Vakra" → अष्टावक्र (NOT आसता वाक्र).
- Proper nouns like sage names, scripture names, deity names must use their established correct spellings.

Topic: {prompt}
Language: {lang_note}
Style: {style.upper()}
Duration: {duration} seconds | Scenes: EXACTLY {num_scenes} (each ~{avg_scene_dur} seconds)
Target narration length: ~{duration * 2} words total (spoken at ~2 words/sec fills {duration}s). Each scene narration_segment must be ~{avg_scene_dur * 2} words. Do NOT write shorter — short narration = short video.

{hooks_section}

{structure_section}

━━ VISUAL PALETTE — apply consistently to ALL scenes:
{palette}

━━ STRICT RULES:
{serialized_rules}
{influencer_rules}
- Every "visual" = SPECIFIC 15-20 word cinematic image prompt
  - Include: subject, setting, lighting, mood, camera angle
  - VARY the environments to prevent visual fatigue.
  - ✅ "Ancient marketplace at dusk, merchants with spices, warm lantern light, wide angle view"
  - ❌ "spiritual nature scene" (too vague) or same setting repeated across scenes
- Write EXACTLY {num_scenes} scenes — no more, no less
- Narration = one continuous voice, flows naturally across all scenes
- CTA in final scene must feel earned, not forced
- CRITICAL: Never prefix narration or any narration_segment with 'Scene X:', 'Scene X narration:', 'Narrator:', or similar labels. Each segment should ONLY contain the clean spoken voiceover text. For example, write "परमेश्वर की असीम कृपा..." instead of "Scene 1: परमेश्वर की असीम कृपा...".

Return ONLY valid JSON:
{{
  "narration": "complete voiceover from start to finish",
  "hook": "scene 1 opening line only — the scroll-stopper",
  "scenes": [
    {example_scenes}
  ],
  "visual_keywords": [{example_keywords}],
  "caption": "Instagram caption — strong hook line + emoji + 2 sentence expand + CTA",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8"]
}}"""


SCRIPT_PROMPTS: dict[str, dict[str, str]] = {}  # kept for compatibility, not used


def generate_mock_script(prompt: str, language: str, style: str, duration: int) -> dict:
    """Generate high-fidelity mock video script for offline / API key fallback."""
    is_kn = language == "kn"
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
        },
        "kn": {
            "funny": {
                "narration": f"ಗೆಳೆಯರೇ, ಇಂದು ನಾವು {prompt} ಬಗ್ಗೆ ಮಾತನಾಡೋಣ! ಇದು ನಮ್ಮ ಜೀವನದಲ್ಲಿ ಆಗುವ ತಮಾಷೆ ಸಂಗತಿ! 😂 ಕಾಮೆಂಟ್‌ನಲ್ಲಿ ಹೇಳಿ!",
                "hook": f"ಗೆಳೆಯರೇ, {prompt} ಬಗ್ಗೆ ಏನಂತೀರಿ...",
                "caption": f"{prompt} ಬಗ್ಗೆ ನಿಜ! 😂 ನಿಮ್ಮ ಗೆಳೆಯರಿಗೆ ಶೇರ್ ಮಾಡಿ!",
                "hashtags": ["#kannada", "#comedy", "#funny", "#karnataka", "#kannadareels", "#viral"]
            },
            "devotional": {
                "narration": f"ದೇವರ ಅನುಗ್ರಹ ನಿಮ್ಮ ಮೇಲೆ ಸದಾ ಇರಲಿ. {prompt} ಬಗ್ಗೆ ಯೋಚಿಸಿದಾಗ ಮನಸ್ಸಿಗೆ ಒಂದು ಅದ್ಭುತ ಶಾಂತಿ ಸಿಗುತ್ತದೆ. ಜೈ ಶ್ರೀ ರಾಮ. 🙏",
                "hook": f"ಭಗವಂತನ ಶರಣಾಗಿ, ಮನಸ್ಸಿನ ಶಾಂತಿ ಪಡೆಯಿರಿ...",
                "caption": f"{prompt} ಬಗ್ಗೆ ಆಧ್ಯಾತ್ಮಿಕ ವಿಚಾರ 🙏",
                "hashtags": ["#kannada", "#bhakti", "#devotional", "#karnataka", "#kannadareels", "#spiritual"]
            },
            "motivation": {
                "narration": f"ನೆನಪಿಡಿ, {prompt} ಕೇವಲ ಒಂದು ಆರಂಭ. ಇಂದು ಸೋತರೂ ನಾಳೆ ಎದ್ದು ನಿಲ್ಲಿ. ಶ್ರಮ ಪಡಿ, ನಿಮ್ಮ ಕನಸನ್ನು ನನಸಾಗಿಸಿ! 🔥",
                "hook": f"ಸೋಲಬೇಡಿ, {prompt} ನಿಮ್ಮ ಶಕ್ತಿ!",
                "caption": f"ಇಂದೇ ಪ್ರೇರಣೆ ಪಡೆಯಿರಿ! 🔥 {prompt} ಬಗ್ಗೆ ನಿಜ",
                "hashtags": ["#kannada", "#motivation", "#karnataka", "#kannadareels", "#inspiration", "#success"]
            },
            "business": {
                "narration": f"ವ್ಯಾಪಾರದಲ್ಲಿ ಯಶಸ್ಸಿಗೆ ಒಂದೇ ಮಂತ್ರ: {prompt} ಮೇಲೆ ಗಮನ ಕೊಡಿ. ನಿಮ್ಮ ಗ್ರಾಹಕರನ್ನು ಅರ್ಥ ಮಾಡಿಕೊಳ್ಳಿ ಮತ್ತು ಬೆಳವಣಿಗೆ ಕಾಣಿ! 💼",
                "hook": f"ನೀವೂ {prompt} ಬಗ್ಗೆ ತಿಳಿದಿದ್ದೀರಾ?",
                "caption": f"ವ್ಯಾಪಾರ ಸಲಹೆ! 💼 {prompt} ಬಗ್ಗೆ",
                "hashtags": ["#kannada", "#business", "#karnataka", "#kannadareels", "#entrepreneur", "#startup"]
            },
            "news": {
                "narration": f"ಮುಖ್ಯ ಸುದ್ದಿ! {prompt} ಬಗ್ಗೆ ದೊಡ್ಡ ಘೋಷಣೆ ಆಗಿದೆ. ತಜ್ಞರ ಪ್ರಕಾರ ಇದು ಭವಿಷ್ಯದಲ್ಲಿ ದೊಡ್ಡ ಬದಲಾವಣೆ ತರುತ್ತದೆ. ಇನ್ನಷ್ಟು ಸುದ್ದಿಗೆ ಫಾಲೋ ಮಾಡಿ. 📰",
                "hook": f"ಬ್ರೇಕಿಂಗ್ ನ್ಯೂಸ್: {prompt} ಬಗ್ಗೆ ಮಹತ್ವದ ಘೋಷಣೆ!",
                "caption": f"{prompt} ಬಗ್ಗೆ ಇತ್ತೀಚಿನ ಸುದ್ದಿ 📰",
                "hashtags": ["#kannada", "#news", "#karnataka", "#kannadanews", "#kannadareels", "#breaking"]
            }
        }
    }

    lang_key = "kn" if is_kn else "hi" if is_hi else "en"
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
    num_scenes: int = 6,
    is_serialized: bool = False,
    previous_episode_context: str | None = None,
    series_type: str = "regular",
    character_profile: dict | None = None,
    episode_number: int = 1,
) -> dict:
    """Generate video script using GPT-4o-mini with structured scene-by-scene format."""
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
            # Inject scene count into character prompt
            char_base = CHARACTER_PROMPTS[character]
            system_prompt = (
                char_base
                + "\n\nCRITICAL — PROPER NOUN SPELLING: If topic contains Sanskrit/Hindi proper nouns in Roman script (e.g. 'Asta Vakra', 'Ramayan'), use the correct native-script spelling (अष्टावक्र). NEVER phonetically transliterate Roman chars letter-by-letter into Devanagari."
                + f"\n\nIMPORTANT: Generate EXACTLY {num_scenes} scenes in the 'scenes' array "
                f"(Scene 1 = HOOK, Scenes 2-{num_scenes-1} = content, Scene {num_scenes} = CTA). "
                f"'visual_keywords' must also have EXACTLY {num_scenes} entries."
                f"\n\nCRITICAL: Never prefix narration or any narration_segment with 'Scene X:', 'Scene X narration:', 'Narrator:', or similar labels. Each segment/narration should ONLY contain the clean spoken voiceover text."
            )
            if is_serialized and previous_episode_context:
                system_prompt += (
                    f"\n\nCRITICAL: This is a SERIALIZED, CONTINUOUS episode. "
                    f"Continue the narration naturally from the previous episode's context:\n"
                    f"{previous_episode_context}\n"
                    f"Pick up where it left off, and end with a cliffhanger or transition."
                )
            system_prompt = system_prompt.format(prompt=prompt, duration=duration)
        else:
            system_prompt = _build_prompt(
                language,
                style,
                prompt,
                duration,
                num_scenes,
                is_serialized=is_serialized,
                previous_episode_context=previous_episode_context,
                series_type=series_type,
                character_profile=character_profile,
                episode_number=episode_number,
            )

        # Devanagari/script chars cost ~2-4 tokens each; 6 scenes × 90s needs ~2500 tokens
        tokens_needed = max(2500, num_scenes * 250 + 500)
        gpt_model = "gpt-4o-mini"

        response = await client.chat.completions.create(
            model=gpt_model,
            temperature=0.85,
            max_tokens=tokens_needed,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Create a viral reel script for: {prompt}"},
            ],
        )

        finish_reason = response.choices[0].finish_reason
        print(f"✅ GPT [{gpt_model}] script done | finish={finish_reason} | lang={language}")
        if finish_reason == "length":
            print(f"⚠️ GPT response truncated. Requested {tokens_needed} tokens but hit limit. Falling back to mock.")
            return generate_mock_script(prompt, language, style, duration)

        result = json.loads(response.choices[0].message.content)
        
        # Post-process response to clean all Scene labels from segments
        import re
        def clean_seg(text: str) -> str:
            if not text:
                return text
            cleaned = re.sub(
                r'^(Scene\s*\d+\s*[:\-]?\s*(narration)?\s*[:\-]?\s*)|^(Narrator\s*:\s*)', 
                '', 
                text, 
                flags=re.IGNORECASE
            )
            return cleaned.strip()

        if "narration" in result:
            result["narration"] = clean_seg(result["narration"])
        if "hook" in result:
            result["hook"] = clean_seg(result["hook"])
        if "scenes" in result:
            for s in result["scenes"]:
                if "narration_segment" in s:
                    s["narration_segment"] = clean_seg(s["narration_segment"])

        print(f"✅ GPT script: {len(result.get('scenes', []))} scenes generated (requested {num_scenes})")
        return result
    except Exception as e:
        print(f"⚠️ OpenAI script generation failed: {e}. Falling back to high-fidelity mock script.")
        return generate_mock_script(prompt, language, style, duration)

