import subprocess
import tempfile
import re
from pathlib import Path


def generate_srt(narration: str, voice_path: str, caption_mode: str = "full_sentence") -> str:
    """
    Generate SRT from narration. caption_mode:
    - full_sentence: standard subtitle lines
    - keyword_pop: extract one key word per sentence, display large centered
    """
    total_duration = _get_audio_duration(voice_path)
    sentences = _split_sentences(narration)

    if caption_mode == "keyword_pop":
        return _build_keyword_pop_srt(sentences, total_duration)
    return _build_full_sentence_srt(sentences, total_duration)


def _get_audio_duration(voice_path: str) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", voice_path],
        capture_output=True, text=True,
    )
    try:
        return float(result.stdout.strip())
    except ValueError:
        return 30.0


def _split_sentences(narration: str) -> list[str]:
    sentences = re.split(r"(?<=[।\.!\?])\s+", narration.strip())
    sentences = [s.strip() for s in sentences if s.strip()]
    return sentences or [narration[:100]]


def _build_full_sentence_srt(sentences: list[str], total_duration: float) -> str:
    dur = total_duration / len(sentences)
    srt_path = Path(tempfile.mktemp(suffix=".srt"))
    lines = []
    for i, sentence in enumerate(sentences):
        start = i * dur
        end = start + dur
        lines.append(f"{i + 1}")
        lines.append(f"{_fmt(start)} --> {_fmt(end)}")
        if len(sentence) > 40:
            mid = len(sentence) // 2
            space = sentence.find(" ", mid)
            if space != -1:
                sentence = sentence[:space] + "\n" + sentence[space + 1:]
        lines.append(sentence)
        lines.append("")
    srt_path.write_text("\n".join(lines), encoding="utf-8")
    return str(srt_path)


def _build_keyword_pop_srt(sentences: list[str], total_duration: float) -> str:
    """One bold keyword per sentence, displayed center-screen."""
    dur = total_duration / len(sentences)
    srt_path = Path(tempfile.mktemp(suffix=".srt"))
    lines = []
    for i, sentence in enumerate(sentences):
        keyword = _extract_keyword(sentence)
        start = i * dur
        end = start + dur
        lines.append(f"{i + 1}")
        lines.append(f"{_fmt(start)} --> {_fmt(end)}")
        lines.append(keyword.upper())
        lines.append("")
    srt_path.write_text("\n".join(lines), encoding="utf-8")
    return str(srt_path)


def _extract_keyword(sentence: str) -> str:
    """Extract the most prominent word from a sentence."""
    STOP = {
        "का", "के", "की", "में", "से", "पर", "को", "ने", "है", "हैं", "था", "थी",
        "एक", "और", "यह", "वह", "जो", "कि", "भी", "तो", "हो", "a", "an", "the",
        "is", "are", "was", "were", "in", "on", "at", "to", "for", "of", "and",
        "or", "but", "it", "this", "that", "you", "we", "they", "he", "she",
    }
    words = re.findall(r"[\wऀ-ॿ]+", sentence)
    candidates = [w for w in words if w.lower() not in STOP and len(w) > 2]
    if not candidates:
        return words[0] if words else sentence[:10]
    # Prefer longer meaningful words
    return max(candidates, key=len)


def _fmt(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
