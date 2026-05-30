import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from pydantic import BaseModel, Field
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.series import Series, SeriesEpisode
from app.models.publish_job import CreditTransaction
from app.core.security import get_current_user

router = APIRouter(prefix="/series", tags=["series"])


class CreateSeriesRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    topic: str = Field(..., min_length=10, max_length=1000)
    style: str = Field("storytelling", pattern="^(funny|devotional|motivation|business|news|storytelling|mystery|facts|daily_routine|outfit_check|dance_trend|travel_vlog|product_review)$")
    language: str = Field("hi", pattern="^(hi|en|hinglish|kn)$")
    voice_id: str = Field("rohit_m", pattern="^(rohit_m|priya_f|arjun_m|ananya_f|kavya_f|vikram_m)$")
    duration_target: int = Field(60, ge=30, le=90)
    caption_mode: str = Field("full_sentence", pattern="^(full_sentence|keyword_pop)$")
    is_serialized: bool = True
    series_type: str = Field("regular", pattern="^(regular|ai_influencer)$")
    character_profile: dict | None = None


class UpdateSeriesScheduleRequest(BaseModel):
    schedule_type: str = Field(..., pattern="^(manual|daily|every_3_days|weekly)$")
    schedule_time: str = Field("09:00", pattern="^([01]\\d|2[0-3]):[0-5]\\d$")
    caption_mode: str | None = Field(None, pattern="^(full_sentence|keyword_pop)$")
    character_profile: dict | None = None


class SeriesResponse(BaseModel):
    id: uuid.UUID
    name: str
    topic: str
    style: str
    language: str
    voice_id: str
    duration_target: int
    episode_count: int
    caption_mode: str
    schedule_type: str
    schedule_time: str
    is_serialized: bool
    series_type: str
    character_profile: dict | None
    next_run_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class EpisodeResponse(BaseModel):
    id: uuid.UUID
    episode_number: int
    generated_prompt: str
    project_id: uuid.UUID | None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class GenerateEpisodeResponse(BaseModel):
    episode_id: uuid.UUID
    project_id: uuid.UUID
    job_id: str


async def _derive_content_pillars(name: str, topic: str, style: str, language: str) -> list[str]:
    """GPT auto-derives 6-8 viral content pillars from series name + topic."""
    from app.config import settings
    import openai
    client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    lang_hint = "Hindi" if language == "hi" else "Hinglish" if language == "hinglish" else "Kannada" if language == "kn" else "English"
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.9,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an Instagram content strategist for Indian faceless reels pages. "
                    "Given a content channel name and niche, derive 6-8 specific content pillars "
                    "that will generate viral standalone episodes. "
                    "Each pillar = a specific sub-topic angle that sparks curiosity. "
                    f"Language: {lang_hint}. "
                    "Return ONLY a JSON array of strings, no explanation. "
                    'Example: ["tantra secrets", "karma science", "temple mysteries", "aghori truth", "ancient India facts", "numerology", "spiritual controversies"]'
                ),
            },
            {
                "role": "user",
                "content": f'Channel: "{name}"\nNiche/Topic: {topic}\nStyle: {style}',
            },
        ],
        max_tokens=200,
    )
    import json
    try:
        pillars = json.loads(resp.choices[0].message.content.strip())
        return pillars if isinstance(pillars, list) else []
    except Exception:
        return []


async def _get_owned_series(series_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> Series:
    result = await db.execute(
        select(Series).where(Series.id == series_id, Series.user_id == user_id, Series.is_deleted == False)
    )
    series = result.scalar_one_or_none()
    if not series:
        raise HTTPException(status_code=404, detail="Series not found")
    return series


@router.post("", response_model=SeriesResponse, status_code=status.HTTP_201_CREATED)
async def create_series(
    body: CreateSeriesRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pillars = await _derive_content_pillars(body.name, body.topic, body.style, body.language)
    series = Series(
        user_id=current_user.id,
        name=body.name,
        topic=body.topic,
        style=body.style,
        language=body.language,
        voice_id=body.voice_id,
        duration_target=body.duration_target,
        caption_mode=body.caption_mode,
        content_pillars=pillars,
        is_serialized=body.is_serialized,
        series_type=body.series_type,
        character_profile=body.character_profile,
    )
    db.add(series)
    await db.flush()
    print(f"✅ Series '{body.name}' pillars: {pillars}")
    return series


@router.get("", response_model=list[SeriesResponse])
async def list_series(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Series)
        .where(Series.user_id == current_user.id, Series.is_deleted == False)
        .order_by(Series.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{series_id}", response_model=SeriesResponse)
async def get_series(
    series_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _get_owned_series(series_id, current_user.id, db)


@router.get("/{series_id}/episodes", response_model=list[EpisodeResponse])
async def list_episodes(
    series_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_owned_series(series_id, current_user.id, db)
    result = await db.execute(
        select(SeriesEpisode)
        .where(SeriesEpisode.series_id == series_id)
        .order_by(SeriesEpisode.episode_number.asc())
    )
    return result.scalars().all()


@router.delete("/{series_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_series(
    series_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    series = await _get_owned_series(series_id, current_user.id, db)
    series.is_deleted = True


class CharacterPreviewRequest(BaseModel):
    character_profile: dict


class CharacterPreviewResponse(BaseModel):
    preview_url: str


@router.post("/character-preview", response_model=CharacterPreviewResponse)
async def generate_character_preview(
    body: CharacterPreviewRequest,
    current_user: User = Depends(get_current_user),
):
    if current_user.credits <= 0:
        raise HTTPException(status_code=402, detail="Insufficient credits to generate preview.")

    from app.services.ai.image_service import generate_image_for_scene
    from app.services.storage.r2_client import upload_to_r2
    import os
    import uuid

    # Build the scene prompt for the preview
    scene_visual = "A close-up vertical portrait photo of the influencer, facing the camera, neutral studio background, professional soft studio lighting"
    
    # Generate the image
    local_path = await generate_image_for_scene(
        scene_visual=scene_visual,
        style="motivation", # default style
        series_type="ai_influencer",
        character_profile=body.character_profile
    )
    
    # Upload to R2 or static directory
    r2_key = f"previews/{uuid.uuid4()}.jpg"
    preview_url = await upload_to_r2(local_path, r2_key)
    
    try:
        os.remove(local_path)
    except Exception:
        pass
        
    return CharacterPreviewResponse(preview_url=preview_url)


@router.patch("/{series_id}/schedule", response_model=SeriesResponse)
async def update_series_schedule(
    series_id: uuid.UUID,
    body: UpdateSeriesScheduleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.scheduler import compute_next_run_at
    from sqlalchemy.orm.attributes import flag_modified
    series = await _get_owned_series(series_id, current_user.id, db)
    series.schedule_type = body.schedule_type
    series.schedule_time = body.schedule_time
    series.next_run_at = compute_next_run_at(body.schedule_type, body.schedule_time)
    if body.caption_mode:
        series.caption_mode = body.caption_mode
    if body.character_profile is not None:
        series.character_profile = body.character_profile
        flag_modified(series, "character_profile")
    await db.flush()
    return series


@router.post("/{series_id}/generate", response_model=GenerateEpisodeResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_episode(
    series_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.config import settings
    import openai
    import redis as sync_redis
    import rq

    series = await _get_owned_series(series_id, current_user.id, db)
    cost = 5 if series.series_type == "ai_influencer" else 1

    # Atomic credit deduction
    result = await db.execute(
        text("UPDATE users SET credits = credits - :cost WHERE id = :id AND credits >= :cost RETURNING credits"),
        {"id": str(current_user.id), "cost": cost},
    )
    if result.fetchone() is None:
        raise HTTPException(status_code=402, detail="Insufficient credits. Please upgrade your plan.")

    # Fetch last 5 episode prompts to avoid repetition
    prior_result = await db.execute(
        select(SeriesEpisode.generated_prompt)
        .where(SeriesEpisode.series_id == series_id)
        .order_by(SeriesEpisode.episode_number.desc())
        .limit(5)
    )
    recent_prompts = [r[0] for r in prior_result.fetchall()]
    episode_number = series.episode_count + 1

    pillars = series.content_pillars or []
    pillars_str = ", ".join(pillars) if pillars else series.topic
    recent_str = "\n".join(f"- {p[:80]}" for p in recent_prompts) if recent_prompts else "None yet."
    lang_hint = "Hindi" if series.language == "hi" else "Hinglish" if series.language == "hinglish" else "Kannada (ಕನ್ನಡ)" if series.language == "kn" else "English"

    # Fetch previous episode context if continuous mode is enabled
    previous_episode_context = None
    previous_episode_str = None
    if series.is_serialized and series.episode_count > 0:
        # Fetch last 3 episodes for richer continuity context
        last_eps_result = await db.execute(
            select(SeriesEpisode, Project)
            .join(Project, SeriesEpisode.project_id == Project.id, isouter=True)
            .where(SeriesEpisode.series_id == series_id)
            .order_by(SeriesEpisode.episode_number.desc())
            .limit(3)
        )
        last_ep_rows = list(reversed(last_eps_result.fetchall()))
        if last_ep_rows:
            last_ep, last_project = last_ep_rows[-1]
            last_narration = None
            if last_project and last_project.script_json:
                last_narration = last_project.script_json.get("narration")

            previous_episode_context = {
                "episode_number": last_ep.episode_number,
                "prompt": last_ep.generated_prompt,
                "narration": last_narration,
            }
            parts = []
            for ep, proj in last_ep_rows:
                narration = None
                if proj and proj.script_json:
                    narration = proj.script_json.get("narration", "")
                narration_snippet = (narration or "")[:200]
                parts.append(
                    f"Episode {ep.episode_number} Prompt: {ep.generated_prompt}\n"
                    f"Episode {ep.episode_number} Narration: {narration_snippet}"
                )
            previous_episode_str = "\n\n".join(parts)

    # Hook formulas mapped per style and language — psychological triggers proven to stop scroll
    hook_formulas_hi = {
        "storytelling": (
            '- "[X] के पीछे की वो सच्चाई जो इतिहास की किताबों में नहीं" (hidden truth)\n'
            '- "[N] साल पुरानी वो कहानी जो आज भी अनसुनी है" (forgotten story)\n'
            '- "अगर [X] सच है, तो हमारी पूरी सोच गलत है" (reality flip)\n'
            '- "[Person/Place] का वो रहस्य जो कोई नहीं जानता" (secret reveal)'
        ),
        "mystery": (
            '- "क्या [X] actually सच है? Science अभी भी explain नहीं कर पा रही" (science gap)\n'
            '- "[Place/Event] के बारे में यह fact सुनकर रोह कांप जाएगी" (fear trigger)\n'
            '- "[N] सालों से unsolved है यह mystery" (time pressure)\n'
            '- "वो सच जो [authority] ने छुपाया" (conspiracy angle)'
        ),
        "facts": (
            '- "क्या आप जानते हैं कि [surprising fact]? 99% लोग नहीं जानते" (knowledge gap)\n'
            '- "[Topic] के बारे में वो [N] facts जो school में नहीं पढ़ाए गए" (education gap)\n'
            '- "[X] के बारे में वो fact जो दिमाग हिला देगा" (shock value)\n'
            '- "आज से [X] को अलग नज़र से देखोगे — यह एक fact के बाद" (perspective shift)'
        ),
        "motivation": (
            '- "90% लोग [mistake] करते हैं — इसीलिए fail होते हैं" (majority contrast)\n'
            '- "वो एक छोटी सी चीज़ जो successful लोग रोज़ करते हैं" (insider secret)\n'
            '- "Agar aaj se [X] band kar do, [timeframe] mein zindagi badal jayegi" (transformation promise)\n'
            '- "Failure ko success mein kaise badle — woh formula jo koi nahi batata" (hidden formula)'
        ),
        "devotional": (
            '- "शास्त्र कहते हैं: [shloka] — आज की ज़िंदगी में इसका मतलब क्या है?" (ancient wisdom)\n'
            '- "Bhagavad Gita में एक ऐसी line है जो [modern problem] का जवाब देती है" (problem-solution)\n'
            '- "[Deity] ने एक बार कुछ ऐसा किया जो science आज भी explain नहीं कर सकती" (divine mystery)'
        ),
        "funny": (
            '- "भाई, यह सिर्फ India में ही हो सकता है — [relatable situation]" (pride + relatability)\n'
            '- "जब [Indian scenario] होता है — [exaggerated reaction]" (exaggeration)\n'
            '- "एक चीज़ जो हम Indians कभी नहीं छोड़ सकते — [quirk]" (identity hook)'
        ),
        "business": (
            '- "वो एक business mistake जो [leaders] बार-बार करते हैं" (authority contrast)\n'
            '- "₹0 से [X] तक — वो secret formula जो mainstream media नहीं बताता" (rags-to-riches)\n'
            '- "India के top founders ने [X] किया — counterintuitive decision था" (contrarian)'
        ),
        "news": (
            '- "Breaking: [topic] को लेकर आज जो हुआ, किसी ने expect नहीं किया" (urgency)\n'
            '- "यह खबर [N] सालों में सबसे बड़ी है — और mainstream media चुप है" (alternative voice)\n'
            '- "[Event] के पीछे की असली कहानी — जो news channels नहीं दिखाएंगे" (exclusive angle)'
        ),
    }
    hook_formulas_en = {
        "storytelling": (
            '- "The truth behind [X] that history books never told you" (hidden truth)\n'
            '- "A [N]-year-old story that was never supposed to come out" (forbidden)\n'
            '- "If [X] is real, everything we know is wrong" (reality flip)'
        ),
        "mystery": (
            '- "Is [X] actually real? Science still can\'t explain it" (science gap)\n'
            '- "The [place/event] fact that will give you chills" (fear trigger)\n'
            '- "Unsolved for [N] years — we try to crack it" (time pressure)'
        ),
        "facts": (
            '- "Did you know [surprising fact]? 99% of people don\'t" (knowledge gap)\n'
            '- "[N] facts about [topic] they never taught you in school" (education gap)\n'
            '- "After this one fact, you\'ll never see [X] the same way" (perspective shift)'
        ),
        "motivation": (
            '- "90% of people make this mistake — that\'s why they fail" (majority contrast)\n'
            '- "The one small thing successful people do daily that others ignore" (insider)\n'
            '- "Stop [X] today and your life will change in [timeframe]" (transformation)'
        ),
        "devotional": (
            '- "[Ancient text] has a line that answers today\'s biggest problem" (ancient wisdom)\n'
            '- "What [Saint/Deity] did that science still can\'t explain" (divine mystery)'
        ),
        "funny": (
            '- "Only in India — [relatable situation]" (pride + relatability)\n'
            '- "That moment when [Indian scenario] — [exaggerated reaction]" (exaggeration)'
        ),
        "business": (
            '- "The one business mistake even great leaders keep making" (authority contrast)\n'
            '- "From ₹0 to [X] — the secret formula mainstream media hides" (rags-to-riches)'
        ),
        "news": (
            '- "Breaking: Nobody expected what happened with [topic] today" (urgency)\n'
            '- "The real story behind [event] — what news channels won\'t show" (exclusive)'
        ),
    }
    hi_formulas = hook_formulas_hi
    en_formulas = hook_formulas_en
    viral_formats = (
        hi_formulas.get(series.style, hi_formulas["storytelling"])
        if series.language != "en"
        else en_formulas.get(series.style, en_formulas["storytelling"])
    )

    if series.is_serialized:
        system_content = (
            f"You are a viral Instagram Reels content strategist for Indian faceless pages. Language: {lang_hint}.\n\n"
            "CRITICAL RULES:\n"
            "1. This is a SERIALIZED, CONTINUOUS episode. The narrative MUST flow directly from the previous episode's context.\n"
            "2. Avoid repeating the same information or concepts. Progress the story or lesson logically.\n"
            "3. Hook must link back to the previous episode's cliffhanger/ending while sparking curiosity in the first 3 seconds.\n"
            "4. The episode prompt must outline a clear progression in the narrative.\n\n"
            f"Use one of these viral formats:\n{viral_formats}\n\n"
            "Return ONLY the episode prompt text (2-3 sentences max). No labels, no JSON, no quotes."
        )
        force_reveal = ""
        if episode_number >= 4 and previous_episode_context:
            last_narration = previous_episode_context.get("narration") or ""
            reveal_keywords = ["ॐ", "नमः", "मंत्र है", "विद्या है", "साधना है", "जाप करें", "उच्चारण"]
            already_revealed = any(kw in last_narration for kw in reveal_keywords)
            if already_revealed:
                force_reveal = (
                    f"\n\nPOST-REVEAL MODE (Ep {episode_number}): Previous episode already delivered a specific reveal. "
                    "Do NOT repeat. Write a prompt that either: "
                    "1) Shows practical application or transformation from what was revealed, OR "
                    "2) Introduces the NEXT secret/mantra/topic in the series universe. "
                    "Progress forward, not sideways."
                )
            else:
                force_reveal = (
                    f"\n\nFORCE-REVEAL MODE (Ep {episode_number}): Prior episodes promised but never explicitly delivered. "
                    "This prompt MUST name the specific mantra/secret. "
                    "Write: 'आज हम [SPECIFIC NAME] का पूरा रहस्य उजागर करते हैं'. No vague pronouns."
                )
        if previous_episode_context:
            user_content = (
                f'Channel: "{series.name}"\n'
                f"Niche: {series.topic}\n"
                f"Content pillars: {pillars_str}\n"
                f"Style: {series.style}\n"
                f"Episode: {episode_number}\n\n"
                f"Previous Episode {previous_episode_context['episode_number']} Prompt: {previous_episode_context['prompt']}\n"
                f"Previous Episode Narration: {previous_episode_context['narration']}\n"
                + force_reveal +
                f"\n\nGenerate a continuous viral episode prompt for Ep {episode_number} that picks up directly from where the previous episode left off and advances the narrative. Be specific — name actual mantras, techniques, or people."
            )
        else:
            user_content = (
                f'Channel: "{series.name}"\n'
                f"Niche: {series.topic}\n"
                f"Content pillars: {pillars_str}\n"
                f"Style: {series.style}\n"
                f"Episode: 1 (Start of the continuous series)\n\n"
                f"Generate a viral episode prompt that serves as the starting point (Episode 1) for a continuous serialized story, introducing the core mystery/topic and setting up a narrative arc."
            )
    else:
        system_content = (
            f"You are a viral Instagram Reels content strategist for Indian faceless pages. Language: {lang_hint}.\n\n"
            "CRITICAL RULES:\n"
            "1. Each episode is COMPLETELY STANDALONE — viewer needs zero context from other episodes\n"
            "2. Hook must spark CURIOSITY or CONTROVERSY in the first 3 seconds\n"
            "3. Topic must be SHAREABLE — something viewer wants to send to friends\n"
            "4. NO serialized story — NO 'sage continues', 'next part', 'previously'\n"
            "5. Same brand/aesthetic, but each reel lives independently\n\n"
            f"Use one of these viral formats:\n{viral_formats}\n\n"
            "Return ONLY the episode prompt text (2-3 sentences max). No labels, no JSON, no quotes."
        )
        user_content = (
            f'Channel: "{series.name}"\n'
            f"Niche: {series.topic}\n"
            f"Content pillars: {pillars_str}\n"
            f"Style: {series.style}\n"
            f"Episode: {episode_number}\n\n"
            f"Recent episodes (pick a DIFFERENT pillar and angle):\n{recent_str}\n\n"
            f"Generate ONE standalone viral episode prompt for Ep {episode_number}. "
            "Pick the pillar with highest viral/curiosity potential that hasn't been covered recently."
        )

    try:
        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        resp = await client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.7 if series.is_serialized else 1.1,
            messages=[
                {
                    "role": "system",
                    "content": system_content,
                },
                {
                    "role": "user",
                    "content": user_content,
                },
            ],
            max_tokens=200,
        )
        generated_prompt = resp.choices[0].message.content.strip().strip('"').strip("'")
    except Exception as e:
        print(f"⚠️ OpenAI chat completion failed for episode generation: {e}. Using high-quality mock prompt fallback.")
        import random
        hook_templates = [
            "Why everything you were told about {niche} is wrong, and the shocking truth behind it.",
            "The untold story of {niche} that they didn't want you to find out.",
            "What successful people do daily when dealing with {niche} that others completely ignore.",
            "If you want to master {niche}, stop doing this one critical mistake immediately.",
            "The ancient secret of {niche} that answers today's biggest question."
        ]
        chosen_template = random.choice(hook_templates)
        generated_prompt = chosen_template.format(niche=pillars_str if pillars_str else series.topic)

    # Create episode row
    episode = SeriesEpisode(
        series_id=series_id,
        user_id=current_user.id,
        episode_number=episode_number,
        generated_prompt=generated_prompt,
        status="processing",
    )
    db.add(episode)

    # Create project row
    project = Project(
        user_id=current_user.id,
        input_prompt=generated_prompt,
        language=series.language,
        style=series.style,
        voice_id=series.voice_id,
        duration_target=series.duration_target,
        caption_mode=series.caption_mode,
        status="pending",
        title=f"{series.name} — Ep {episode_number}",
    )
    db.add(project)

    tx = CreditTransaction(
        user_id=current_user.id,
        delta=-cost,
        reason="series_episode",
        project_id=project.id,
    )
    db.add(tx)
    await db.flush()

    # Enqueue RQ job
    redis_conn = sync_redis.Redis.from_url(settings.REDIS_URL)
    queue = rq.Queue("default", connection=redis_conn)
    job = queue.enqueue(
        "app.workers.video_worker.process_video_job",
        project_id=str(project.id),
        prompt=generated_prompt,
        language=series.language,
        style=series.style,
        voice_id=series.voice_id,
        duration=series.duration_target,
        user_plan=current_user.plan,
        caption_mode=series.caption_mode,
        is_serialized=series.is_serialized,
        previous_episode_context=previous_episode_str,
        series_type=series.series_type,
        character_profile=series.character_profile,
        episode_number=episode_number,
        job_timeout=600,
    )

    project.job_id = job.id
    episode.project_id = project.id
    series.episode_count = episode_number
    await db.flush()

    return GenerateEpisodeResponse(episode_id=episode.id, project_id=project.id, job_id=job.id)
