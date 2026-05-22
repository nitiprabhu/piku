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
    style: str = "motivation",
    instagram_handle: str | None = None,
    youtube_handle: str | None = None,
    caption_mode: str = "full_sentence",  # P4: full_sentence | keyword_pop
) -> str:
    """
    Full FFmpeg composition pipeline:
    1. Scale all clips to 1080×1920 (9:16)
    2. Concat clips
    3. Overlay SRT captions (Noto Sans for Hindi support)
    4. Overlay watermark (if provided)
    5. Mix voice (100%) + music (12% ducked)
    """
    srt_path = generate_srt(script.get("narration", ""), voice_path, caption_mode)
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
    # ASS color format: ABGR hex — yellow = &H0000FFFF, white = &H00FFFFFF
    caption_color = "&H0000FFFF" if style == "storytelling" else "&H00FFFFFF"

    if caption_mode == "keyword_pop":
        # Large centered keyword — FontSize=22 → ~88px on screen
        caption_filter = (
            f"[vcat]subtitles={srt_escaped}:"
            f"force_style='FontName=Noto Sans,FontSize=22,"
            f"PrimaryColour={caption_color},Bold=1,"
            f"OutlineColour=&H00000000,Outline=5,Shadow=2,"
            f"Alignment=5,MarginV=0,MarginL=0,MarginR=0,"
            f"WrapStyle=1'[vcap]"
        )
    else:
        caption_filter = (
            f"[vcat]subtitles={srt_escaped}:"
            f"force_style='FontName=Noto Sans,FontSize=11,"
            f"PrimaryColour={caption_color},Bold=1,"
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


    # Social overlay: "FOLLOW US" box top-right — chained as a single comma-separated filter entry
    # @ must be escaped as \@ in drawtext text values
    social_overlay_filter: str | None = None
    if instagram_handle or youtube_handle:
        n_handles = sum([bool(instagram_handle), bool(youtube_handle)])
        box_h = 28 + 22 + n_handles * 24
        parts = [
            f"drawbox=x=iw-290:y=10:w=280:h={box_h}:color=black@0.70:t=fill",
            "drawtext=text='FOLLOW US':x=w-280:y=16:fontsize=18:fontcolor=white",
        ]
        y = 42
        if instagram_handle:
            parts.append(
                f"drawtext=text='ig \\@ {instagram_handle}':x=w-280:y={y}:fontsize=17:fontcolor=#E1306C"
            )
            y += 24
        if youtube_handle:
            parts.append(
                f"drawtext=text='yt \\@ {youtube_handle}':x=w-280:y={y}:fontsize=17:fontcolor=#FF4444"
            )
        # Build as single filter chain entry with in/out labels
        social_overlay_filter = f"[{video_out.strip('[]')}]" + ",".join(parts) + "[vfinal]"
        video_out = "[vfinal]"

    filter_parts = [*scale_parts, concat_filter, caption_filter]
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
        "-shortest",
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg composition failed:\n{result.stderr[-2000:]}")

    return output_path
