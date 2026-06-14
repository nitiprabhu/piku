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
    "cinematic": "epic narrative scale, dramatic cinematic color grading, wide-angle lens, film grain, portrait vertical 9:16",
    "asmr": "ultra-detailed macro photography, extremely crisp lighting, tactile texture focus, shallow depth of field, portrait vertical 9:16",
    "ugc": "handheld selfie camera look, slight blur, natural daylight, authentic casual environment, portrait vertical 9:16",
    "marketing": "dynamic commercial photography, bright optimistic lighting, high contrast vibrant colors, clean aesthetic, portrait vertical 9:16",
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
        return f"Portrait vertical 9:16 shot of {anchor}, professional studio lighting, shallow depth of field. {scene_visual}. {suffix}{brand_str}. Ultra detailed, photorealistic, cinematic color grading, 4K."

    # Cinematic camera direction for richer, more dynamic visuals
    CAMERA_ANGLES = [
        "Shot on 35mm lens, dramatic rim lighting, shallow depth of field",
        "Wide-angle cinematic composition, golden hour lighting, lens flare",
        "Close-up portrait shot, Rembrandt lighting, bokeh background",
        "Aerial establishing shot, moody atmosphere, volumetric fog",
        "Low-angle dramatic shot, strong backlight, silhouette edges",
        "Medium shot, soft diffused lighting, film grain texture",
    ]
    import hashlib
    angle_idx = int(hashlib.md5(scene_visual.encode()).hexdigest(), 16) % len(CAMERA_ANGLES)
    camera = CAMERA_ANGLES[angle_idx]
    
    # Crucial directive for Ken Burns panning: we need negative space so the zoom doesn't crop the subject
    composition_directive = "Center-weighted composition with ample negative space around the subject. No text, no fonts, no UI elements, no watermarks."
    
    return f"{camera}. {scene_visual}. {suffix}{brand_str}. {composition_directive} Ultra detailed, photorealistic, cinematic color grading, 8K resolution."


async def _falai_flux_schnell(prompt: str) -> str:
    """Generate image via fal.ai Flux.1 [schnell], return local jpg path.
    Cost: ~$0.003 per image. Speed: <1s.
    """
    import base64
    if not settings.FALAI_API_KEY:
        raise Exception("FALAI_API_KEY is missing in .env")

    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(
            "https://queue.fal.run/fal-ai/flux/schnell",
            json={
                "prompt": prompt,
                "image_size": "portrait_16_9",
                "num_inference_steps": 4
            },
            headers={
                "Authorization": f"Key {settings.FALAI_API_KEY}",
                "Content-Type": "application/json",
            },
        )
        if not resp.is_success:
            raise Exception(f"Flux error {resp.status_code}: {resp.text[:300]}")
        data = resp.json()
        img_url = data["images"][0]["url"]
        
        # Download the image
        img_resp = await client.get(img_url)
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
    plan: str = "free",
    scene_index: int = 0,
    first_scene_visual: str | None = None,
) -> str:
    """Generate a 1080x1920 (9:16) image via Flux.1 Schnell. Returns local jpg path."""
    if not settings.FALAI_API_KEY and not settings.MOCK_AI:
        return _gradient_fallback(style)

    # Visual consistency: reference first scene's palette for scenes 2+
    if scene_index > 0 and first_scene_visual:
        scene_visual = f"{scene_visual}. Maintain consistent color palette, lighting style, and visual tone matching this scene: {first_scene_visual[:100]}"

    prompt = _build_image_prompt(scene_visual, style, series_type, character_profile, brand_handle, color_theme)
    
    if settings.MOCK_AI:
        print(f"[image] MOCK_AI enabled. Searching Pexels for: {scene_visual[:40]} (Page {scene_index + 1})")
        query = " ".join(scene_visual.replace(",", "").split()[:4])
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"https://api.pexels.com/v1/search?query={query}&orientation=portrait&per_page=1&page={scene_index + 1}",
                    headers={"Authorization": "F1DT3STe9ZgiQal4X9ABmbonXm2vUeFvwxr9j5TdhWqDFzDfmlJPvshE"}
                )
                data = resp.json()
                if "photos" in data and len(data["photos"]) > 0:
                    img_url = data["photos"][0]["src"]["large2x"]
                else:
                    # Fallback to general aesthetic query if no results
                    resp = await client.get(
                        f"https://api.pexels.com/v1/search?query=aesthetic&orientation=portrait&per_page=1&page={scene_index + 1}",
                        headers={"Authorization": "F1DT3STe9ZgiQal4X9ABmbonXm2vUeFvwxr9j5TdhWqDFzDfmlJPvshE"}
                    )
                    img_url = resp.json()["photos"][0]["src"]["large2x"]
                
                img_resp = await client.get(img_url)
                img_bytes = img_resp.content
                tmp = Path(tempfile.mktemp(suffix=".jpg"))
                tmp.write_bytes(img_bytes)
                return str(tmp)
        except Exception as e:
            print(f"[image] Pexels mock failed: {e}. Falling back to gradient.")
            return _gradient_fallback(style)

    print(f"[image] Flux.1 Schnell: {prompt[:80]}...")
    try:
        path = await _falai_flux_schnell(prompt)
        print(f"[image] done → {path}")
        return path
    except Exception as e:
        print(f"[image] failed: {e} — using gradient fallback")
        return _gradient_fallback(style)
