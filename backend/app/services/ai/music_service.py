import httpx
import tempfile
from pathlib import Path
from app.config import settings
from app.services.ai.muapi_client import MuAPIClient


STYLE_TO_MUSIC = {
    "funny":      ("upbeat fun comedic background music, no vocals, light and bouncy", "comedy pop"),
    "devotional": ("peaceful Indian devotional instrumental, bhajan style, calm and serene", "indian classical"),
    "motivation": ("inspiring cinematic background music, uplifting orchestral, no vocals", "cinematic orchestral"),
    "business":   ("professional corporate background music, subtle and clean, no vocals", "corporate ambient"),
    "news":       ("neutral news background music, informative tone, no vocals", "news ambient"),
}


async def generate_background_music(style: str, duration: int) -> str:
    """Generate background music via MuAPI Suno. Returns path to downloaded MP3. Falls back to ffmpeg ambient generator on failure."""
    import subprocess
    
    is_unconfigured = (
        not settings.MUAPI_API_KEY
        or settings.MUAPI_API_KEY in ("", "...", "sk-...")
        or len(settings.MUAPI_API_KEY) < 5
    )

    if is_unconfigured:
        print(f"⚠️ MuAPI API Key unconfigured. Generating local {duration}s ambient background music loop using ffmpeg.")
        tmp_path = Path(tempfile.mktemp(suffix=".mp3"))
        try:
            # Generate soft pink noise or a low harmonic drone
            subprocess.run([
                "ffmpeg", "-y", "-f", "lavfi", "-i", f"anoisesrc=color=brown:d={duration}",
                "-acodec", "libmp3lame", str(tmp_path)
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return str(tmp_path)
        except Exception as e:
            print(f"⚠️ Failed to generate local background music: {e}. Falling back to empty mp3.")
            tmp_path.write_bytes(b"")
            return str(tmp_path)

    try:
        client = MuAPIClient()
        prompt_text, style_tag = STYLE_TO_MUSIC.get(style, STYLE_TO_MUSIC["motivation"])

        result = await client.run(
            endpoint="suno-create-music",
            payload={
                "prompt": f"{prompt_text}, loop-friendly, background track",
                "style": style_tag,
                "duration": min(duration + 5, 30),
                "instrumental": True,
            },
        )

        print(f"🔍 MuAPI Music result keys: {list(result.keys())} | outputs={result.get('outputs')} | full={result}")
        outputs = result.get("outputs", [])
        music_url = outputs[0] if outputs else None
        if not music_url:
            raise Exception(f"No audio URL in Suno response: {result}")
        tmp_path = Path(tempfile.mktemp(suffix=".mp3"))

        async with httpx.AsyncClient(timeout=60) as http:
            response = await http.get(music_url)
            response.raise_for_status()
            content_type = response.headers.get("content-type", "")
            if content_type and not content_type.startswith("audio/"):
                raise Exception(f"MuAPI returned non-audio content-type '{content_type}' for music (url={music_url}). outputs={outputs}")
            tmp_path.write_bytes(response.content)

        return str(tmp_path)
    except Exception as e:
        print(f"⚠️ MuAPI music generation failed: {e}. Falling back to local ffmpeg ambient track.")
        tmp_path = Path(tempfile.mktemp(suffix=".mp3"))
        try:
            subprocess.run([
                "ffmpeg", "-y", "-f", "lavfi", "-i", f"anoisesrc=color=brown:d={duration}",
                "-acodec", "libmp3lame", str(tmp_path)
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return str(tmp_path)
        except Exception as fe:
            print(f"⚠️ Local ffmpeg music backup failed: {fe}")
            tmp_path.write_bytes(b"")
            return str(tmp_path)

