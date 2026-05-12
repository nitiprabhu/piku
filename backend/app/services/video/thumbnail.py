import subprocess
from pathlib import Path


def extract_thumbnail(video_path: str, output_path: str, at_second: float = 2.0) -> str:
    """Extract a single frame from video as JPEG thumbnail."""
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(at_second),
        "-i", video_path,
        "-vframes", "1",
        "-vf", "scale=540:960",  # half 9:16 resolution
        "-q:v", "3",
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        raise RuntimeError(f"Thumbnail extraction failed: {result.stderr}")
    return output_path
