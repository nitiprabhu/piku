import asyncio
import subprocess
import tempfile
import httpx
from pathlib import Path
from app.config import settings


_STYLE_SUFFIX = {
    # Video styles
    "storytelling": "dramatic cinematic lighting, Indian mythological aesthetic, no text no watermark, portrait vertical 9:16",
    "devotional": "soft golden light, serene spiritual atmosphere, no text no watermark, portrait vertical 9:16",
    "motivation": "powerful epic composition, dramatic lighting, no text no watermark, portrait vertical 9:16",
    "funny": "vibrant colorful, expressive Indian context, no text no watermark, portrait vertical 9:16",
    "business": "professional clean modern, no text no watermark, portrait vertical 9:16",
    "news": "dramatic journalistic high contrast, no text no watermark, portrait vertical 9:16",
    "daily_routine": "casual vlog aesthetic, bright natural morning light, clean modern apartment background, handheld camera feel, portrait vertical 9:16",
    "outfit_check": "fashion photoshoot look, studio lighting, aesthetic mirror reflections or clean wardrobe background, high-end lifestyle style, portrait vertical 9:16",
    "dance_trend": "high energy motion blur, neon accent lighting, trendy urban street or studio background, dynamic action capture, portrait vertical 9:16",
    "travel_vlog": "cinematic travel photography, scenic outdoor landmark background, golden hour sunlight, adventurous cinematic feel, portrait vertical 9:16",
    "product_review": "clean product display, professional soft box lighting, blurred studio background, close-up details, portrait vertical 9:16",
    # Image post styles — background ONLY, text overlaid by PIL compositor
    "motivation_quote": (
        "breathtaking sunrise mountain landscape, warm golden-amber light rays, "
        "misty atmospheric depth, single dominant focal point filling 65% of frame, "
        "lower 35% of frame intentionally soft-focus with minimal detail for text overlay, "
        "cinematic editorial photography, rich amber-cream color palette, high contrast "
        "between sky and landscape. No text, no watermarks, no typography, no UI elements. "
        "Portrait vertical 9:16."
    ),
    "did_you_know": (
        "bold graphic illustration: large stylised glowing lightbulb as hero element filling 50% of frame, "
        "flat vector illustration aesthetic, deep navy-to-cobalt gradient background, "
        "bright yellow accent lighting radiating from bulb, high contrast vibrant colors, "
        "clean negative space in upper and lower thirds for text overlay, "
        "single subject dominates frame, modern infographic illustration style. "
        "No text, no badges, no labels, no captions. Portrait vertical 9:16."
    ),
    "meme": (
        "funny relatable Indian scene: expressive character or animal with deadpan or exaggerated expression, "
        "slightly desaturated neutral background emphasizing subject, tight crop from chest up, "
        "comedic timing framing — subject centered with breathing room above and below for caption text, "
        "documentary photography style. No text, no captions, no font overlays. Portrait vertical 9:16."
    ),
    "politics": (
        "dramatic editorial photograph of Indian political scene or iconic political location, "
        "powerful single subject centered, strong diagonal lighting for gravitas, "
        "cinematic depth of field, lower 40% of frame intentionally dark/underexposed for text panel overlay, "
        "deep saffron warm tones or rich navy-blue authoritative tones, "
        "authoritative photojournalism aesthetic. No text, no headlines, no lower-thirds. Portrait vertical 9:16."
    ),
    "news_image": (
        "dramatic editorial news photograph: Indian Parliament building exterior or news scene, "
        "cinematic photojournalism style, high contrast moody lighting, single powerful compositional anchor, "
        "subject fills top 55% of frame vertically, bottom 45% intentionally dark or blurred for overlay panel, "
        "no UI, no chyrons, no graphic elements — raw editorial photography only. "
        "No text, no banners, no lower-thirds, no logos. Portrait vertical 9:16."
    ),
    "education_story": (
        "single cohesive illustrated scene panel: bright cheerful children's book illustration, "
        "friendly expressive characters in a morally meaningful moment, warm saturated colors, "
        "clear visual storytelling through body language and expression, "
        "single dominant scene (not sequential panels), clean bright background with enough "
        "negative space for caption overlay, textbook illustration aesthetic. "
        "No text, no speech bubbles, no captions. Portrait vertical 9:16."
    ),
}

# Color theme prompts for carousel posts
_COLOR_THEMES = {
    "dark_space":   "deep dark navy background #0A0E1A, gold #C9A84C accent lines, crisp white text, premium minimal layout",
    "clean_white":  "pure white background, dark charcoal #1A1A2E text, vibrant red #E94560 accent, modern clean layout",
    "deep_purple":  "deep navy #16213E background, soft cyan #A8DADC accent, white text, sophisticated editorial layout",
    "warm_cream":   "warm cream #FFF8E7 background, rich brown #2D1B00 text, amber #D4870A accent, organic warm layout",
    "bold_orange":  "bold orange #FF6B35 background, dark #1A1A1A text, white accent elements, energetic vibrant layout",
}


def build_character_anchor_prompt(profile: dict | None) -> str:
    if not profile:
        return ""
    if profile.get("custom_description"):
        return profile["custom_description"]

    parts = []
    # Core identity
    age = profile.get("age") or "23"
    gender = profile.get("gender") or "female"
    ethnicity = profile.get("ethnicity") or "Indian"
    parts.append(f"A {age}-year-old {ethnicity} {gender} influencer")

    # Features
    features = []
    if profile.get("hair_style") or profile.get("hair_color"):
        h_style = profile.get("hair_style") or "long wavy"
        h_color = profile.get("hair_color") or "black"
        features.append(f"{h_style} {h_color} hair")
    if profile.get("eye_color"):
        features.append(f"{profile['eye_color']} eyes")
    if profile.get("facial_features"):
        features.append(profile["facial_features"])

    if features:
        parts.append("with " + ", ".join(features))

    if profile.get("expression"):
        parts.append(profile["expression"])
    else:
        parts.append("smiling warmly")

    return ", ".join(parts)


def _build_image_prompt(
    scene_visual: str,
    style: str,
    series_type: str = "regular",
    character_profile: dict | None = None,
    brand_handle: str | None = None,
    color_theme: str | None = None,
) -> str:
    suffix = _STYLE_SUFFIX.get(style, "cinematic high quality, portrait vertical 9:16")

    # Color theme override for carousel posts
    if color_theme and color_theme in _COLOR_THEMES:
        suffix = f"{suffix}, {_COLOR_THEMES[color_theme]}"

    # Brand handle watermark at top right
    brand_str = ""
    if brand_handle:
        handle = brand_handle.strip().lstrip("@")
        brand_str = f", small '@{handle}' brand watermark text at top-right corner"

    anchor = build_character_anchor_prompt(character_profile)
    if series_type == "ai_influencer" and anchor:
        clothing_keywords = ["wearing", "outfit", "costume", "dress", "suit", "jacket", "saree", "kurti", "t-shirt", "jeans", "hoodie", "top"]
        has_custom_clothing = any(w in scene_visual.lower() for w in clothing_keywords)
        clothing = character_profile.get("clothing_style")
        if clothing and not has_custom_clothing:
            anchor = f"{anchor}, wearing {clothing}"
        return f"Portrait vertical 9:16 shot of {anchor}. {scene_visual}. {suffix}{brand_str}. Ultra detailed, photorealistic, 4K."

    return f"{scene_visual}. {suffix}{brand_str}. Ultra detailed, photorealistic, 4K."


async def _gpt_image_1(prompt: str) -> str:
    """Generate image via gpt-image-1-mini, return local jpg path.

    gpt-image-1-mini: ~4x cheaper output tokens vs gpt-image-1.
    Portrait size: 1024x1536 (closest supported 9:16 ratio).
    """
    import base64
    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(
            "https://api.openai.com/v1/images/generations",
            json={
                "model": "gpt-image-1-mini",
                "prompt": prompt,
                "n": 1,
                "size": "1024x1536",
                "quality": "low",
            },
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
        )
        if not resp.is_success:
            raise Exception(f"gpt-image-1-mini error {resp.status_code}: {resp.text[:300]}")
        data = resp.json()["data"][0]
        # gpt-image-1 returns b64_json; older models return url
        b64 = data.get("b64_json") or data.get("b64")
        if b64:
            img_bytes = base64.b64decode(b64)
        else:
            # Fallback: URL-based response (shouldn't happen with gpt-image-1)
            url = data["url"]
            img_resp = await client.get(url)
            img_resp.raise_for_status()
            img_bytes = img_resp.content

    tmp = Path(tempfile.mktemp(suffix=".jpg"))
    tmp.write_bytes(img_bytes)
    return str(tmp)


def _gradient_fallback(style: str) -> str:
    colors = {
        "storytelling": "0x2D1B4E",
        "devotional": "0xFFD700",
        "motivation": "0xE74C3C",
        "business": "0x2C3E50",
        "news": "0x2980B9",
        "funny": "0xFF6B35",
    }
    color = colors.get(style, "0x1A1A2E")
    tmp = Path(tempfile.mktemp(suffix=".jpg"))
    subprocess.run(
        ["ffmpeg", "-y", "-f", "lavfi", "-i", f"color=c={color}:s=1024x1792",
         "-vframes", "1", str(tmp)],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    return str(tmp)


async def generate_image_for_scene(
    scene_visual: str,
    style: str = "motivation",
    series_type: str = "regular",
    character_profile: dict | None = None,
    brand_handle: str | None = None,
    color_theme: str | None = None,
) -> str:
    """Generate a 1024x1536 (9:16) image via gpt-image-1. Returns local jpg path."""
    if not settings.OPENAI_API_KEY:
        return _gradient_fallback(style)

    prompt = _build_image_prompt(scene_visual, style, series_type, character_profile, brand_handle, color_theme)
    print(f"[image] gpt-image-1: {prompt[:80]}...")
    try:
        path = await _gpt_image_1(prompt)
        print(f"[image] done → {path}")
        return path
    except Exception as e:
        print(f"[image] failed: {e} — using gradient fallback")
        return _gradient_fallback(style)
