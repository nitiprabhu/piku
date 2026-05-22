import asyncio
import tempfile
import httpx
from pathlib import Path
from app.config import settings
from app.services.ai.providers.base import VideoProvider


class MuAPIProvider(VideoProvider):
    BASE_URL = "https://api.muapi.ai/api/v1"
    POLL_INTERVAL = 5
    MAX_POLLS = 60

    @property
    def is_configured(self) -> bool:
        key = settings.MUAPI_API_KEY
        return bool(key) and key not in ("", "...", "sk-...") and len(key) >= 5

    def _headers(self) -> dict:
        return {"x-api-key": settings.MUAPI_API_KEY, "Content-Type": "application/json"}

    async def _submit(self, endpoint: str, payload: dict) -> str:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{self.BASE_URL}/{endpoint}", json=payload, headers=self._headers()
            )
            if not resp.is_success:
                print(f"MuAPI {endpoint} submit {resp.status_code}: {resp.text[:500]}")
            resp.raise_for_status()
            data = resp.json()
            request_id = data.get("request_id") or data.get("job_id") or data.get("id")
            if not request_id:
                raise Exception(f"No request_id in MuAPI response: {data}")
            return request_id

    async def _poll(self, request_id: str) -> str:
        async with httpx.AsyncClient(timeout=180) as client:
            for attempt in range(self.MAX_POLLS):
                resp = await client.get(
                    f"{self.BASE_URL}/predictions/{request_id}/result",
                    headers=self._headers(),
                )
                data = resp.json()
                status = data.get("status", "")
                if attempt % 6 == 0:
                    print(f"MuAPI {request_id[:8]}... status={status} attempt={attempt}")
                if status == "completed":
                    outputs = data.get("outputs", [])
                    if not outputs:
                        raise Exception(f"MuAPI completed but no outputs: {data}")
                    return outputs[0]
                elif status in ("failed", "error"):
                    raise Exception(f"MuAPI job failed: {data.get('error') or data}")
                await asyncio.sleep(self.POLL_INTERVAL)
        raise TimeoutError(f"MuAPI job {request_id} timed out")

    async def generate_clip(self, prompt: str, duration: int) -> str:
        model = "wan2.1-text-to-video"
        wan_duration = 10 if duration >= 8 else 5
        request_id = await self._submit(model, {"prompt": prompt, "duration": wan_duration})
        video_url = await self._poll(request_id)

        tmp = Path(tempfile.mktemp(suffix=".mp4"))
        async with httpx.AsyncClient(timeout=180) as client:
            resp = await client.get(video_url)
            resp.raise_for_status()
            tmp.write_bytes(resp.content)
        return str(tmp)


class MuAPIPremiumProvider(MuAPIProvider):
    """VEO3 variant for pro users."""

    async def generate_clip(self, prompt: str, duration: int) -> str:
        wan_duration = 10 if duration >= 8 else 5
        request_id = await self._submit(
            "veo3-text-to-video", {"prompt": prompt, "duration": wan_duration}
        )
        video_url = await self._poll(request_id)

        tmp = Path(tempfile.mktemp(suffix=".mp4"))
        async with httpx.AsyncClient(timeout=180) as client:
            resp = await client.get(video_url)
            resp.raise_for_status()
            tmp.write_bytes(resp.content)
        return str(tmp)
