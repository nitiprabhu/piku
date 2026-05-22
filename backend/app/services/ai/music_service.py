import asyncio
import httpx
import subprocess
import tempfile
from pathlib import Path
from app.config import settings
from app.services.ai.muapi_client import MuAPIClient


STYLE_TO_MUSIC = {
    "funny":       ("upbeat fun comedic background music, no vocals, light and bouncy", "comedy pop"),
    "devotional":  ("peaceful Indian devotional instrumental, bhajan style, calm and serene", "indian classical"),
    "motivation":  ("inspiring cinematic background music, uplifting orchestral, no vocals", "cinematic orchestral"),
    "business":    ("professional corporate background music, subtle and clean, no vocals", "corporate ambient"),
    "news":        ("neutral news background music, informative tone, no vocals", "news ambient"),
    "storytelling":("dramatic cinematic storytelling music, epic and emotional, no vocals", "cinematic epic"),
}

# Music is style-only — same track reused across all videos of that style.
# Cache lives at app/static/music_cache/{style}.mp3 (persistent across restarts).
_CACHE_DIR = Path(__file__).parent.parent.parent / "static" / "music_cache"
_CACHE_LOCKS: dict[str, asyncio.Lock] = {}


def _cache_path(style: str) -> Path:
    _CACHE_DIR.mkdir(parents=True, exist_ok=True)
    return _CACHE_DIR / f"{style}.mp3"


def _get_lock(style: str) -> asyncio.Lock:
    if style not in _CACHE_LOCKS:
        _CACHE_LOCKS[style] = asyncio.Lock()
    return _CACHE_LOCKS[style]


def _ffmpeg_fallback(duration: int) -> str:
    tmp = Path(tempfile.mktemp(suffix=".mp3"))
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-f", "lavfi", "-i", f"anoisesrc=color=brown:d={duration}",
             "-acodec", "libmp3lame", str(tmp)],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
    except Exception as e:
        print(f"ffmpeg music fallback failed: {e}")
        tmp.write_bytes(b"")
    return str(tmp)


async def generate_background_music(style: str, duration: int) -> str:
    """
    Returns path to an MP3 for the given style.
    First call per style: generates via Suno and caches to disk.
    Subsequent calls: returns cached file instantly (₹0 cost).
    Falls back to ffmpeg brown noise if MuAPI unconfigured or fails.
    """
    cached = _cache_path(style)

    # Fast path: cache hit — no API call, no cost
    if cached.exists() and cached.stat().st_size > 1000:
        return str(cached)

    is_unconfigured = (
        not settings.MUAPI_API_KEY
        or settings.MUAPI_API_KEY in ("", "...", "sk-...")
        or len(settings.MUAPI_API_KEY) < 5
    )

    if is_unconfigured:
        print(f"MuAPI unconfigured — using ffmpeg ambient for style={style}")
        return _ffmpeg_fallback(duration)

    # One concurrent generation per style (avoid duplicate API calls)
    async with _get_lock(style):
        # Re-check after acquiring lock (another coroutine may have just written it)
        if cached.exists() and cached.stat().st_size > 1000:
            return str(cached)

        try:
            client = MuAPIClient()
            prompt_text, style_tag = STYLE_TO_MUSIC.get(style, STYLE_TO_MUSIC["motivation"])
            result = await client.run(
                endpoint="suno-create-music",
                payload={
                    "prompt": f"{prompt_text}, loop-friendly, background track",
                    "style": style_tag,
                    "duration": 30,  # generate full 30s, trim in ffmpeg composer
                    "instrumental": True,
                },
            )

            outputs = result.get("outputs", [])
            music_url = outputs[0] if outputs else None
            if not music_url:
                raise Exception(f"No audio URL in Suno response: {result}")

            async with httpx.AsyncClient(timeout=60) as http:
                response = await http.get(music_url)
                response.raise_for_status()
                content_type = response.headers.get("content-type", "")
                if content_type and not content_type.startswith("audio/"):
                    raise Exception(f"Non-audio response: {content_type}")
                cached.write_bytes(response.content)

            print(f"Music cached: {style} → {cached}")
            return str(cached)

        except Exception as e:
            print(f"Suno music generation failed ({style}): {e} — ffmpeg fallback")
            return _ffmpeg_fallback(duration)


async def warm_music_cache() -> None:
    """Pre-generate all music styles on startup. Call once from main.py."""
    styles = list(STYLE_TO_MUSIC.keys())
    print(f"Warming music cache for styles: {styles}")
    await asyncio.gather(*[generate_background_music(s, 30) for s in styles])
    print("Music cache warm.")
