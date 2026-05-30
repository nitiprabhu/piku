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


def _chunk_sentence(sentence: str, max_words: int = 7) -> list[str]:
    """Split sentence into display chunks of max_words words, each max 2 lines."""
    words = sentence.split()
    chunks = []
    for i in range(0, len(words), max_words):
        chunk_words = words[i:i + max_words]
        chunk = " ".join(chunk_words)
        # If chunk is still > 35 chars, split into 2 lines at midpoint
        if len(chunk) > 35:
            mid = len(chunk) // 2
            space = chunk.find(" ", mid)
            if space != -1:
                chunk = chunk[:space] + "\n" + chunk[space + 1:]
        chunks.append(chunk)
    return chunks or [sentence[:40]]


def _build_full_sentence_srt(sentences: list[str], total_duration: float) -> str:
    # Build all display chunks with proportional timing
    sentence_dur = total_duration / len(sentences)
    all_chunks: list[tuple[float, float, str]] = []  # (start, end, text)

    for i, sentence in enumerate(sentences):
        sent_start = i * sentence_dur
        chunks = _chunk_sentence(sentence)
        chunk_dur = sentence_dur / len(chunks)
        for j, chunk in enumerate(chunks):
            start = sent_start + j * chunk_dur
            end = start + chunk_dur
            all_chunks.append((start, end, chunk))

    srt_path = Path(tempfile.mktemp(suffix=".srt"))
    lines = []
    for idx, (start, end, text) in enumerate(all_chunks):
        lines.append(f"{idx + 1}")
        lines.append(f"{_fmt(start)} --> {_fmt(end)}")
        lines.append("{\\an2}" + text)
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
        # {\an2} = bottom-center; overrides force_style Alignment at ASS tag level
        lines.append("{\\an2}" + keyword.upper())
        lines.append("")
    srt_path.write_text("\n".join(lines), encoding="utf-8")
    return str(srt_path)


def _extract_keyword(sentence: str) -> str:
    """Extract the most prominent word from a sentence."""
    STOP = {
        # Hindi
        "का", "के", "की", "में", "से", "पर", "को", "ने", "है", "हैं", "था", "थी",
        "एक", "और", "यह", "वह", "जो", "कि", "भी", "तो", "हो", "कर", "यही", "वही",
        # Kannada
        "ಮತ್ತು", "ಅಥವಾ", "ಆದರೆ", "ಇದು", "ಅದು", "ಈ", "ಆ", "ಒಂದು", "ಅಲ್ಲ",
        "ಇಲ್ಲ", "ನಾನು", "ನೀನು", "ಅವನು", "ಅವಳು", "ನಾವು", "ನೀವು", "ಅವರು",
        "ಹೇಗೆ", "ಏನು", "ಯಾರು", "ಎಷ್ಟು", "ಎಲ್ಲಿ",
        # English
        "a", "an", "the", "is", "are", "was", "were", "in", "on", "at", "to",
        "for", "of", "and", "or", "but", "it", "this", "that", "you", "we",
        "they", "he", "she", "with", "have", "has", "been", "will", "would",
    }
    words = re.findall(r"[\wऀ-ॿಀ-೿]+", sentence)
    # min 4 chars to avoid garbage fragments like "धिा"
    candidates = [w for w in words if w.lower() not in STOP and len(w) >= 4]
    if not candidates:
        # fallback: any word >= 3 chars
        candidates = [w for w in words if len(w) >= 3]
    if not candidates:
        return sentence[:12]
    return max(candidates, key=len)


def _fmt(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
