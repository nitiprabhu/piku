import asyncio
import subprocess
import tempfile
from pathlib import Path
from app.config import settings
from app.services.ai.providers import get_video_provider, get_max_clips


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


def _build_prompt(visual_keyword: str, duration: int, style: str, image_style: str) -> str:
    style_descriptors = {
        "anime": "anime art style, cel-shaded, vibrant colors, Studio Ghibli aesthetic",
        "illustrated": "illustrated storybook art, detailed hand-drawn look, painterly",
        "realistic": "photorealistic, hyperdetailed, 8K, natural lighting",
        "cinematic": "cinematic film look, dramatic lighting, shallow depth of field",
    }
    visual_descriptor = style_descriptors.get(image_style, style_descriptors["cinematic"])
    if style == "storytelling":
        return (
            f"{visual_keyword}. "
            f"Vertical 9:16, no text, no subtitles, no logos. {visual_descriptor}. "
            f"Slow cinematic camera pan. Duration: {duration} seconds. "
            "Mythological Indian aesthetic, dramatic atmospheric lighting."
        )
    return (
        f"Vertical 9:16 video: {visual_keyword}. "
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
) -> str:
    """Generate a single video clip. Returns path to local MP4."""
    color = _theme_color(visual_keyword, style)
    provider = get_video_provider(use_premium=use_premium, plan=plan)

    if not provider.is_configured:
        print(
            f"[{type(provider).__name__}] not configured — generating colored canvas for '{visual_keyword}'"
        )
        return _fallback_clip(color, duration)

    prompt = _build_prompt(visual_keyword, duration, style, image_style)
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
) -> list[str]:
    """Generate all clips in parallel, capped by plan tier."""
    max_clips = get_max_clips(plan)
    keywords = visual_keywords[:max_clips]
    durations = scene_durations[:max_clips]
    print(f"[video] plan={plan} max_clips={max_clips} generating {len(keywords)} clips")
    tasks = [
        generate_video_clip(kw, dur, use_premium, style, image_style, plan)
        for kw, dur in zip(keywords, durations)
    ]
    return list(await asyncio.gather(*tasks))
