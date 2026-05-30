import subprocess
import tempfile
from pathlib import Path

# 6 distinct motion effects, cycled by scene index for variety
# z = zoom expression, x/y = pan position expressions
# 'd' is replaced with actual frame count at call time
_EFFECTS = [
    # Dramatic fast zoom in (hook scene — aggressive punch in)
    ("1+0.60*on/d", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),
    # Fast zoom out reveal
    ("1.60-0.55*on/d", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),
    # Fast Pan left → right with zoom
    ("1.40", "(iw-iw/zoom)*on/d", "ih/2-(ih/zoom/2)"),
    # Fast Pan right → left with zoom
    ("1.40", "(iw-iw/zoom)*(1-on/d)", "ih/2-(ih/zoom/2)"),
    # Pan top → bottom (descend into scene quickly)
    ("1.35", "iw/2-(iw/zoom/2)", "(ih-ih/zoom)*on/d"),
    # Cinematic fast dolly-in diagonal
    ("1+0.50*on/d", "(iw-iw/zoom)*on/d/2", "(ih-ih/zoom)*on/d/2"),
    # Fast float up
    ("1.35", "iw/2-(iw/zoom/2)", "(ih-ih/zoom)*(1-on/d)"),
    # Aggressive push in bottom-center
    ("1+0.55*on/d", "iw/2-(iw/zoom/2)", "(ih-ih/zoom)*0.7"),
]


def image_to_clip(image_path: str, duration: int = 5, scene_index: int = 0) -> str:
    """
    Apply Ken Burns effect to a static image.
    Returns path to local 1080x1920 H.264 MP4 clip.
    """
    fps = 30
    frames = duration * fps
    z_expr, x_expr, y_expr = _EFFECTS[scene_index % len(_EFFECTS)]

    z = z_expr.replace("/d", f"/{frames}")
    x = x_expr.replace("/d", f"/{frames}")
    y = y_expr.replace("/d", f"/{frames}")

    zoompan = (
        f"zoompan=z='{z}':x='{x}':y='{y}'"
        f":d={frames}:s=1080x1920:fps={fps}"
    )

    out = Path(tempfile.mktemp(suffix=".mp4"))
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", image_path,
        "-vf", (
            # Scale input up 2x so zoompan has room to pan/zoom without black bars
            "scale=2160:3840:force_original_aspect_ratio=increase,"
            "crop=2160:3840,"
            f"{zoompan},"
            "format=yuv420p"
        ),
        "-t", str(duration),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        str(out),
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
    if result.returncode != 0:
        raise RuntimeError(f"Ken Burns failed (scene {scene_index}):\n{result.stderr[-500:]}")

    print(f"[ken_burns] scene {scene_index} effect={scene_index % len(_EFFECTS)} → {out}")
    return str(out)
