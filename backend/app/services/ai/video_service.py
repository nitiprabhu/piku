import asyncio
import subprocess
import tempfile
from pathlib import Path
from app.config import settings
from app.services.ai.providers import get_video_provider, get_max_clips


async def generate_image_clip(
    scene_visual: str,
    duration: int = 5,
    style: str = "motivation",
    image_style: str = "cinematic",
    scene_index: int = 0,
    series_type: str = "regular",
    character_profile: dict | None = None,
    plan: str = "free",
    first_scene_visual: str | None = None,
) -> str:
    """Generate a clip via AI image + Ken Burns effect. ~$0.003/scene vs $0.09 for WAN2.1."""
    from app.services.ai.image_service import generate_image_for_scene
    from app.services.video.ken_burns import image_to_clip

    image_path = await generate_image_for_scene(
        scene_visual, style, series_type=series_type, character_profile=character_profile,
        plan=plan, scene_index=scene_index, first_scene_visual=first_scene_visual
    )
    # Ken Burns is CPU-bound subprocess — run in thread to not block event loop
    return await asyncio.to_thread(image_to_clip, image_path, duration, scene_index)


def _fallback_clip(color: str, duration: int) -> str:
    """Generate a solid-color vertical canvas via ffmpeg when AI provider is unavailable."""
    tmp = Path(tempfile.mktemp(suffix=".mp4"))
    try:
        subprocess.run(
            [
                "ffmpeg", "-y", "-f", "lavfi",
                "-i", f"color=c={color}:size=720x1280:rate=25",
                "-t", str(duration), "-pix_fmt", "yuv420p", str(tmp),
            ],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
    except Exception as e:
        print(f"ffmpeg fallback failed: {e}")
        tmp.write_bytes(b"")
    return str(tmp)


def _theme_color(visual_keyword: str, style: str) -> str:
    kw = visual_keyword.lower()
    if style == "storytelling":
        return "0x2D1B4E"
    if any(x in kw for x in ["funny", "comedy", "joke"]):
        return "0xFF6B35"
    if any(x in kw for x in ["devotional", "spiritual", "shloka", "temple", "ram"]):
        return "0xFFD700"
    if any(x in kw for x in ["motivation", "inspire", "success", "hustle"]):
        return "0xE74C3C"
    if any(x in kw for x in ["business", "tips", "marketing"]):
        return "0x2C3E50"
    if any(x in kw for x in ["news", "breaking", "update"]):
        return "0x2980B9"
    return "0x1A1A2E"


def _build_prompt(
    visual_keyword: str,
    duration: int,
    style: str,
    image_style: str,
    series_type: str = "regular",
    character_profile: dict | None = None
) -> str:
    style_descriptors = {
        "anime": "anime art style, cel-shaded, vibrant colors, Studio Ghibli aesthetic",
        "illustrated": "illustrated storybook art, detailed hand-drawn look, painterly",
        "realistic": "photorealistic, hyperdetailed, 8K, natural lighting",
        "cinematic": "cinematic film look, dramatic lighting, shallow depth of field",
    }
    visual_descriptor = style_descriptors.get(image_style, style_descriptors["cinematic"])
    
    from app.services.ai.image_service import build_character_anchor_prompt
    anchor = build_character_anchor_prompt(character_profile)
    if series_type == "ai_influencer" and anchor:
        clothing = character_profile.get("clothing_style")
        if clothing:
            anchor = f"{anchor}, wearing {clothing}"
        prefix = f"A vertical 9:16 video of {anchor}. "
    else:
        prefix = ""

    if series_type == "ai_influencer" or style in ["daily_routine", "outfit_check", "dance_trend", "travel_vlog", "product_review"]:
        motion_descriptors = {
            "daily_routine": "handheld vlog style movement, smooth natural camera motion, close-up transitions, high energy",
            "outfit_check": "aesthetic mirror selfie panning, smooth zoom-in details on fabric, dynamic spin reveal",
            "dance_trend": "energetic dynamic camera movement, high energy motion, steady tracking shot following the dancer",
            "travel_vlog": "breathtaking drone pan, cinematic slow tracking shot walking forward, golden hour panning",
            "product_review": "macro close-up pan, smooth slow dolly-in towards product, satisfying hand unboxing movement",
        }
        motion = motion_descriptors.get(style, "smooth handheld camera movement, vlogging style, high energy")
        return (
            f"{prefix}{visual_keyword}. "
            f"Vertical 9:16, no text, no subtitles, no logos. {visual_descriptor}. "
            f"{motion}. Duration: {duration} seconds."
        )

    if style == "storytelling":
        return (
            f"{prefix}{visual_keyword}. "
            f"Vertical 9:16, no text, no subtitles, no logos. {visual_descriptor}. "
            f"Slow cinematic camera pan. Duration: {duration} seconds. "
            "Mythological Indian aesthetic, dramatic atmospheric lighting."
        )
    return (
        f"{prefix}Vertical 9:16 video: {visual_keyword}. "
        f"No text, no subtitles, no logos. {visual_descriptor}. "
        f"Smooth camera movement. Indian context preferred. Duration: {duration} seconds."
    )


async def generate_video_clip(
    visual_keyword: str,
    duration: int = 5,
    use_premium: bool = False,
    style: str = "motivation",
    image_style: str = "cinematic",
    plan: str = "free",
    series_type: str = "regular",
    character_profile: dict | None = None,
) -> str:
    """Generate a single video clip. Returns path to local MP4."""
    color = _theme_color(visual_keyword, style)
    provider = get_video_provider(use_premium=use_premium, plan=plan)

    if not provider.is_configured:
        print(
            f"[{type(provider).__name__}] not configured — generating colored canvas for '{visual_keyword}'"
        )
        return _fallback_clip(color, duration)

    prompt = _build_prompt(
        visual_keyword, duration, style, image_style,
        series_type=series_type, character_profile=character_profile
    )
    try:
        return await provider.generate_clip(prompt, duration)
    except Exception as e:
        print(f"[{type(provider).__name__}] failed: {e} — falling back to colored canvas")
        return _fallback_clip(color, duration)


async def generate_all_clips(
    visual_keywords: list[str],
    scene_durations: list[int],
    use_premium: bool = False,
    style: str = "motivation",
    image_style: str = "cinematic",
    plan: str = "free",
    series_type: str = "regular",
    character_profile: dict | None = None,
) -> list[str]:
    """Generate all clips in parallel, capped by plan tier."""
    max_clips = get_max_clips(plan)
    keywords = visual_keywords[:max_clips]
    durations = scene_durations[:max_clips]
    print(f"[video] plan={plan} max_clips={max_clips} provider={settings.VIDEO_PROVIDER} generating {len(keywords)} clips")

    first_scene_visual = keywords[0] if keywords else None

    # Image + Ken Burns pipeline: ~$0.003/clip vs $0.09 for WAN2.1
    if settings.VIDEO_PROVIDER.lower() == "image":
        tasks = [
            generate_image_clip(
                kw, dur, style, image_style, i,
                series_type=series_type, character_profile=character_profile,
                plan=plan, first_scene_visual=first_scene_visual
            )
            for i, (kw, dur) in enumerate(zip(keywords, durations))
        ]
        return list(await asyncio.gather(*tasks))

    # WAN2.1 / fal.ai video pipeline (expensive, higher motion quality)
    tasks = [
        generate_video_clip(
            kw, dur, use_premium, style, image_style, plan,
            series_type=series_type, character_profile=character_profile
        )
        for kw, dur in zip(keywords, durations)
    ]
    return list(await asyncio.gather(*tasks))
