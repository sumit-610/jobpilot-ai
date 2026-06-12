import structlog
from celery import shared_task

from app.worker.celery_app import celery_app

log = structlog.get_logger()


@celery_app.task(name="app.worker.tasks.scrape.run_daily_scrape", bind=True, max_retries=2)
def run_daily_scrape(self):
    """
    Entry point for the 7:52 AM daily scrape.
    Fans out to per-platform subtasks.
    """
    log.info("daily_scrape.started")
    try:
        scrape_wellfound.delay()
        scrape_linkedin.delay()
        log.info("daily_scrape.dispatched")
    except Exception as exc:
        log.error("daily_scrape.failed", error=str(exc))
        raise self.retry(exc=exc, countdown=300)


@celery_app.task(name="app.worker.tasks.scrape.scrape_wellfound", bind=True, max_retries=3)
def scrape_wellfound(self):
    """Scrape Wellfound jobs and store to DB."""
    from app.services.scraper.wellfound import WellfoundScraper
    import asyncio

    log.info("scrape_wellfound.started")
    try:
        asyncio.run(WellfoundScraper().run())
        log.info("scrape_wellfound.done")
    except Exception as exc:
        log.error("scrape_wellfound.failed", error=str(exc))
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(name="app.worker.tasks.scrape.scrape_linkedin", bind=True, max_retries=3)
def scrape_linkedin(self):
    """Scrape LinkedIn jobs and store to DB."""
    from app.services.scraper.linkedin import LinkedInScraper
    import asyncio

    log.info("scrape_linkedin.started")
    try:
        asyncio.run(LinkedInScraper().run())
        log.info("scrape_linkedin.done")
    except Exception as exc:
        log.error("scrape_linkedin.failed", error=str(exc))
        raise self.retry(exc=exc, countdown=120)
