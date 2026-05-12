import subprocess
import tempfile
from pathlib import Path


def generate_srt(narration: str, voice_path: str) -> str:
    """
    Generate a simple SRT file from narration text.
    Splits text into chunks and estimates timing from audio duration.
    Returns path to .srt file.
    """
    # Get audio duration via ffprobe
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            voice_path,
        ],
        capture_output=True,
        text=True,
    )
    try:
        total_duration = float(result.stdout.strip())
    except ValueError:
        total_duration = 30.0

    # Split narration into sentences
    import re
    sentences = re.split(r"(?<=[।\.!\?])\s+", narration.strip())
    sentences = [s.strip() for s in sentences if s.strip()]

    if not sentences:
        sentences = [narration[:100]]

    # Distribute duration evenly across sentences
    duration_per_sentence = total_duration / len(sentences)

    srt_path = Path(tempfile.mktemp(suffix=".srt"))
    lines = []

    for i, sentence in enumerate(sentences):
        start = i * duration_per_sentence
        end = start + duration_per_sentence
        lines.append(f"{i + 1}")
        lines.append(f"{_format_srt_time(start)} --> {_format_srt_time(end)}")
        # Wrap long lines
        if len(sentence) > 40:
            mid = len(sentence) // 2
            space = sentence.find(" ", mid)
            if space != -1:
                sentence = sentence[:space] + "\n" + sentence[space + 1:]
        lines.append(sentence)
        lines.append("")

    srt_path.write_text("\n".join(lines), encoding="utf-8")
    return str(srt_path)


def _format_srt_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int((seconds - int(seconds)) * 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
