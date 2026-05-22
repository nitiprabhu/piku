import asyncio
import tempfile
import time
import httpx
from pathlib import Path
from jose import jwt as jose_jwt
from app.config import settings
from app.services.ai.providers.base import VideoProvider

# Kling API docs: https://platform.klingai.com/docs
# Auth: HS256 JWT signed with access_key_secret, iss=access_key_id


class KlingProvider(VideoProvider):
    BASE_URL = "https://api.klingai.com"
    POLL_INTERVAL = 5
    MAX_POLLS = 72  # 6 min

    def __init__(self, model: str = "kling-v1", mode: str = "std"):
        self.model = model
        self.mode = mode  # std = cheaper, pro = better quality

    @property
    def is_configured(self) -> bool:
        return bool(settings.KLING_ACCESS_KEY_ID and settings.KLING_ACCESS_KEY_SECRET)

    def _auth_token(self) -> str:
        now = int(time.time())
        payload = {
            "iss": settings.KLING_ACCESS_KEY_ID,
            "exp": now + 1800,
            "nbf": now - 5,
        }
        return jose_jwt.encode(payload, settings.KLING_ACCESS_KEY_SECRET, algorithm="HS256")

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._auth_token()}",
            "Content-Type": "application/json",
        }

    async def _submit(self, prompt: str, duration: int) -> str:
        # Kling duration must be "5" or "10"
        kling_duration = "10" if duration >= 8 else "5"
        payload = {
            "model_name": self.model,
            "mode": self.mode,
            "prompt": prompt,
            "aspect_ratio": "9:16",
            "duration": kling_duration,
            "cfg_scale": 0.5,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{self.BASE_URL}/v1/videos/text2video",
                json=payload,
                headers=self._headers(),
            )
            if not resp.is_success:
                print(f"Kling submit {resp.status_code}: {resp.text[:500]}")
            resp.raise_for_status()
            data = resp.json()
            task_id = data.get("data", {}).get("task_id")
            if not task_id:
                raise Exception(f"No task_id in Kling response: {data}")
            print(f"Kling submitted task_id={task_id}")
            return task_id

    async def _poll(self, task_id: str) -> str:
        async with httpx.AsyncClient(timeout=30) as client:
            for attempt in range(self.MAX_POLLS):
                resp = await client.get(
                    f"{self.BASE_URL}/v1/videos/text2video/{task_id}",
                    headers=self._headers(),
                )
                data = resp.json().get("data", {})
                status = data.get("task_status", "")
                if attempt % 6 == 0:
                    print(f"Kling {task_id[:8]}... status={status} attempt={attempt}")
                if status == "succeed":
                    videos = data.get("task_result", {}).get("videos", [])
                    if not videos:
                        raise Exception(f"Kling succeed but no videos: {data}")
                    return videos[0]["url"]
                elif status == "failed":
                    raise Exception(f"Kling job failed: {data.get('task_status_msg') or data}")
                await asyncio.sleep(self.POLL_INTERVAL)
        raise TimeoutError(f"Kling task {task_id} timed out")

    async def generate_clip(self, prompt: str, duration: int) -> str:
        task_id = await self._submit(prompt, duration)
        video_url = await self._poll(task_id)

        tmp = Path(tempfile.mktemp(suffix=".mp4"))
        async with httpx.AsyncClient(timeout=180) as client:
            resp = await client.get(video_url)
            resp.raise_for_status()
            tmp.write_bytes(resp.content)
        return str(tmp)


class KlingStandardProvider(KlingProvider):
    """Kling v1.6 std — paid non-premium users."""

    def __init__(self):
        super().__init__(model="kling-v1-6", mode="std")


class KlingPremiumProvider(KlingProvider):
    """Kling v1.6 pro mode — business/premium users."""

    def __init__(self):
        super().__init__(model="kling-v1-6", mode="pro")
