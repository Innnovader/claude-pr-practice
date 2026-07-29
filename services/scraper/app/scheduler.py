"""Orquestación de ciclos de scraping (brief §4.2: cada 5-15 minutos).

Usa APScheduler dentro del proceso FastAPI para simplicidad de despliegue.
En producción sobre Supabase, la alternativa recomendada por el brief es
migrar cada `run_*_cycle` a una Supabase Edge Function invocada por
`pg_cron`, lo que evita mantener un proceso Python de larga duración.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config import settings
from app.db import record_scrape_run, upsert_control_alerts, upsert_news, upsert_tweets
from app.models import ScrapeRunResult
from app.sources.control_entities import scrape_all_control_entities
from app.sources.news import scrape_all_news
from app.sources.think_tanks import scrape_all_think_tanks
from app.sources.x_twitter import scrape_all_tweets

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def run_news_cycle() -> None:
    started = datetime.now(timezone.utc)
    try:
        items = await scrape_all_news()
        inserted = upsert_news(items)
        record_scrape_run(
            ScrapeRunResult(
                source_name="coyuntura_news",
                status="success",
                items_found=len(items),
                items_inserted=inserted,
                items_deduplicated=len(items) - inserted,
                started_at=started,
                finished_at=datetime.now(timezone.utc),
            )
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("run_news_cycle falló")
        record_scrape_run(
            ScrapeRunResult(
                source_name="coyuntura_news",
                status="failed",
                error_message=str(exc),
                started_at=started,
                finished_at=datetime.now(timezone.utc),
            )
        )


async def run_control_cycle() -> None:
    started = datetime.now(timezone.utc)
    try:
        alerts = await scrape_all_control_entities()
        alerts += await scrape_all_think_tanks()
        inserted = upsert_control_alerts(alerts)
        record_scrape_run(
            ScrapeRunResult(
                source_name="control_alerts",
                status="success",
                items_found=len(alerts),
                items_inserted=inserted,
                items_deduplicated=len(alerts) - inserted,
                started_at=started,
                finished_at=datetime.now(timezone.utc),
            )
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("run_control_cycle falló")
        record_scrape_run(
            ScrapeRunResult(
                source_name="control_alerts",
                status="failed",
                error_message=str(exc),
                started_at=started,
                finished_at=datetime.now(timezone.utc),
            )
        )


async def run_x_cycle() -> None:
    started = datetime.now(timezone.utc)
    try:
        tweets = await scrape_all_tweets()
        inserted = upsert_tweets(tweets)
        record_scrape_run(
            ScrapeRunResult(
                source_name="x_tweets",
                status="success",
                items_found=len(tweets),
                items_inserted=inserted,
                items_deduplicated=len(tweets) - inserted,
                started_at=started,
                finished_at=datetime.now(timezone.utc),
            )
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("run_x_cycle falló")
        record_scrape_run(
            ScrapeRunResult(
                source_name="x_tweets",
                status="failed",
                error_message=str(exc),
                started_at=started,
                finished_at=datetime.now(timezone.utc),
            )
        )


def start_scheduler() -> None:
    interval = settings.scrape_interval_minutes
    scheduler.add_job(run_news_cycle, "interval", minutes=interval, id="news_cycle", replace_existing=True)
    scheduler.add_job(run_control_cycle, "interval", minutes=interval, id="control_cycle", replace_existing=True)
    scheduler.add_job(run_x_cycle, "interval", minutes=interval, id="x_cycle", replace_existing=True)
    scheduler.start()
    logger.info("Scheduler iniciado — ciclo cada %d minutos", interval)
