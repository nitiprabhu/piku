from fastapi import WebSocket, WebSocketDisconnect, APIRouter
import redis.asyncio as aioredis
import json
from app.config import settings

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/{job_id}")
async def websocket_job_progress(websocket: WebSocket, job_id: str):
    await websocket.accept()

    redis = await aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    pubsub = redis.pubsub()
    await pubsub.subscribe(f"job:{job_id}")

    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])

                # Cache latest status for HTTP polling fallback
                await redis.setex(
                    f"job_status:{job_id}",
                    3600,  # 1 hour TTL
                    json.dumps(data),
                )

                await websocket.send_json(data)

                if data.get("event") in ("completed", "failed"):
                    break
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        await pubsub.unsubscribe(f"job:{job_id}")
        await redis.aclose()
