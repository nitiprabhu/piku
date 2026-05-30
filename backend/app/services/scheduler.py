"""
APScheduler-based auto-scheduling for Series (P1).
Runs every minute, finds series with next_run_at <= now, triggers episode generation.
"""
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select, text

logger = logging.getLogger(__name__)

IST = ZoneInfo("Asia/Kolkata")
scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")

INTERVAL_MAP = {
    "daily": timedelta(days=1),
    "every_3_days": timedelta(days=3),
    "weekly": timedelta(weeks=1),
}


async def check_series_schedules():
    """Find all series due for auto-generation and trigger episode creation."""
    from app.database import AsyncSessionLocal
    from app.models.series import Series

    now = datetime.now(IST)

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Series).where(
                Series.is_deleted == False,
                Series.schedule_type != "manual",
                Series.next_run_at <= now,
            )
        )
        due_series = result.scalars().all()

        for series in due_series:
            try:
                await _trigger_episode(series, db)
            except Exception as e:
                logger.warning(f"Auto-schedule failed for series {series.id}: {e}")

        await db.commit()


async def _trigger_episode(series, db):
    """Generate next episode for a series (scheduler path, no HTTP request needed)."""
    import openai
    import redis as sync_redis
    import rq

    from app.config import settings
    from app.models.user import User
    from app.models.project import Project
    from app.models.series import SeriesEpisode
    from app.models.publish_job import CreditTransaction

    cost = 5 if (series.series_type or "regular") == "ai_influencer" else 1

    # Check user credits atomically
    result = await db.execute(
        text("UPDATE users SET credits = credits - :cost WHERE id = :id AND credits >= :cost RETURNING credits"),
        {"id": str(series.user_id), "cost": cost},
    )
    if result.fetchone() is None:
        logger.info(f"Series {series.id}: user {series.user_id} has no credits, skipping auto-schedule")
        _advance_next_run(series)
        return

    episode_number = series.episode_count + 1

    # Fetch last 5 episodes with narration for prompt generator + last 3 for script generator
    from app.models.project import Project
    last_eps_result = await db.execute(
        select(SeriesEpisode, Project)
        .join(Project, SeriesEpisode.project_id == Project.id, isouter=True)
        .where(SeriesEpisode.series_id == series.id)
        .order_by(SeriesEpisode.episode_number.desc())
        .limit(5)
    )
    last_ep_rows = list(reversed(last_eps_result.fetchall()))

    # Build prior context for prompt generator (with narration so GPT knows what was ACTUALLY delivered)
    prior_context_parts = []
    for ep, proj in last_ep_rows:
        narration = ""
        if proj and proj.script_json:
            narration = (proj.script_json.get("narration", "") or "")[:150]
        prior_context_parts.append(
            f"Ep {ep.episode_number} Prompt: {ep.generated_prompt}\n"
            f"Ep {ep.episode_number} Narration: {narration}"
        )
    prior_context = "\n\n".join(prior_context_parts) if prior_context_parts else "None yet."

    # Build last 3 episodes context for script generator
    previous_episode_str = None
    if series.is_serialized and last_ep_rows:
        script_rows = last_ep_rows[-3:]
        parts = []
        for ep, proj in script_rows:
            narration = ""
            if proj and proj.script_json:
                narration = (proj.script_json.get("narration", "") or "")[:200]
            parts.append(
                f"Episode {ep.episode_number} Prompt: {ep.generated_prompt}\n"
                f"Episode {ep.episode_number} Narration: {narration}"
            )
        previous_episode_str = "\n\n".join(parts)

    # Smart mode: detect whether prior episodes already delivered a reveal or are still teasing
    force_reveal_instruction = ""
    if episode_number >= 4:
        # Check if recent narrations contain specific named content (reveal already happened)
        recent_narrations = " ".join(
            (proj.script_json.get("narration", "") or "") if proj and proj.script_json else ""
            for _, proj in last_ep_rows[-3:]
        )
        # Heuristic: if narration has Sanskrit-style content or specific names, treat as revealed
        reveal_keywords = ["ॐ", "नमः", "मंत्र है", "विद्या है", "साधना है", "जाप करें", "उच्चारण"]
        already_revealed = any(kw in recent_narrations for kw in reveal_keywords)

        if already_revealed:
            force_reveal_instruction = (
                f"\n\nPOST-REVEAL MODE (episode {episode_number}): The previous episodes already revealed a specific mantra/secret. "
                "Do NOT repeat the same reveal. Instead write a prompt that: "
                "1) Builds on what was revealed — practical application, deeper practice technique, real-life transformation stories, OR "
                "2) Moves to the NEXT secret/mantra/topic in the series universe. "
                "The prompt must feel like natural progression, not a repeat. Be specific — name a new angle or new practice."
            )
        else:
            force_reveal_instruction = (
                f"\n\nFORCE-REVEAL MODE (episode {episode_number}): Prior episodes promised but never explicitly delivered a reveal. "
                "This prompt MUST name the specific mantra, secret, or answer. "
                "Write: 'आज हम [SPECIFIC NAME] का पूरा रहस्य उजागर करते हैं'. "
                "Choose a real Vedic/spiritual answer. Do NOT use vague pronouns like 'यह मंत्र', 'वह रहस्य'."
            )

    client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": (
                "You generate focused video prompts for Indian short-form content series. "
                "Return ONLY the prompt text (2-3 sentences). No labels, no JSON.\n"
                "CRITICAL: Read the previous episode narrations carefully to know what was ACTUALLY revealed vs just promised. "
                "Never repeat a promise that was already made and not delivered."
            )},
            {"role": "user", "content": (
                f'Series: "{series.name}"\nUniverse/Topic: {series.topic}\n'
                f'Style: {series.style}\nEpisode: {episode_number}\n\n'
                f'Previous episodes with actual content delivered:\n{prior_context}'
                + force_reveal_instruction +
                f'\n\nGenerate ONE focused video prompt for episode {episode_number}. '
                'Be specific — name actual mantras, places, people, or techniques, not vague references.'
            )},
        ],
        temperature=0.7,
        max_tokens=300,
    )
    generated_prompt = resp.choices[0].message.content.strip().strip('"').strip("'")

    episode = SeriesEpisode(
        series_id=series.id,
        user_id=series.user_id,
        episode_number=episode_number,
        generated_prompt=generated_prompt,
        status="processing",
    )
    db.add(episode)

    project = Project(
        user_id=series.user_id,
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

    tx = CreditTransaction(user_id=series.user_id, delta=-cost, reason="series_auto", project_id=project.id)
    db.add(tx)
    await db.flush()

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
        user_plan="free",
        caption_mode=series.caption_mode,
        is_serialized=series.is_serialized,
        previous_episode_context=previous_episode_str,
        series_type=getattr(series, "series_type", "regular"),
        character_profile=getattr(series, "character_profile", None),
        episode_number=episode_number,
        job_timeout=600,
    )

    project.job_id = job.id
    episode.project_id = project.id
    series.episode_count = episode_number
    series.last_run_at = datetime.now(IST)
    _advance_next_run(series)

    logger.info(f"Auto-scheduled episode {episode_number} for series {series.id} (job {job.id})")


def _advance_next_run(series):
    """Update next_run_at based on schedule_type."""
    delta = INTERVAL_MAP.get(series.schedule_type)
    if delta:
        series.next_run_at = datetime.now(IST) + delta


def compute_next_run_at(schedule_type: str, schedule_time: str) -> datetime | None:
    """Compute the next UTC datetime for a given schedule_type and HH:MM time."""
    if schedule_type == "manual":
        return None
    delta = INTERVAL_MAP.get(schedule_type, timedelta(days=1))
    now = datetime.now(IST)
    try:
        h, m = [int(x) for x in schedule_time.split(":")]
    except Exception:
        h, m = 9, 0
    # Next occurrence of HH:MM IST
    candidate = now.replace(hour=h, minute=m, second=0, microsecond=0)
    if candidate <= now:
        candidate += timedelta(days=1)
    # But cap at delta from now
    capped = now + delta
    return min(candidate, capped)
