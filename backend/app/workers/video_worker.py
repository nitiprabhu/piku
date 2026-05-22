import asyncio
import tempfile
import shutil
import json
from pathlib import Path

import redis
import rq

from app.config import settings

redis_client = redis.Redis.from_url(settings.REDIS_URL)


def publish_progress(job_id: str, step: str, percent: int, **kwargs):
    """Publish progress update to Redis pub/sub channel."""
    payload = {"event": "progress", "step": step, "percent": percent, **kwargs}
    redis_client.publish(f"job:{job_id}", json.dumps(payload))
    # Also cache for HTTP polling fallback (1 hour TTL)
    redis_client.setex(f"job_status:{job_id}", 3600, json.dumps(payload))


def process_video_job(
    project_id: str,
    prompt: str,
    language: str,
    style: str,
    voice_id: str,
    duration: int,
    user_plan: str,
    character: str | None = None,
    image_style: str = "cinematic",    # P3
    caption_mode: str = "full_sentence",  # P4
):
    """Main RQ worker function — orchestrates full video generation pipeline."""
    from app.database import AsyncSessionLocal
    from app.models.project import Project
    from app.services.ai.script_generator import generate_script
    from app.services.ai.tts_service import generate_voice
    from app.services.ai.video_service import generate_all_clips
    from app.services.ai.music_service import generate_background_music
    from app.services.video.composer import compose_video
    from app.services.video.thumbnail import extract_thumbnail
    from app.services.storage.r2_client import upload_to_r2
    from app.services.viral_score import calculate_viral_score
    from sqlalchemy import select
    import sqlalchemy

    # Get the RQ job id for progress channel
    job = rq.get_current_job()
    job_id = job.id if job else project_id

    # Use sync SQLAlchemy for worker (RQ is sync)
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(settings.SYNC_DATABASE_URL, pool_pre_ping=True)
    Session = sessionmaker(engine)
    db = Session()

    tmp_dir = None
    try:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise Exception(f"Project {project_id} not found")

        project.status = "processing"
        project.job_id = job_id
        db.commit()

        # P3: VEO3 for pro users OR first 3 videos for any user (hook on quality)
        use_premium = user_plan in ("pro", "starter", "business")
        if not use_premium:
            videos_done = db.execute(
                __import__("sqlalchemy", fromlist=["text"]).text(
                    "SELECT videos_generated FROM users WHERE id = :id"
                ),
                {"id": str(project.user_id)},
            ).scalar() or 0
            use_premium = videos_done < 3

        tmp_dir = Path(tempfile.mkdtemp())

        # ── Step 1: Script ─────────────────────────────────────────────
        publish_progress(job_id, "generating_script", 10)
        script = asyncio.run(generate_script(prompt, language, style, duration, character=character))
        project.script_json = script
        db.commit()
        publish_progress(job_id, "script_done", 20)

        # ── Step 2: TTS + Music (parallel) ─────────────────────────────
        publish_progress(job_id, "generating_voice", 25)

        async def _gen_audio():
            return await asyncio.gather(
                generate_voice(script["narration"], voice_id),
                generate_background_music(style, duration),
            )

        voice_path, music_path = asyncio.run(_gen_audio())
        publish_progress(job_id, "voice_done", 40)

        # ── Step 3: Video Clips ────────────────────────────────────────
        publish_progress(job_id, "generating_visuals", 45)
        visual_keywords = script.get("visual_keywords", [prompt])[:6]
        scene_durations = [
            s.get("duration", max(duration // len(visual_keywords), 3))
            for s in script.get("scenes", [{}] * len(visual_keywords))[:6]
        ]
        # Pad if needed
        while len(scene_durations) < len(visual_keywords):
            scene_durations.append(5)

        video_clips = asyncio.run(
            generate_all_clips(visual_keywords, scene_durations, use_premium, style, image_style, user_plan)
        )
        publish_progress(job_id, "visuals_done", 70)

        # ── Step 4: FFmpeg Composition ─────────────────────────────────
        publish_progress(job_id, "composing", 75)
        output_path = str(tmp_dir / "final_video.mp4")
        _wm_asset = Path(__file__).parent.parent.parent / "assets" / "watermark.png"

        from app.models.user import User as UserModel
        user_obj = db.query(UserModel).filter(UserModel.id == project.user_id).first()
        show_overlay = user_obj and getattr(user_obj, "show_social_overlay", True)
        ig_handle = user_obj.instagram_handle if (user_obj and show_overlay) else None
        yt_handle = user_obj.youtube_handle if (user_obj and show_overlay) else None

        # Watermark only on free plan — conversion nudge to upgrade
        is_free = not user_obj or (user_obj.plan or "free") == "free"
        effective_watermark = str(_wm_asset) if (is_free and _wm_asset.exists()) else None

        compose_video(
            video_clips=video_clips,
            voice_path=voice_path,
            music_path=music_path,
            script=script,
            output_path=output_path,
            watermark_path=effective_watermark,
            style=style,
            instagram_handle=ig_handle,
            youtube_handle=yt_handle,
            caption_mode=caption_mode,
        )
        publish_progress(job_id, "composing", 85)

        # ── Step 5: Thumbnail + Upload ─────────────────────────────────
        thumbnail_path = str(tmp_dir / "thumbnail.jpg")
        try:
            extract_thumbnail(output_path, thumbnail_path, at_second=2)
        except Exception as thumb_err:
            print(f"⚠️ Thumbnail extraction failed, continuing without it: {thumb_err}")
            thumbnail_path = None

        video_url = asyncio.run(
            upload_to_r2(output_path, f"videos/{project_id}/final.mp4")
        )
        thumbnail_url = asyncio.run(
            upload_to_r2(thumbnail_path, f"videos/{project_id}/thumb.jpg")
        ) if thumbnail_path else None

        # ── Step 6: Viral Score + Save ─────────────────────────────────
        viral_score = calculate_viral_score(script, duration, style)

        project.status = "completed"
        project.video_url = video_url
        project.thumbnail_url = thumbnail_url
        project.viral_score = viral_score
        project.caption_text = script.get("caption", "")
        project.hashtags = script.get("hashtags", [])
        project.caption_mode = caption_mode

        # Sync series episode status
        from app.models.series import SeriesEpisode
        ep = db.query(SeriesEpisode).filter(SeriesEpisode.project_id == project_id).first()
        if ep:
            ep.status = "completed"

        # P3: increment videos_generated counter for VEO3 first-3 hook
        from sqlalchemy import text as sa_text2
        db.execute(
            sa_text2("UPDATE users SET videos_generated = videos_generated + 1 WHERE id = :id"),
            {"id": str(project.user_id)},
        )

        db.commit()

        publish_progress(
            job_id, "completed", 100,
            event="completed",
            video_url=video_url,
            thumbnail_url=thumbnail_url,
            viral_score=viral_score,
        )

    except Exception as e:
        import traceback
        err = f"{type(e).__name__}: {e}\n{traceback.format_exc()[-500:]}"
        if 'project' in dir():
            project.status = "failed"
            project.error_message = err[:1000]
            # Refund the credit that was deducted before enqueue
            from sqlalchemy import text as sa_text
            db.execute(
                sa_text("UPDATE users SET credits = credits + 1 WHERE id = :id"),
                {"id": str(project.user_id)},
            )
            # Sync series episode status
            from app.models.series import SeriesEpisode
            ep = db.query(SeriesEpisode).filter(SeriesEpisode.project_id == project_id).first()
            if ep:
                ep.status = "failed"
            db.commit()
        publish_progress(job_id, "failed", 0, event="failed", error=str(e))
        raise

    finally:
        db.close()
        # Cleanup temp files
        if tmp_dir and tmp_dir.exists():
            shutil.rmtree(str(tmp_dir), ignore_errors=True)
