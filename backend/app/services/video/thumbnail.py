import subprocess
from pathlib import Path


def extract_thumbnail(video_path: str, output_path: str, at_second: float = 2.0) -> str:
    """Extract a single frame from video as JPEG thumbnail. Retries at earlier timestamps on failure."""
    candidates = [at_second, 1.0, 0.5, 0.0]
    last_error = ""
    for ts in candidates:
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(ts),
            "-i", video_path,
            "-vframes", "1",
            "-vf", "scale=540:960",
            "-q:v", "3",
            output_path,
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        out_file = Path(output_path)
        if result.returncode == 0 and out_file.exists() and out_file.stat().st_size > 0:
            return output_path
        last_error = result.stderr
    raise RuntimeError(f"Thumbnail extraction failed at all timestamps: {last_error}")
