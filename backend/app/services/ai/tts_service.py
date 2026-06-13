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
    "priya_f":  {"speaker": "anushka",  "lang": "hi-IN"},   # female Hindi
    "arjun_m":  {"speaker": "abhilash", "lang": "en-IN"},   # male Indian English
    "ananya_f": {"speaker": "vidya",    "lang": "en-IN"},   # female Indian English
    "vikram_m": {"speaker": "karun",    "lang": "kn-IN"},   # male native Kannada
    "kavya_f":  {"speaker": "anushka",  "lang": "kn-IN"},   # female native Kannada
}

# OpenAI fallback — only if Sarvam key missing/failed
_OPENAI_FALLBACK = {
    "rohit_m":  ("tts-1",    "onyx"),
    "priya_f":  ("tts-1",    "nova"),
    "arjun_m":  ("tts-1",    "echo"),
    "ananya_f": ("tts-1",    "shimmer"),
    "vikram_m": ("tts-1-hd", "onyx"),
    "kavya_f":  ("tts-1-hd", "nova"),
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
                    "pace": max(0.5, min(2.0, speed * 1.15)),
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


def _deepen_voice(mp3_path: str) -> str:
    """
    Deepen voice using EQ — boosts bass frequencies, cuts highs.
    No pitch shifting (avoids speed/quality artifacts).
    Uses equalizer filter: boost 80-200Hz, cut 3k-8kHz.
    """
    out_path = Path(tempfile.mktemp(suffix=".mp3"))
    # Boost bass (+6dB at 120Hz), slightly cut upper mids (-3dB at 5kHz)
    af = "equalizer=f=120:t=o:w=1:g=6,equalizer=f=5000:t=o:w=2:g=-3"
    subprocess.run(
        ["ffmpeg", "-y", "-i", mp3_path, "-af", af, "-codec:a", "libmp3lame", "-q:a", "2", str(out_path)],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    Path(mp3_path).unlink(missing_ok=True)
    return str(out_path)


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

    if sarvam_ok:
        try:
            path = await _sarvam_tts(text, voice_id, speed)
            return _deepen_voice(path)
        except Exception as e:
            print(f"⚠️ Sarvam TTS failed: {e}. Falling back to OpenAI.")

    if settings.OPENAI_API_KEY:
        try:
            path = await _openai_tts(text, voice_id, speed)
            return _deepen_voice(path)
        except Exception as e:
            print(f"⚠️ OpenAI TTS failed: {e}. Falling back to silent audio.")

    print(f"⚠️ All TTS providers failed. Generating {estimated_duration}s silent audio.")
    return _silent_audio(estimated_duration)
