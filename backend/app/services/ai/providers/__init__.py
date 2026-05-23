from app.config import settings
from app.services.ai.providers.base import VideoProvider
from app.services.ai.providers.muapi import MuAPIProvider
from app.services.ai.providers.falai import FalAIWanCheapProvider

# All plans use WAN 1.3B (fal.ai) — cheapest viable model.
# Clip count is the only differentiator between plans.
_AUTO_MAX_CLIPS = {
    "free":     2,
    "starter":  2,
    "pro":      3,
    "business": 4,
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
