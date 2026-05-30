import httpx
import tempfile
import base64
import subprocess
import re
from pathlib import Path
from app.config import settings


# Sarvam AI bulbul:v2 speakers (ONLY these 7 work with v2):
#   female: anushka, manisha, vidya, arya
#   male:   abhilash, karun, hitesh
_SARVAM_VOICE_MAP = {
    "rohit_m":  {"speaker": "karun",    "lang": "hi-IN"},   # male Hindi
    "anchor_m": {"speaker": "hitesh",   "lang": "hi-IN"},   # male Hindi authoritative
    "startup_m":{"speaker": "abhilash", "lang": "hi-IN"},   # male Hindi energetic/hinglish
    "priya_f":  {"speaker": "anushka",  "lang": "hi-IN"},   # female Hindi
    "arjun_m":  {"speaker": "abhilash", "lang": "en-IN"},   # male Indian English
    "ananya_f": {"speaker": "vidya",    "lang": "en-IN"},   # female Indian English
    "vikram_m": {"speaker": "karun",    "lang": "kn-IN"},   # male native Kannada
    "kavya_f":  {"speaker": "anushka",  "lang": "kn-IN"},   # female native Kannada
    "anime_kid":   {"speaker": "anushka",  "lang": "hi-IN"},   # female base for kid pitch shift
    "anime_kid_kn":{"speaker": "anushka",  "lang": "kn-IN"},   # female Kannada kid pitch shift
}

# OpenAI fallback — only if Sarvam key missing/failed
_OPENAI_FALLBACK = {
    "rohit_m":  ("tts-1",    "onyx"),
    "anchor_m": ("tts-1",    "fable"),
    "startup_m":("tts-1",    "echo"),
    "priya_f":  ("tts-1",    "nova"),
    "arjun_m":  ("tts-1",    "echo"),
    "ananya_f": ("tts-1",    "shimmer"),
    "vikram_m": ("tts-1-hd", "onyx"),
    "kavya_f":  ("tts-1-hd", "nova"),
    "anime_kid":   ("tts-1", "nova"),
    "anime_kid_kn":("tts-1", "nova"),
}


_INVISIBLE_CHARS_RE = re.compile(
    r'[​‌‍‎‏  ‪-‮﻿­]'
)


def _clean_text(text: str) -> str:
    """Strip invisible/zero-width unicode chars that cause Sarvam 400 errors."""
    return _INVISIBLE_CHARS_RE.sub('', text).strip()


def _chunk_text(text: str, max_chars: int = 490) -> list[str]:
    """Split on sentence boundaries — Sarvam limit is 500 chars per request.
    Uses 490 as safe limit to account for multi-byte char encoding overhead."""
    text = _clean_text(text)
    if len(text) <= max_chars:
        return [text]
    chunks: list[str] = []
    # Split on sentence-ending punctuation (Devanagari danda, !, ?, .)
    sentences = re.split(r'(?<=[।!?.])\s+', text)
    current = ""
    for sent in sentences:
        if len(current) + len(sent) + 1 <= max_chars:
            current = (current + " " + sent).strip()
        else:
            if current:
                chunks.append(current)
            # Sentence itself longer than max — hard split on spaces
            if len(sent) > max_chars:
                words = sent.split()
                seg = ""
                for w in words:
                    if len(seg) + len(w) + 1 <= max_chars:
                        seg = (seg + " " + w).strip()
                    else:
                        if seg:
                            chunks.append(seg)
                        seg = w
                current = seg
            else:
                current = sent
    if current:
        chunks.append(current)
    return chunks or [text[:max_chars]]


def _write_tmp_wav(wav_bytes: bytes) -> Path:
    p = Path(tempfile.mktemp(suffix=".wav"))
    p.write_bytes(wav_bytes)
    return p


def _concat_wavs(wav_bytes_list: list[bytes]) -> Path:
    """Concat WAV segments via ffmpeg."""
    tmp_dir = Path(tempfile.mkdtemp())
    paths: list[Path] = []
    for i, b in enumerate(wav_bytes_list):
        p = tmp_dir / f"seg_{i}.wav"
        p.write_bytes(b)
        paths.append(p)
    list_file = tmp_dir / "concat.txt"
    list_file.write_text("\n".join(f"file '{p}'" for p in paths))
    out = tmp_dir / "combined.wav"
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(list_file), str(out)],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    return out


async def _sarvam_tts(text: str, voice_id: str, speed: float) -> str:
    """Sarvam AI TTS. Returns mp3 path."""
    cfg = _SARVAM_VOICE_MAP[voice_id]
    chunks = _chunk_text(text, max_chars=500)
    segments: list[bytes] = []

    async with httpx.AsyncClient(timeout=60) as http:
        for chunk in chunks:
            resp = await http.post(
                "https://api.sarvam.ai/text-to-speech",
                headers={
                    "api-subscription-key": settings.SARVAM_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "inputs": [chunk],
                    "target_language_code": cfg["lang"],
                    "speaker": cfg["speaker"],
                    "model": "bulbul:v2",
                    "speech_sample_rate": 22050,
                    "enable_preprocessing": True,
                    "pace": max(0.5, min(2.0, speed)),
                },
            )
            if not resp.is_success:
                print(f"⚠️ Sarvam 400 body: {resp.text[:500]}")
            resp.raise_for_status()
            data = resp.json()
            audios = data.get("audios", [])
            if not audios:
                raise Exception(f"Sarvam returned no audio: {data}")
            segments.append(base64.b64decode(audios[0]))

    wav_path = _concat_wavs(segments) if len(segments) > 1 else _write_tmp_wav(segments[0])
    mp3_path = Path(tempfile.mktemp(suffix=".mp3"))
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(wav_path), "-codec:a", "libmp3lame", "-q:a", "2", str(mp3_path)],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    wav_path.unlink(missing_ok=True)
    print(f"✅ Sarvam TTS [{cfg['speaker']}/{cfg['lang']}] → {mp3_path}")
    return str(mp3_path)


async def _openai_tts(text: str, voice_id: str, speed: float) -> str:
    """OpenAI TTS fallback. Returns mp3 path."""
    model, voice = _OPENAI_FALLBACK.get(voice_id, ("tts-1", "onyx"))
    tmp_path = Path(tempfile.mktemp(suffix=".mp3"))
    async with httpx.AsyncClient(timeout=60) as http:
        resp = await http.post(
            "https://api.openai.com/v1/audio/speech",
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "input": text,
                "voice": voice,
                "speed": max(0.25, min(4.0, speed)),
                "response_format": "mp3",
            },
        )
        resp.raise_for_status()
        tmp_path.write_bytes(resp.content)
    print(f"✅ OpenAI TTS [{model}/{voice}] → {tmp_path}")
    return str(tmp_path)


def _silent_audio(duration: int) -> str:
    tmp_path = Path(tempfile.mktemp(suffix=".mp3"))
    try:
        subprocess.run([
            "ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=22050:cl=mono",
            "-t", str(duration), "-acodec", "libmp3lame", str(tmp_path)
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        tmp_path.write_bytes(b"")
    return str(tmp_path)


def _apply_kid_pitch(mp3_path: str) -> str:
    """Apply pitch and speed shift to create a kid/anime voice effect."""
    out_path = Path(tempfile.mktemp(suffix=".mp3"))
    try:
        subprocess.run([
            "ffmpeg", "-y", "-i", mp3_path, 
            "-af", "asetrate=44100*1.5,aresample=44100",
            str(out_path)
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return str(out_path)
    except Exception as e:
        print(f"⚠️ Kid pitch shift failed: {e}")
        return mp3_path


async def generate_voice(text: str, voice_id: str, speed: float = 1.0) -> str:
    """
    Generate TTS.

    Priority:
      1. Sarvam AI bulbul:v2 (all voices — hi-IN / en-IN / kn-IN)
      2. OpenAI TTS (fallback if SARVAM_API_KEY not set or Sarvam fails)
      3. Silent audio (last resort)
    """
    words = text.split()
    estimated_duration = max(int(len(words) / 2.5), 3)

    sarvam_ok = bool(
        settings.SARVAM_API_KEY
        and settings.SARVAM_API_KEY not in ("", "sk-...")
        and len(settings.SARVAM_API_KEY) >= 10
    )

    out_path = None
    if sarvam_ok:
        try:
            out_path = await _sarvam_tts(text, voice_id, speed)
        except Exception as e:
            print(f"⚠️ Sarvam TTS failed: {e}. Falling back to OpenAI.")

    if not out_path and settings.OPENAI_API_KEY:
        try:
            out_path = await _openai_tts(text, voice_id, speed)
        except Exception as e:
            print(f"⚠️ OpenAI TTS failed: {e}. Falling back to silent audio.")
            
    if not out_path:
        print(f"⚠️ All TTS providers failed. Generating {estimated_duration}s silent audio.")
        out_path = _silent_audio(estimated_duration)
        
    if voice_id in ("anime_kid", "anime_kid_kn") and out_path:
        out_path = _apply_kid_pitch(out_path)
        
    return out_path
