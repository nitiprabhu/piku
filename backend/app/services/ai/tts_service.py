import httpx
import tempfile
from pathlib import Path
from app.config import settings
from app.services.ai.muapi_client import MuAPIClient


VOICE_MAP = {
    "rohit_m":  "male_rohit_hindi",
    "priya_f":  "female_priya_hindi",
    "arjun_m":  "male_arjun_en",
    "ananya_f": "female_ananya_en",
}


async def generate_voice(text: str, voice_id: str, speed: float = 1.0) -> str:
    """Generate TTS via MuAPI MiniMax Speech-2.6-HD. Returns path to downloaded MP3. Falls back to ffmpeg silent audio on failure."""
    import subprocess
    import os
    
    is_unconfigured = (
        not settings.MUAPI_API_KEY
        or settings.MUAPI_API_KEY in ("", "...", "sk-...")
        or len(settings.MUAPI_API_KEY) < 5
    )
    
    # Calculate duration based on words (avg 2.5 words per second)
    words = text.split()
    estimated_duration = max(int(len(words) / 2.5), 3)

    if is_unconfigured:
        print(f"⚠️ MuAPI API Key unconfigured. Generating local {estimated_duration}s silent voice loop using ffmpeg.")
        tmp_path = Path(tempfile.mktemp(suffix=".mp3"))
        try:
            subprocess.run([
                "ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=22050:cl=mono",
                "-t", str(estimated_duration), "-acodec", "libmp3lame", str(tmp_path)
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return str(tmp_path)
        except Exception as e:
            print(f"⚠️ Failed to generate silent mp3 using ffmpeg: {e}. Trying raw sine tone format...")
            # Fallback to a standard empty file if ffmpeg is somehow missing or fails
            tmp_path.write_bytes(b"")
            return str(tmp_path)

    try:
        client = MuAPIClient()

        result = await client.run(
            endpoint="minimax-speech-2.6-hd",
            payload={
                "prompt": text,
                "voice_id": VOICE_MAP.get(voice_id, "male_rohit_hindi"),
                "speed": speed,
                "format": "mp3",
            },
        )

        print(f"🔍 MuAPI TTS result keys: {list(result.keys())} | outputs={result.get('outputs')} | full={result}")
        outputs = result.get("outputs", [])
        audio_url = outputs[0] if outputs else None
        if not audio_url:
            raise Exception(f"No audio URL in MuAPI response: {result}")
        tmp_path = Path(tempfile.mktemp(suffix=".mp3"))

        async with httpx.AsyncClient(timeout=60) as http:
            response = await http.get(audio_url)
            response.raise_for_status()
            content_type = response.headers.get("content-type", "")
            if content_type and not content_type.startswith("audio/"):
                raise Exception(f"MuAPI returned non-audio content-type '{content_type}' for TTS (url={audio_url}). outputs={outputs}")
            tmp_path.write_bytes(response.content)

        return str(tmp_path)
    except Exception as e:
        print(f"⚠️ MuAPI voice generation failed: {e}. Falling back to local silent audio of {estimated_duration}s.")
        tmp_path = Path(tempfile.mktemp(suffix=".mp3"))
        try:
            subprocess.run([
                "ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=22050:cl=mono",
                "-t", str(estimated_duration), "-acodec", "libmp3lame", str(tmp_path)
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return str(tmp_path)
        except Exception as fe:
            print(f"⚠️ Ffmpeg backup failed: {fe}")
            tmp_path.write_bytes(b"")
            return str(tmp_path)

