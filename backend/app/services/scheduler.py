"""
APScheduler-based auto-scheduling for Series (P1).
Runs every minute, finds series with next_run_at <= now, triggers episode generation.
"""
import logging
from datetime import datetime, timezone, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select, text

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")

INTERVAL_MAP = {
    "daily": timedelta(days=1),
    "every_3_days": timedelta(days=3),
    "weekly": timedelta(weeks=1),
}


async def check_series_schedules():
    """Find all series due for auto-generation and trigger episode creation."""
    from app.database import AsyncSessionLocal
    from app.models.series import Series

    now = datetime.now(timezone.utc)

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

    # Check user credits atomically
    result = await db.execute(
        text("UPDATE users SET credits = credits - 1 WHERE id = :id AND credits > 0 RETURNING credits"),
        {"id": str(series.user_id)},
    )
    if result.fetchone() is None:
        logger.info(f"Series {series.id}: user {series.user_id} has no credits, skipping auto-schedule")
        _advance_next_run(series)
        return

    # Fetch last 10 episode prompts for continuity
    prior_result = await db.execute(
        select(SeriesEpisode.generated_prompt)
        .where(SeriesEpisode.series_id == series.id)
        .order_by(SeriesEpisode.episode_number.desc())
        .limit(10)
    )
    prior_prompts = list(reversed([r[0] for r in prior_result.fetchall()]))

    episode_number = series.episode_count + 1
    prior_context = (
        "\n".join(f"Ep {i+1}: {p}" for i, p in enumerate(prior_prompts))
        if prior_prompts else "None yet."
    )

    client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    resp = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You generate focused video prompts for Indian short-form content series. Return ONLY the prompt text."},
            {"role": "user", "content": (
                f'Series: "{series.name}"\nUniverse/Topic: {series.topic}\n'
                f'Style: {series.style}\nEpisode: {episode_number}\n\n'
                f'Previous episodes (avoid repeating):\n{prior_context}\n\n'
                f'Generate ONE focused video prompt for episode {episode_number}. '
                'New angle, same universe. Continue narrative arc.'
            )},
        ],
        temperature=1.0,
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

    tx = CreditTransaction(user_id=series.user_id, delta=-1, reason="series_auto", project_id=project.id)
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
        job_timeout=600,
    )

    project.job_id = job.id
    episode.project_id = project.id
    series.episode_count = episode_number
    series.last_run_at = datetime.now(timezone.utc)
    _advance_next_run(series)

    logger.info(f"Auto-scheduled episode {episode_number} for series {series.id} (job {job.id})")


def _advance_next_run(series):
    """Update next_run_at based on schedule_type."""
    delta = INTERVAL_MAP.get(series.schedule_type)
    if delta:
        series.next_run_at = datetime.now(timezone.utc) + delta


def compute_next_run_at(schedule_type: str, schedule_time: str) -> datetime | None:
    """Compute the next UTC datetime for a given schedule_type and HH:MM time."""
    if schedule_type == "manual":
        return None
    delta = INTERVAL_MAP.get(schedule_type, timedelta(days=1))
    now = datetime.now(timezone.utc)
    try:
        h, m = [int(x) for x in schedule_time.split(":")]
    except Exception:
        h, m = 9, 0
    # Next occurrence of HH:MM UTC
    candidate = now.replace(hour=h, minute=m, second=0, microsecond=0)
    if candidate <= now:
        candidate += timedelta(days=1)
    # But cap at delta from now
    capped = now + delta
    return min(candidate, capped)
