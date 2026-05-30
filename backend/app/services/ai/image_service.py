import asyncio
import subprocess
import tempfile
import httpx
from pathlib import Path
from app.config import settings


_STYLE_SUFFIX = {
    "storytelling": "dramatic cinematic lighting, epic mythological or historical aesthetic, no text no watermark, portrait vertical 9:16",
    "devotional": "soft golden light, serene spiritual atmosphere, no text no watermark, portrait vertical 9:16",
    "motivation": "powerful epic composition, dramatic lighting, no text no watermark, portrait vertical 9:16",
    "funny": "vibrant colorful, expressive comedic context, no text no watermark, portrait vertical 9:16",
    "business": "professional clean modern, no text no watermark, portrait vertical 9:16",
    "news": "dramatic journalistic high contrast, no text no watermark, portrait vertical 9:16",
    "mystery": "dark mysterious atmosphere, dim dramatic lighting, ancient ruins or cryptic settings, eerie shadows, no text no watermark, portrait vertical 9:16",
    "facts": "bold informative aesthetic, bright infographic feel, dramatic reveal lighting, clean composition, no text no watermark, portrait vertical 9:16",
    "scary": "dark horror atmosphere, pitch-black shadows, eerie abandoned settings, unsettling mood, cold blue or green tint, no text no watermark, portrait vertical 9:16",
    "anime": "anime art style, cel-shaded vibrant colors, manga-inspired composition, dramatic speed lines, Studio Ghibli or shonen aesthetic, no text no watermark, portrait vertical 9:16",
    "relationship": "warm emotional aesthetic, soft golden hour lighting, intimate bokeh, tender mood, romantic or melancholic tones, no text no watermark, portrait vertical 9:16",
    "heist_crime": "crime noir aesthetic, dark dramatic shadows, high contrast, urban night setting, surveillance camera grain feel, no text no watermark, portrait vertical 9:16",
    "daily_routine": "casual vlog aesthetic, bright natural morning light, clean modern apartment background, handheld camera feel, portrait vertical 9:16",
    "outfit_check": "fashion photoshoot look, studio lighting, aesthetic mirror reflections or clean wardrobe background, high-end lifestyle style, portrait vertical 9:16",
    "dance_trend": "high energy motion blur, neon accent lighting, trendy urban street or studio background, dynamic action capture, portrait vertical 9:16",
    "travel_vlog": "cinematic travel photography, scenic outdoor landmark background, golden hour sunlight, adventurous cinematic feel, portrait vertical 9:16",
    "product_review": "clean product display, professional soft box lighting, blurred studio background, close-up details, portrait vertical 9:16",
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
    character_profile: dict | None = None
) -> str:
    suffix = _STYLE_SUFFIX.get(style, "cinematic high quality, no text no watermark, portrait vertical 9:16")
    
    # Force character consistency for anime style
    if style == "anime":
        anime_anchor = "A young anime protagonist with spiky black hair, intense eyes, wearing a crimson and black high-collar jacket"
        return f"{anime_anchor}. {scene_visual}. {suffix}. Ultra detailed, photorealistic, 4K."

    anchor = build_character_anchor_prompt(character_profile)
    if series_type == "ai_influencer" and anchor:
        # If the scene visual description specifies the character's clothing, do not force the static profile clothing.
        clothing_keywords = ["wearing", "outfit", "costume", "dress", "suit", "jacket", "saree", "kurti", "t-shirt", "jeans", "hoodie", "top"]
        has_custom_clothing = any(w in scene_visual.lower() for w in clothing_keywords)
        clothing = character_profile.get("clothing_style")
        if clothing and not has_custom_clothing:
            anchor = f"{anchor}, wearing {clothing}"
        return f"Portrait vertical 9:16 shot of {anchor}. {scene_visual}. {suffix}. Ultra detailed, photorealistic, 4K."
        
    return f"{scene_visual}. {suffix}. Ultra detailed, photorealistic, 4K."


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
    character_profile: dict | None = None
) -> str:
    """Generate a 1024x1536 (9:16) image via gpt-image-1. Returns local jpg path."""
    if not settings.OPENAI_API_KEY:
        return _gradient_fallback(style)

    prompt = _build_image_prompt(scene_visual, style, series_type, character_profile)
    print(f"[image] gpt-image-1: {prompt[:80]}...")
    try:
        path = await _gpt_image_1(prompt)
        print(f"[image] done → {path}")
        return path
    except Exception as e:
        print(f"[image] failed: {e} — using gradient fallback")
        return _gradient_fallback(style)
