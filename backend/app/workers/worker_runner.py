"""RQ worker process entry point."""
import redis
import rq
from app.config import settings


def main():
    redis_conn = redis.Redis.from_url(settings.REDIS_URL)
    worker = rq.Worker(
        queues=["default"],
        connection=redis_conn,
        log_job_description=True,
    )
    print("🎬 ReelCraft video worker started, listening on queue: default")
    worker.work(with_scheduler=True)


if __name__ == "__main__":
    main()
