import httpx
import asyncio
from app.config import settings


class MuAPIClient:
    BASE_URL = "https://api.muapi.ai/api/v1"
    POLL_INTERVAL = 5
    MAX_POLLS = 60  # 5 min timeout

    def __init__(self):
        self.headers = {
            "x-api-key": settings.MUAPI_API_KEY,
            "Content-Type": "application/json",
        }

    async def submit_job(self, endpoint: str, payload: dict) -> str:
        """Submit a job. Returns request_id."""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.BASE_URL}/{endpoint}",
                json=payload,
                headers=self.headers,
            )
            if not response.is_success:
                print(f"⚠️ MuAPI {endpoint} submit {response.status_code}: {response.text[:500]}")
            response.raise_for_status()
            data = response.json()
            print(f"🔵 MuAPI {endpoint} submit: {data}")
            request_id = data.get("request_id") or data.get("job_id") or data.get("id")
            if not request_id:
                raise Exception(f"No request_id in MuAPI response: {data}")
            return request_id

    async def poll_job(self, request_id: str) -> dict:
        """Poll GET /api/v1/predictions/{id}/result until completed.
        Returns dict with 'outputs' list of URLs."""
        async with httpx.AsyncClient(timeout=180) as client:
            for attempt in range(self.MAX_POLLS):
                response = await client.get(
                    f"{self.BASE_URL}/predictions/{request_id}/result",
                    headers=self.headers,
                )
                data = response.json()
                status = data.get("status", "")
                if attempt % 6 == 0:
                    print(f"🔄 MuAPI {request_id[:8]}... status={status} (attempt {attempt})")
                if status == "completed":
                    print(f"✅ MuAPI {request_id[:8]} done: outputs={data.get('outputs')}")
                    return data
                elif status in ("failed", "error"):
                    raise Exception(f"MuAPI job failed: {data.get('error') or data.get('message') or data}")
                await asyncio.sleep(self.POLL_INTERVAL)
        raise TimeoutError(f"MuAPI job {request_id} timed out after {self.MAX_POLLS * self.POLL_INTERVAL}s")

    async def run(self, endpoint: str, payload: dict) -> dict:
        """Submit + poll. Result has 'outputs': [url, ...]"""
        request_id = await self.submit_job(endpoint, payload)
        return await self.poll_job(request_id)
