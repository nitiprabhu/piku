from abc import ABC, abstractmethod


class VideoProvider(ABC):
    """
    Contract: generate_clip returns a local mp4 path.
    Raises on failure — caller handles fallback.
    """

    @abstractmethod
    async def generate_clip(self, prompt: str, duration: int) -> str:
        ...

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        ...
