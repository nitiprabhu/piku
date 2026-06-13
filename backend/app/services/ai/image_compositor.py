"""
PIL text compositor: overlays styled text/UI on GPT-image-1 backgrounds.
6 image post styles, each with template-accurate layout.
"""
from __future__ import annotations
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W, H = 1024, 1536  # 9:16 portrait

# Font paths — ordered by preference
_BOLD_FONTS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",       # confirmed in container
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    "/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf",
]
_REGULAR_FONTS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",            # confirmed in container
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    "/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf",
]


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    paths = _BOLD_FONTS if bold else _REGULAR_FONTS
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    # last resort — PIL default (no sizing)
    return ImageFont.load_default()


def _text_width(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont) -> int:
    try:
        return int(draw.textlength(text, font=font))
    except Exception:
        return len(text) * (font.size // 2)


def _wrap(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_px: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = (current + " " + word).strip()
        if _text_width(draw, candidate, font) <= max_px:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def _outline_text(draw: ImageDraw.ImageDraw, xy: tuple, text: str, font, fill, outline=(0, 0, 0), width=3):
    x, y = xy
    for dx in range(-width, width + 1):
        for dy in range(-width, width + 1):
            if dx or dy:
                draw.text((x + dx, y + dy), text, font=font, fill=outline)
    draw.text((x, y), text, font=font, fill=fill)


def _shadow_text(draw: ImageDraw.ImageDraw, xy: tuple, text: str, font, fill, offset=3):
    x, y = xy
    draw.text((x + offset, y + offset), text, font=font, fill=(0, 0, 0, 130))
    draw.text((x, y), text, font=font, fill=fill)


# ── Extractors ─────────────────────────────────────────────────────────────────

def _sentences(text: str) -> list[str]:
    import re
    parts = re.split(r"(?<=[.!?])\s+", text.strip())
    return [p.strip() for p in parts if p.strip()]


def extract_compositor_content_for_scene(scene: dict, style: str) -> dict:
    """Extract per-scene overlay text from a single scene dict (slide_headline/slide_body)."""
    headline = (scene.get("slide_headline") or scene.get("visual", ""))[:90]
    body = (scene.get("slide_body") or "")[:130]
    if style == "news_image":
        return {"headline": headline, "body": body}
    elif style == "motivation_quote":
        return {"quote": headline, "attribution": body[:60]}
    elif style == "did_you_know":
        fact = (headline + (" " + body if body else ""))[:160]
        return {"fact": fact}
    elif style == "politics":
        return {"headline": headline}
    elif style == "meme":
        return {"top_text": headline[:80], "bottom_text": body[:80]}
    elif style == "education_story":
        return {"caption": (body or headline)[:130]}
    return {}


def extract_compositor_content(script: dict, style: str) -> dict:
    """Pull relevant text from script JSON for each style's compositor."""
    narration = script.get("narration", "")
    hook = script.get("hook", "")
    sents = _sentences(narration)

    if style == "news_image":
        headline = (sents[0] if sents else hook or narration)[:90]
        body = (sents[1] if len(sents) > 1 else "")[:130]
        return {"headline": headline, "body": body}

    elif style == "motivation_quote":
        # Use hook as quote if punchy, else first 18 words of narration
        quote_src = hook or narration
        words = quote_src.split()
        quote = " ".join(words[:18]) + ("..." if len(words) > 18 else "")
        return {"quote": quote, "attribution": ""}

    elif style == "did_you_know":
        fact = (sents[0] if sents else narration)[:160]
        return {"fact": fact}

    elif style == "politics":
        headline = (sents[0] if sents else hook or narration)[:90]
        return {"headline": headline}

    elif style == "meme":
        mid = max(1, len(sents) // 2)
        top = " ".join(sents[:mid])[:80]
        bottom = " ".join(sents[mid:])[:80] if mid < len(sents) else (sents[-1] if sents else "")[:80]
        return {"top_text": top, "bottom_text": bottom}

    elif style == "education_story":
        caption = (sents[-1] if sents else narration)[:130]
        return {"caption": caption}

    return {}


# ── Style compositors ──────────────────────────────────────────────────────────

def composite_news_image(img_path: str, headline: str, body: str = "", brand: str = "") -> str:
    """Photo top 58%, white panel bottom 42% with BREAKING NEWS badge + headline."""
    img = Image.open(img_path).convert("RGB")
    img = img.resize((W, H), Image.LANCZOS)
    draw = ImageDraw.Draw(img)

    SPLIT = int(H * 0.58)
    PAD = 44
    MAX_W = W - PAD * 2

    # White bottom panel
    draw.rectangle([0, SPLIT, W, H], fill=(255, 255, 255))

    # Red accent stripe at split
    draw.rectangle([0, SPLIT, W, SPLIT + 8], fill=(210, 20, 20))

    # BREAKING NEWS red badge
    badge_y = SPLIT + 30
    badge_font = _font(26, bold=True)
    label = "BREAKING NEWS"
    lw = _text_width(draw, label, badge_font)
    bx1, by1, bx2, by2 = PAD, badge_y, PAD + lw + 32, badge_y + 52
    draw.rectangle([bx1, by1, bx2, by2], fill=(210, 20, 20))
    draw.text((bx1 + 16, by1 + 12), label, font=badge_font, fill=(255, 255, 255))

    # Headline — bold, dark, uppercase
    head_y = badge_y + 70
    head_font = _font(54, bold=True)
    for line in _wrap(draw, headline.upper(), head_font, MAX_W)[:3]:
        draw.text((PAD, head_y), line, font=head_font, fill=(15, 15, 15))
        head_y += 64

    # Body text
    if body:
        body_font = _font(28)
        body_y = head_y + 10
        for line in _wrap(draw, body, body_font, MAX_W)[:3]:
            draw.text((PAD, body_y), line, font=body_font, fill=(80, 80, 80))
            body_y += 38

    # Footer: "Read More →" left, brand right
    foot_font = _font(26, bold=True)
    draw.text((PAD, H - 58), "Read More  ->", font=foot_font, fill=(210, 20, 20))
    if brand:
        handle = f"@{brand.lstrip('@')}"
        hw = _text_width(draw, handle, foot_font)
        draw.text((W - PAD - hw, H - 58), handle, font=foot_font, fill=(140, 140, 140))

    out = img_path.replace(".jpg", "_c.jpg")
    img.save(out, "JPEG", quality=93)
    return out


def composite_motivation_quote(img_path: str, quote: str, attribution: str = "", brand: str = "") -> str:
    """Scenic bg + dark overlay + centered white quote text + gold accent."""
    img = Image.open(img_path).convert("RGBA")
    img = img.resize((W, H), Image.LANCZOS)

    # Dark overlay
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 155))
    img = Image.alpha_composite(img, ov).convert("RGB")
    draw = ImageDraw.Draw(img)

    PAD = 64
    MAX_W = W - PAD * 2

    # Opening quote mark
    qm_font = _font(130, bold=True)
    draw.text((PAD - 10, 100), '"', font=qm_font, fill=(255, 190, 0))

    # Quote text — centered
    q_font = _font(60, bold=True)
    q_lines = _wrap(draw, quote, q_font, MAX_W)
    total = len(q_lines) * 74
    start_y = max(280, (H - total) // 2 - 80)
    for line in q_lines:
        lw = _text_width(draw, line, q_font)
        _shadow_text(draw, ((W - lw) // 2, start_y), line, q_font, (255, 255, 255))
        start_y += 74

    # Gold divider
    div_y = start_y + 24
    draw.rectangle([W // 2 - 70, div_y, W // 2 + 70, div_y + 4], fill=(255, 190, 0))

    # Attribution
    if attribution:
        attr_font = _font(30)
        at = f"— {attribution}"
        aw = _text_width(draw, at, attr_font)
        draw.text(((W - aw) // 2, div_y + 20), at, font=attr_font, fill=(200, 200, 200))

    # Closing quote mark bottom-right
    draw.text((W - 90, H - 180), '"', font=qm_font, fill=(255, 190, 0))

    # Brand top-right
    if brand:
        bf = _font(26)
        handle = f"@{brand.lstrip('@')}"
        hw = _text_width(draw, handle, bf)
        draw.text((W - PAD - hw, 44), handle, font=bf, fill=(255, 255, 255))

    out = img_path.replace(".jpg", "_c.jpg")
    img.save(out, "JPEG", quality=93)
    return out


def composite_did_you_know(img_path: str, fact: str, brand: str = "") -> str:
    """Vibrant bg + dark blue overlay + DID YOU KNOW? badge + fact text."""
    img = Image.open(img_path).convert("RGBA")
    img = img.resize((W, H), Image.LANCZOS)

    ov = Image.new("RGBA", (W, H), (5, 20, 70, 185))
    img = Image.alpha_composite(img, ov).convert("RGB")
    draw = ImageDraw.Draw(img)

    PAD = 50
    MAX_W = W - PAD * 2

    # DID YOU KNOW? yellow badge centered
    badge_font = _font(42, bold=True)
    label = "DID YOU KNOW?"
    lw = _text_width(draw, label, badge_font)
    bx = (W - lw - 40) // 2
    by = 180
    draw.rectangle([bx, by, bx + lw + 40, by + 66], fill=(255, 200, 0))
    draw.text((bx + 20, by + 12), label, font=badge_font, fill=(20, 20, 20))

    # Separator
    sep_y = by + 100
    draw.rectangle([W // 2 - 80, sep_y, W // 2 + 80, sep_y + 4], fill=(255, 200, 0))

    # Fact text centered
    fact_font = _font(50, bold=True)
    fact_y = sep_y + 50
    for line in _wrap(draw, fact, fact_font, MAX_W)[:5]:
        lw2 = _text_width(draw, line, fact_font)
        draw.text(((W - lw2) // 2, fact_y), line, font=fact_font, fill=(255, 255, 255))
        fact_y += 64

    # Brand top-right
    if brand:
        bf = _font(26)
        handle = f"@{brand.lstrip('@')}"
        hw = _text_width(draw, handle, bf)
        draw.text((W - PAD - hw, 44), handle, font=bf, fill=(255, 255, 255))

    out = img_path.replace(".jpg", "_c.jpg")
    img.save(out, "JPEG", quality=93)
    return out


def composite_politics(img_path: str, headline: str, brand: str = "") -> str:
    """Photo top 52%, dark navy panel bottom with tricolor stripe + bold headline."""
    img = Image.open(img_path).convert("RGB")
    img = img.resize((W, H), Image.LANCZOS)
    draw = ImageDraw.Draw(img)

    SPLIT = int(H * 0.52)
    PAD = 44
    MAX_W = W - PAD * 2

    # Dark navy bottom panel
    draw.rectangle([0, SPLIT, W, H], fill=(10, 14, 38))

    # Indian tricolor stripe
    s = 9
    draw.rectangle([0, SPLIT, W, SPLIT + s], fill=(255, 103, 0))
    draw.rectangle([0, SPLIT + s, W, SPLIT + s * 2], fill=(255, 255, 255))
    draw.rectangle([0, SPLIT + s * 2, W, SPLIT + s * 3], fill=(19, 136, 8))

    # "POLITICS" label
    lbl_y = SPLIT + s * 3 + 30
    lbl_font = _font(28, bold=True)
    draw.text((PAD, lbl_y), "POLITICS  |  OPINION", font=lbl_font, fill=(255, 165, 0))

    # Headline
    head_y = lbl_y + 56
    head_font = _font(60, bold=True)
    for line in _wrap(draw, headline, head_font, MAX_W)[:4]:
        draw.text((PAD, head_y), line, font=head_font, fill=(255, 255, 255))
        head_y += 72

    # Brand top-right (on photo portion)
    if brand:
        bf = _font(26, bold=True)
        handle = f"@{brand.lstrip('@')}"
        hw = _text_width(draw, handle, bf)
        draw.text((W - 40 - hw, 40), handle, font=bf, fill=(255, 255, 255))

    out = img_path.replace(".jpg", "_c.jpg")
    img.save(out, "JPEG", quality=93)
    return out


def composite_meme(img_path: str, top_text: str, bottom_text: str, brand: str = "") -> str:
    """Classic meme: Impact-style white+black-outline text top and bottom."""
    img = Image.open(img_path).convert("RGB")
    img = img.resize((W, H), Image.LANCZOS)
    draw = ImageDraw.Draw(img)

    PAD = 30
    MAX_W = W - PAD * 2
    m_font = _font(76, bold=True)

    if top_text:
        ty = 36
        for line in _wrap(draw, top_text.upper(), m_font, MAX_W)[:3]:
            lw = _text_width(draw, line, m_font)
            _outline_text(draw, ((W - lw) // 2, ty), line, m_font, (255, 255, 255), width=4)
            ty += 90

    if bottom_text:
        lines = _wrap(draw, bottom_text.upper(), m_font, MAX_W)[:3]
        by = H - 40 - len(lines) * 90
        for line in lines:
            lw = _text_width(draw, line, m_font)
            _outline_text(draw, ((W - lw) // 2, by), line, m_font, (255, 255, 255), width=4)
            by += 90

    if brand:
        bf = _font(26, bold=True)
        handle = f"@{brand.lstrip('@')}"
        hw = _text_width(draw, handle, bf)
        _outline_text(draw, (W - PAD - hw, 36), handle, bf, (255, 255, 255), width=2)

    out = img_path.replace(".jpg", "_c.jpg")
    img.save(out, "JPEG", quality=93)
    return out


def composite_education_story(img_path: str, caption: str, brand: str = "") -> str:
    """Illustrated bg + green semi-transparent bottom panel + white caption."""
    img = Image.open(img_path).convert("RGBA")
    img = img.resize((W, H), Image.LANCZOS)

    PANEL_Y = int(H * 0.68)
    panel = Image.new("RGBA", (W, H - PANEL_Y), (15, 50, 15, 215))
    img.paste(panel, (0, PANEL_Y), panel)
    img = img.convert("RGB")
    draw = ImageDraw.Draw(img)

    PAD = 44
    MAX_W = W - PAD * 2

    cap_font = _font(38, bold=True)
    cap_y = PANEL_Y + 32
    for line in _wrap(draw, caption, cap_font, MAX_W)[:4]:
        draw.text((PAD, cap_y), line, font=cap_font, fill=(255, 255, 255))
        cap_y += 52

    if brand:
        bf = _font(26)
        handle = f"@{brand.lstrip('@')}"
        hw = _text_width(draw, handle, bf)
        draw.text((W - PAD - hw, 40), handle, font=bf, fill=(255, 255, 255))

    out = img_path.replace(".jpg", "_c.jpg")
    img.save(out, "JPEG", quality=93)
    return out


# ── Main entry point ───────────────────────────────────────────────────────────

IMAGE_STYLES = {"news_image", "motivation_quote", "did_you_know", "politics", "meme", "education_story"}


def composite_image(img_path: str, style: str, content: dict, brand: str = "") -> str:
    """
    Apply text overlay for a given image style.
    Returns path to composited image (or original if style not in IMAGE_STYLES).
    """
    if style not in IMAGE_STYLES:
        return img_path
    try:
        if style == "news_image":
            return composite_news_image(img_path, content.get("headline", ""), content.get("body", ""), brand)
        elif style == "motivation_quote":
            return composite_motivation_quote(img_path, content.get("quote", ""), content.get("attribution", ""), brand)
        elif style == "did_you_know":
            return composite_did_you_know(img_path, content.get("fact", ""), brand)
        elif style == "politics":
            return composite_politics(img_path, content.get("headline", ""), brand)
        elif style == "meme":
            return composite_meme(img_path, content.get("top_text", ""), content.get("bottom_text", ""), brand)
        elif style == "education_story":
            return composite_education_story(img_path, content.get("caption", ""), brand)
    except Exception as e:
        print(f"[compositor] {style} failed: {e} — using raw image")
    return img_path
