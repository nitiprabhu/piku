from pathlib import Path

# Bundled royalty-free tracks committed to assets/music/.
# One track per style family — zero API cost, zero network dependency.
_LIBRARY_DIR = Path(__file__).parent.parent.parent / "assets" / "music"

_STYLE_TO_TRACK = {
    "storytelling": "epic_cinematic.mp3",
    "devotional":   "devotional_calm.mp3",
    "funny":        "upbeat_comedy.mp3",
    "motivation":   "motivation_epic.mp3",
    "business":     "corporate_clean.mp3",
    "news":         "corporate_clean.mp3",
    "mystery":      "mystery_dark.mp3",
    "facts":        "motivation_epic.mp3",
    # influencer styles
    "daily_routine":  "upbeat_comedy.mp3",
    "outfit_check":   "upbeat_comedy.mp3",
    "dance_trend":    "upbeat_comedy.mp3",
    "travel_vlog":    "epic_cinematic.mp3",
    "product_review": "corporate_clean.mp3",
}

_FALLBACK = "motivation_epic.mp3"


async def generate_background_music(style: str, duration: int) -> str:
    """Return path to bundled background track for the given style. Always ₹0 cost."""
    filename = _STYLE_TO_TRACK.get(style, _FALLBACK)
    track = _LIBRARY_DIR / filename
    if track.exists() and track.stat().st_size > 1000:
        return str(track)
    # Last resort: any valid file in library
    for f in _LIBRARY_DIR.glob("*.mp3"):
        if f.stat().st_size > 1000:
            return str(f)
    return ""


async def warm_music_cache() -> None:
    """No-op — music is bundled, no warming needed."""
    pass
