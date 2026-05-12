import asyncio
import httpx
import tempfile
from pathlib import Path
from app.config import settings
from app.services.ai.muapi_client import MuAPIClient



async def generate_video_clip(
    visual_keyword: str,
    duration: int = 5,
    use_premium: bool = False,
) -> str:
    """Generate a single video clip. Returns path to downloaded MP4. Falls back to local colored canvas on failure."""
    import subprocess
    import os
    
    is_unconfigured = (
        not settings.MUAPI_API_KEY
        or settings.MUAPI_API_KEY in ("", "...", "sk-...")
        or len(settings.MUAPI_API_KEY) < 5
    )

    # Map visual keywords/themes to beautiful premium color hexes
    kw = visual_keyword.lower()
    color = "0x1A1A2E" # Slate Navy (Default)
    if any(x in kw for x in ["funny", "comedy", "joke"]):
        color = "0xFF6B35" # Vibrant Orange
    elif any(x in kw for x in ["devotional", "spiritual", "shloka", "temple", "ram"]):
        color = "0xFFD700" # Golden Amber
    elif any(x in kw for x in ["motivation", "inspire", "success", "hustle"]):
        color = "0xE74C3C" # Fire Red
    elif any(x in kw for x in ["business", "tips", "marketing"]):
        color = "0x2C3E50" # Deep Corporate Slate
    elif any(x in kw for x in ["news", "breaking", "update"]):
        color = "0x2980B9" # Newsroom Blue

    if is_unconfigured:
        print(f"⚠️ MuAPI unconfigured. Generating local colored vertical clip for '{visual_keyword}' using ffmpeg.")
        tmp_path = Path(tempfile.mktemp(suffix=".mp4"))
        try:
            # Generate a gorgeous solid color vertical canvas
            subprocess.run([
                "ffmpeg", "-y", "-f", "lavfi", "-i", f"color=c={color}:size=720x1280:rate=25",
                "-t", str(duration), "-pix_fmt", "yuv420p", str(tmp_path)
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return str(tmp_path)
        except Exception as e:
            print(f"⚠️ Failed to generate local vertical clip using ffmpeg: {e}")
            # Try basic fallback if custom filter errors
            tmp_path.write_bytes(b"")
            return str(tmp_path)

    try:
        client = MuAPIClient()
        model = "veo3-text-to-video" if use_premium else "wan2.1-text-to-video"

        prompt = (
            f"Cinematic vertical 9:16 video: {visual_keyword}. "
            "No text, no subtitles, no logos. Smooth camera movement. "
            f"Indian context preferred. Duration: {duration} seconds. Photorealistic."
        )

        result = await client.run(
            endpoint=model,
            payload={
                "prompt": prompt,
                "duration": duration,
            },
        )

        outputs = result.get("outputs", [])
        video_url = outputs[0] if outputs else None
        if not video_url:
            raise Exception(f"No video URL in MuAPI response: {result}")
        tmp_path = Path(tempfile.mktemp(suffix=".mp4"))

        async with httpx.AsyncClient(timeout=180) as http:
            response = await http.get(video_url)
            response.raise_for_status()
            tmp_path.write_bytes(response.content)

        return str(tmp_path)
    except Exception as e:
        print(f"⚠️ MuAPI video clip generation failed: {e}. Falling back to local vertical clip of {duration}s.")
        tmp_path = Path(tempfile.mktemp(suffix=".mp4"))
        try:
            subprocess.run([
                "ffmpeg", "-y", "-f", "lavfi", "-i", f"color=c={color}:size=720x1280:rate=25",
                "-t", str(duration), "-pix_fmt", "yuv420p", str(tmp_path)
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return str(tmp_path)
        except Exception as fe:
            print(f"⚠️ Local ffmpeg video backup failed: {fe}")
            tmp_path.write_bytes(b"")
            return str(tmp_path)



async def generate_all_clips(
    visual_keywords: list[str],
    scene_durations: list[int],
    use_premium: bool = False,
) -> list[str]:
    """Generate all clips in parallel."""
    tasks = [
        generate_video_clip(kw, dur, use_premium)
        for kw, dur in zip(visual_keywords, scene_durations)
    ]
    return list(await asyncio.gather(*tasks))
