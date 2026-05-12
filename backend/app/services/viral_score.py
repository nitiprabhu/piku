def calculate_viral_score(script: dict, duration: int, style: str) -> float:
    """Rule-based viral score 0–100 for MVP."""
    score = 0.0

    # Hook strength (0–30 pts)
    hook = script.get("hook", "")
    if "?" in hook:
        score += 20
    elif "!" in hook:
        score += 15
    elif len(hook) > 40:
        score += 10
    else:
        score += 5

    # Caption quality (0–25 pts)
    caption = script.get("caption", "")
    hashtags = script.get("hashtags", [])
    if len(caption) > 50:
        score += 10
    if len(hashtags) >= 8:
        score += 15
    elif len(hashtags) >= 4:
        score += 8

    # Duration (0–20 pts) — 30s reels currently perform best
    score += {30: 20, 60: 15, 90: 10}.get(duration, 10)

    # Style bonus (0–15 pts)
    score += {
        "funny": 15,
        "motivation": 12,
        "devotional": 10,
        "business": 8,
        "news": 6,
    }.get(style, 8)

    # Scene variety (0–10 pts)
    scene_count = len(script.get("scenes", []))
    if scene_count >= 5:
        score += 10
    elif scene_count >= 3:
        score += 7
    else:
        score += 3

    return min(round(score, 1), 100.0)
