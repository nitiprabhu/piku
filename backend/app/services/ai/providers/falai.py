import asyncio
import tempfile
import httpx
from pathlib import Path
from app.config import settings
from app.services.ai.providers.base import VideoProvider

# fal.ai queue API: https://fal.ai/docs/model-endpoints/queue
# Models: fal-ai/kling-video/v1.6/standard/text-to-video
#         fal-ai/kling-video/v2/standard/text-to-video  (pro)
#         fal-ai/wan/v2.1/1.3b/text-to-video


class FalAIProvider(VideoProvider):
    QUEUE_BASE = "https://queue.fal.run"
    POLL_INTERVAL = 5
    MAX_POLLS = 72

    def __init__(self, model: str = "fal-ai/kling-video/v1.6/standard/text-to-video"):
        self.model = model

    @property
    def is_configured(self) -> bool:
        return bool(settings.FALAI_API_KEY)

    def _headers(self) -> dict:
        return {
            "Authorization": f"Key {settings.FALAI_API_KEY}",
            "Content-Type": "application/json",
        }

    def _model_url(self) -> str:
        return f"{self.QUEUE_BASE}/{self.model}"

    async def _submit(self, prompt: str, duration: int) -> str:
        payload = {
            "prompt": prompt,
            "aspect_ratio": "9:16",
            "duration": str(min(duration, 10)),
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(self._model_url(), json=payload, headers=self._headers())
            if not resp.is_success:
                print(f"fal.ai submit {resp.status_code}: {resp.text[:500]}")
            resp.raise_for_status()
            data = resp.json()
            request_id = data.get("request_id")
            if not request_id:
                raise Exception(f"No request_id from fal.ai: {data}")
            print(f"fal.ai submitted request_id={request_id}")
            return request_id

    async def _poll(self, request_id: str) -> str:
        status_url = f"{self._model_url()}/requests/{request_id}/status"
        result_url = f"{self._model_url()}/requests/{request_id}"
        async with httpx.AsyncClient(timeout=30) as client:
            for attempt in range(self.MAX_POLLS):
                resp = await client.get(status_url, headers=self._headers())
                data = resp.json()
                status = data.get("status", "")
                if attempt % 6 == 0:
                    print(f"fal.ai {request_id[:8]}... status={status} attempt={attempt}")
                if status == "COMPLETED":
                    result_resp = await client.get(result_url, headers=self._headers())
                    result = result_resp.json()
                    video_url = (
                        result.get("video", {}).get("url")
                        or (result.get("videos") or [{}])[0].get("url")
                    )
                    if not video_url:
                        raise Exception(f"fal.ai completed but no video URL: {result}")
                    return video_url
                elif status == "FAILED":
                    raise Exception(f"fal.ai job failed: {data.get('error') or data}")
                await asyncio.sleep(self.POLL_INTERVAL)
        raise TimeoutError(f"fal.ai request {request_id} timed out")

    async def generate_clip(self, prompt: str, duration: int) -> str:
        request_id = await self._submit(prompt, duration)
        video_url = await self._poll(request_id)

        tmp = Path(tempfile.mktemp(suffix=".mp4"))
        async with httpx.AsyncClient(timeout=180) as client:
            resp = await client.get(video_url)
            resp.raise_for_status()
            tmp.write_bytes(resp.content)
        return str(tmp)


class FalAIWanCheapProvider(FalAIProvider):
    """
    WAN 2.1 1.3B — cheapest real video model on fal.ai.
    ~₹1/clip vs ₹4+ for Kling. Lower quality but acceptable for free/starter tier.
    """

    def __init__(self):
        super().__init__(model="fal-ai/wan/v2.1/1.3b/text-to-video")

    async def _submit(self, prompt: str, duration: int) -> str:
        # WAN 2.1 1.3B accepts different payload shape
        payload = {
            "prompt": prompt,
            "num_frames": 49 if duration <= 5 else 81,  # ~2s or ~4s at 24fps
            "resolution": "480p",  # cheaper than 720p
            "aspect_ratio": "9:16",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(self._model_url(), json=payload, headers=self._headers())
            if not resp.is_success:
                print(f"fal.ai WAN submit {resp.status_code}: {resp.text[:500]}")
            resp.raise_for_status()
            data = resp.json()
            request_id = data.get("request_id")
            if not request_id:
                raise Exception(f"No request_id from fal.ai WAN: {data}")
            return request_id


class FalAIPremiumProvider(FalAIProvider):
    """Kling v2 via fal.ai for premium users."""

    def __init__(self):
        super().__init__(model="fal-ai/kling-video/v2/standard/text-to-video")
