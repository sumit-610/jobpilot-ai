from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "jobpilot",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.worker.tasks.scrape",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

celery_app.conf.beat_schedule = {
    "daily-job-scrape": {
        "task": "app.worker.tasks.scrape.run_daily_scrape",
        "schedule": crontab(
            hour=settings.scrape_hour,
            minute=settings.scrape_minute,
        ),
    },
}
