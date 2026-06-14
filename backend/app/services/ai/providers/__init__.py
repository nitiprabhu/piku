from app.config import settings
from app.services.ai.providers.base import VideoProvider
from app.services.ai.providers.muapi import MuAPIProvider
from app.services.ai.providers.falai import FalAIWanCheapProvider, FalAIProvider

# Clip count and image quality are tiered by plan.
# Free/Starter use gpt-image-1-mini, Pro uses gpt-image-1, Business uses gpt-image-1 high.
_AUTO_MAX_CLIPS = {
    "free":     5,   # 5×6s = ~30s
    "starter":  6,   # 6×6s = ~36s
    "pro":      8,   # 8×7s = ~56s
    "business": 12,  # 12×7.5s = ~90s
}


def get_video_provider(use_premium: bool = False, plan: str = "free") -> VideoProvider:
    """
    WAN 1.3B via fal.ai for lower tiers. Kling text-to-video for Business.
    VIDEO_PROVIDER=muapi forces MuAPI WAN2.1 instead.
    """
    if settings.VIDEO_PROVIDER.lower() == "muapi":
        return MuAPIProvider()
    if plan == "business":
        return FalAIProvider()  # Kling text-to-video
    return FalAIWanCheapProvider()


def get_max_clips(plan: str) -> int:
    return _AUTO_MAX_CLIPS.get(plan, 2)
