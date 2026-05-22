from app.config import settings
from app.services.ai.providers.base import VideoProvider
from app.services.ai.providers.muapi import MuAPIProvider
from app.services.ai.providers.kling import KlingProvider
from app.services.ai.providers.falai import FalAIProvider, FalAIWanCheapProvider

# Explicit override: VIDEO_PROVIDER=kling|falai|muapi
_EXPLICIT = {
    "muapi": MuAPIProvider,
    "kling": KlingProvider,        # kling-v1 std — cheapest Kling
    "falai": FalAIProvider,        # Kling v1.6 via fal.ai
    "falai-wan": FalAIWanCheapProvider,  # WAN 1.3B — absolute cheapest
}

# auto mode: same cheap model for all plans, only clips differ
# free/starter = 2 clips (WAN 1.3B via fal.ai ~₹1/clip)
# pro          = 3 clips (Kling v1 std ~₹4/clip)
# business     = 4 clips (Kling v1 std ~₹4/clip)
_AUTO_PROVIDER = {
    "free":     FalAIWanCheapProvider,
    "starter":  FalAIWanCheapProvider,
    "pro":      KlingProvider,
    "business": KlingProvider,
}

_AUTO_MAX_CLIPS = {
    "free":     2,
    "starter":  2,
    "pro":      3,
    "business": 4,
}


def get_video_provider(use_premium: bool = False, plan: str = "free") -> VideoProvider:
    """
    use_premium is ignored — same model for all users, differentiation via clip count only.
    VIDEO_PROVIDER=auto  → WAN 1.3B for free/starter, Kling v1 std for paid
    VIDEO_PROVIDER=kling → Kling v1 std for everyone
    VIDEO_PROVIDER=falai-wan → WAN 1.3B for everyone (absolute cheapest)
    """
    mode = settings.VIDEO_PROVIDER.lower()

    if mode != "auto":
        cls = _EXPLICIT.get(mode)
        if cls is None:
            print(f"Unknown VIDEO_PROVIDER={mode!r}, falling back to kling")
            cls = KlingProvider
        return cls()

    cls = _AUTO_PROVIDER.get(plan, FalAIWanCheapProvider)
    return cls()


def get_max_clips(plan: str) -> int:
    if settings.VIDEO_PROVIDER.lower() != "auto":
        return 4  # no cap when provider forced
    return _AUTO_MAX_CLIPS.get(plan, 2)
