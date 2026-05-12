import subprocess
import tempfile
from pathlib import Path
from app.services.video.caption_generator import generate_srt


def compose_video(
    video_clips: list[str],
    voice_path: str,
    music_path: str,
    script: dict,
    output_path: str,
    watermark_path: str | None = None,
) -> str:
    """
    Full FFmpeg composition pipeline:
    1. Scale all clips to 1080×1920 (9:16)
    2. Concat clips
    3. Overlay SRT captions (Noto Sans for Hindi support)
    4. Overlay watermark (if provided)
    5. Mix voice (100%) + music (12% ducked)
    """
    srt_path = generate_srt(script.get("narration", ""), voice_path)
    n = len(video_clips)

    # Build input flags
    input_flags: list[str] = []
    for clip in video_clips:
        input_flags += ["-i", clip]
    input_flags += ["-i", voice_path, "-i", music_path]

    voice_idx = n
    music_idx = n + 1

    # Build filter graph
    scale_parts = []
    for i in range(n):
        scale_parts.append(
            f"[{i}:v]scale=1080:1920:force_original_aspect_ratio=increase,"
            f"crop=1080:1920,setsar=1,setpts=PTS-STARTPTS[v{i}]"
        )

    concat_in = "".join(f"[v{i}]" for i in range(n))
    concat_filter = f"{concat_in}concat=n={n}:v=1:a=0[vcat]"

    # Captions with Noto Sans (supports Hindi/Devanagari)
    srt_escaped = srt_path.replace("\\", "\\\\").replace(":", "\\:")
    # Instagram Reels / YouTube Shorts: 1080x1920, safe zone ~108px sides
    # FFmpeg SRT→ASS uses PlayResY=480, so FontSize px = FontSize * (1920/480) = FontSize * 4
    # FontSize=11 → ~44px on screen (standard reel caption size)
    caption_filter = (
        f"[vcat]subtitles={srt_escaped}:"
        f"force_style='FontName=Noto Sans,FontSize=11,"
        f"PrimaryColour=&H00FFFFFF,Bold=1,"
        f"OutlineColour=&H00000000,Outline=3,Shadow=1,"
        f"Alignment=2,MarginV=20,MarginL=80,MarginR=80,"
        f"WrapStyle=0'[vcap]"
    )

    # Audio: voice full vol, music ducked to 12%
    audio_filter = (
        f"[{voice_idx}:a]volume=1.0[voice];"
        f"[{music_idx}:a]volume=0.12[music];"
        f"[voice][music]amix=inputs=2:duration=first:dropout_transition=2[aout]"
    )

    # Watermark (optional)
    if watermark_path and Path(watermark_path).exists():
        extra_inputs = ["-i", watermark_path]
        wm_idx = n + 2
        watermark_filter = f"[vcap][{wm_idx}:v]overlay=W-w-20:H-h-20[vout]"
        video_out = "[vout]"
    else:
        extra_inputs = []
        watermark_filter = None
        video_out = "[vcap]"


    filter_parts = [*scale_parts, concat_filter, caption_filter]
    if watermark_filter:
        filter_parts.append(watermark_filter)
    filter_parts.append(audio_filter)
    filter_complex = ";".join(filter_parts)

    cmd = [
        "ffmpeg", "-y",
        *input_flags,
        *extra_inputs,
        "-filter_complex", filter_complex,
        "-map", video_out,
        "-map", "[aout]",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        "-r", "30",
        "-shortest",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg composition failed:\n{result.stderr[-2000:]}")

    return output_path
