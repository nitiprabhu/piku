from app.config import settings
from app.services.ai.providers.base import VideoProvider
from app.services.ai.providers.muapi import MuAPIProvider
from app.services.ai.providers.falai import FalAIWanCheapProvider

# All plans use WAN 1.3B (fal.ai) — cheapest viable model.
# Clip count is the only differentiator between plans.
_AUTO_MAX_CLIPS = {
    "free":     4,   # 4×7s = ~28s
    "starter":  5,   # 5×7s = ~35s
    "pro":      7,   # 7×8s = ~56s
    "business": 9,   # 9×10s = ~90s
}


def get_video_provider(use_premium: bool = False, plan: str = "free") -> VideoProvider:
    """
    WAN 1.3B via fal.ai for all plans.
    VIDEO_PROVIDER=muapi forces MuAPI WAN2.1 instead.
    """
    if settings.VIDEO_PROVIDER.lower() == "muapi":
        return MuAPIProvider()
    return FalAIWanCheapProvider()


def get_max_clips(plan: str) -> int:
    return _AUTO_MAX_CLIPS.get(plan, 2)
