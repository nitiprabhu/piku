import subprocess
import tempfile
from pathlib import Path
from app.services.video.caption_generator import generate_srt


# Rotating color grades for storytelling/devotional — avoids same warm-brown every episode
_STORYTELLING_GRADES = [
    # Warm gold (default)
    "eq=contrast=1.08:saturation=0.82,colorbalance=rh=0.14:gh=0.02:bh=-0.10:rs=0.04:gs=0:bs=-0.06,vignette=PI/3.5,noise=alls=10:allf=t+u",
    # Cool blue-silver
    "eq=contrast=1.10:saturation=0.78,colorbalance=rh=-0.06:gh=0.02:bh=0.16:rs=-0.04:gs=0:bs=0.10,vignette=PI/3.5,noise=alls=10:allf=t+u",
    # Deep orange-red
    "eq=contrast=1.12:saturation=0.88,colorbalance=rh=0.18:gh=-0.04:bh=-0.14:rs=0.08:gs=-0.02:bs=-0.08,vignette=PI/3,noise=alls=8:allf=t+u",
    # Teal-green dark
    "eq=contrast=1.10:saturation=0.85,colorbalance=rh=-0.08:gh=0.10:bh=0.06:rs=-0.04:gs=0.06:bs=0.02,vignette=PI/3.5,noise=alls=12:allf=t+u",
    # Bright high-key (less graded)
    "eq=contrast=1.04:saturation=0.95,colorbalance=rh=0.06:gh=0.04:bh=-0.02,vignette=PI/5,noise=alls=5:allf=t+u",
    # Purple-indigo night
    "eq=contrast=1.12:saturation=0.80,colorbalance=rh=0.06:gh=-0.04:bh=0.14:rs=0.04:gs=-0.02:bs=0.10,vignette=PI/3,noise=alls=12:allf=t+u",
    # Sepia-warm library
    "eq=contrast=1.06:saturation=0.75,colorbalance=rh=0.12:gh=0.06:bh=-0.12:rs=0.06:gs=0.04:bs=-0.06,vignette=PI/3.5,noise=alls=14:allf=t+u",
    # Misty grey-green
    "eq=contrast=1.08:saturation=0.72,colorbalance=rh=-0.02:gh=0.08:bh=0.02,vignette=PI/3,noise=alls=10:allf=t+u",
]

_DEVOTIONAL_GRADES = [
    # Warm sunrise
    "eq=contrast=1.05:saturation=0.90,colorbalance=rh=0.10:gh=0.06:bh=-0.05,vignette=PI/4,noise=alls=7:allf=t+u",
    # Cool blue night
    "eq=contrast=1.08:saturation=0.85,colorbalance=rh=-0.04:gh=0.02:bh=0.12,vignette=PI/4,noise=alls=7:allf=t+u",
    # Bright white snow
    "eq=contrast=1.03:saturation=0.92,colorbalance=rh=0.04:gh=0.04:bh=0.02,vignette=PI/5,noise=alls=5:allf=t+u",
    # Soft pink morning
    "eq=contrast=1.05:saturation=0.88,colorbalance=rh=0.12:gh=0.02:bh=-0.02,vignette=PI/4,noise=alls=6:allf=t+u",
]

_STATIC_GRADES = {
    "motivation": "eq=contrast=1.12:saturation=1.05,colorbalance=rh=0.08:gh=0.02:bh=-0.06,vignette=PI/4",
    "funny": None,
    "business": "eq=contrast=1.05:saturation=0.92,vignette=PI/5",
    "news": "eq=contrast=1.10:saturation=0.88,vignette=PI/4",
}


def _build_cinematic_filter(style: str, episode_number: int = 1) -> str | None:
    ep_idx = max(0, episode_number - 1)
    if style == "storytelling":
        return _STORYTELLING_GRADES[ep_idx % len(_STORYTELLING_GRADES)]
    if style == "devotional":
        return _DEVOTIONAL_GRADES[ep_idx % len(_DEVOTIONAL_GRADES)]
    return _STATIC_GRADES.get(style)


def _get_duration(path: str) -> float:
    """Return media duration in seconds via ffprobe."""
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True,
    )
    try:
        return float(result.stdout.strip())
    except ValueError:
        return 0.0


def compose_video(
    video_clips: list[str],
    voice_path: str,
    music_path: str | None,
    script: dict,
    output_path: str,
    watermark_path: str | None = None,
    style: str = "motivation",
    instagram_handle: str | None = None,
    youtube_handle: str | None = None,
    caption_mode: str = "full_sentence",  # P4: full_sentence | keyword_pop
    enable_captions: bool = True,
    episode_number: int = 1,
    language: str = "hi",
) -> str:
    """
    Full FFmpeg composition pipeline:
    1. Scale all clips to 1080×1920 (9:16)
    2. Concat clips
    3. Overlay SRT captions (Noto Sans for Hindi support, skipped if enable_captions=False)
    4. Overlay watermark (if provided)
    5. Mix voice (100%) + music (12% ducked)
    """
    srt_path = generate_srt(script.get("narration", ""), voice_path, caption_mode) if enable_captions else None

    # Measure voice duration; extend last clip if video total would be shorter
    voice_dur = _get_duration(voice_path)
    n = len(video_clips)

    # Build input flags
    input_flags: list[str] = []
    for clip in video_clips:
        input_flags += ["-i", clip]
    input_flags += ["-i", voice_path]
    if music_path:
        input_flags += ["-i", music_path]

    voice_idx = n
    music_idx = n + 1 if music_path else None

    # Build filter graph
    # Measure total video clip duration; pad last clip if voice is longer
    clips_total = sum(_get_duration(c) for c in video_clips)
    pad_extra = max(0.0, voice_dur - clips_total + 1.0)  # +1s buffer

    scale_parts = []
    for i in range(n):
        tpad = f"tpad=stop_mode=clone:stop_duration={pad_extra:.2f}," if (i == n - 1 and pad_extra > 0) else ""
        scale_parts.append(
            f"[{i}:v]scale=1080:1920:force_original_aspect_ratio=increase,"
            f"crop=1080:1920,setsar=1,{tpad}setpts=PTS-STARTPTS[v{i}]"
        )

    concat_in = "".join(f"[v{i}]" for i in range(n))
    concat_filter = f"{concat_in}concat=n={n}:v=1:a=0[vcat]"

    # Captions with Noto Sans (supports Hindi/Devanagari) — skipped if enable_captions=False
    if srt_path:
        srt_escaped = srt_path.replace("\\", "\\\\").replace(":", "\\:")
        bright_styles = {"funny", "daily_routine", "outfit_check", "dance_trend", "product_review"}
        caption_color = "&H00FFFFFF" if style in bright_styles else "&H0000FFFF"
        font_name = "Noto Sans Kannada" if language == "kn" else "Noto Sans"

        if caption_mode == "keyword_pop":
            caption_filter = (
                f"[vcat]subtitles={srt_escaped}:"
                f"force_style='FontName={font_name},FontSize=24,"
                f"PrimaryColour={caption_color},Bold=1,"
                f"OutlineColour=&H00000000,Outline=5,Shadow=2,BorderStyle=1,"
                f"Alignment=5,MarginV=0,MarginL=0,MarginR=0,"
                f"WrapStyle=1'[vcap]"
            )
        else:
            caption_filter = (
                f"[vcat]subtitles={srt_escaped}:"
                f"force_style='FontName={font_name},FontSize=19,"
                f"PrimaryColour={caption_color},Bold=1,"
                f"OutlineColour=&H00000000,Outline=4,Shadow=2,BorderStyle=1,"
                f"Alignment=2,MarginV=60,MarginL=80,MarginR=80,"
                f"WrapStyle=1'[vcap]"
            )
    else:
        caption_filter = "[vcat]copy[vcap]"

    # Audio: voice full vol, music ducked to 12%
    if music_idx is not None:
        audio_filter = (
            f"[{voice_idx}:a]volume=1.0[voice];"
            f"[{music_idx}:a]volume=0.12[music];"
            f"[voice][music]amix=inputs=2:duration=first:dropout_transition=2[aout]"
        )
    else:
        audio_filter = f"[{voice_idx}:a]volume=1.0[aout]"

    # Cinematic post-processing (style-specific color grade + vignette + grain)
    cinematic_filter = _build_cinematic_filter(style, episode_number)
    if cinematic_filter:
        cinematic_filter_str = f"[vcap]{cinematic_filter}[vgraded]"
        post_cap_out = "[vgraded]"
    else:
        cinematic_filter_str = None
        post_cap_out = "[vcap]"

    # Watermark (optional)
    if watermark_path and Path(watermark_path).exists():
        extra_inputs = ["-i", watermark_path]
        wm_idx = n + 2
        watermark_filter = f"[{post_cap_out.strip('[]')}][{wm_idx}:v]overlay=W-w-20:H-h-20[vout]"
        video_out = "[vout]"
    else:
        extra_inputs = []
        watermark_filter = None
        video_out = post_cap_out


    # Social overlay: "FOLLOW US" box top-right — chained as a single comma-separated filter entry
    # @ must be escaped as \@ in drawtext text values
    social_overlay_filter: str | None = None
    if instagram_handle or youtube_handle:
        n_handles = sum([bool(instagram_handle), bool(youtube_handle)])
        # Content hierarchy: small label → large handles (handles are the CTA)
        box_h = 24 + 28 + n_handles * 40 + 16
        parts = [
            f"drawbox=x=iw-380:y=24:w=356:h={box_h}:color=black@0.60:t=fill",
            "drawtext=text='FOLLOW US':x=w-368:y=34:fontsize=18:fontcolor=white@0.80",
        ]
        y = 66
        if instagram_handle:
            parts.append(
                f"drawtext=text='\\@ {instagram_handle}':x=w-368:y={y}:fontsize=28:fontcolor=#E1306C"
            )
            y += 40
        if youtube_handle:
            parts.append(
                f"drawtext=text='\\@ {youtube_handle}':x=w-368:y={y}:fontsize=28:fontcolor=#FF0000"
            )
        # Build as single filter chain entry with in/out labels
        social_overlay_filter = f"[{video_out.strip('[]')}]" + ",".join(parts) + "[vfinal]"
        video_out = "[vfinal]"

    filter_parts = [*scale_parts, concat_filter, caption_filter]
    if cinematic_filter_str:
        filter_parts.append(cinematic_filter_str)
    if watermark_filter:
        filter_parts.append(watermark_filter)
    if social_overlay_filter:
        filter_parts.append(social_overlay_filter)
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
        "-t", f"{voice_dur:.2f}",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg composition failed:\n{result.stderr[-2000:]}")

    return output_path
