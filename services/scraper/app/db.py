"""Cliente Supabase para el servicio de scraping.

Usa la service_role key (bypassa RLS por diseño: este servicio es el único
escritor autorizado de contenido scrapeado). Nunca exponer esta key al
frontend — solo vive en el entorno del servicio Python.
"""

from __future__ import annotations

import logging

from supabase import Client, create_client

from app.config import settings
from app.models import ScrapedControlAlert, ScrapedNews, ScrapedTweet, ScrapeRunResult

logger = logging.getLogger(__name__)

_client: Client | None = None


def get_client() -> Client:
    global _client
    if _client is None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise RuntimeError(
                "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no configurados. "
                "Define estas variables en services/scraper/.env antes de correr el scraper."
            )
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _client


def upsert_news(items: list[ScrapedNews]) -> int:
    """Inserta noticias ignorando conflictos en content_hash (dedup exacto).

    Retorna el número de filas efectivamente insertadas.
    """
    if not items:
        return 0
    client = get_client()
    payload = [item.model_dump(mode="json") for item in items]
    result = (
        client.table("coyuntura_news")
        .upsert(payload, on_conflict="content_hash", ignore_duplicates=True)
        .execute()
    )
    return len(result.data or [])


def upsert_tweets(items: list[ScrapedTweet]) -> int:
    if not items:
        return 0
    client = get_client()
    payload = [item.model_dump(mode="json") for item in items]
    result = (
        client.table("x_tweets")
        .upsert(payload, on_conflict="content_hash", ignore_duplicates=True)
        .execute()
    )
    return len(result.data or [])


def upsert_control_alerts(items: list[ScrapedControlAlert]) -> int:
    if not items:
        return 0
    client = get_client()
    payload = [item.model_dump(mode="json") for item in items]
    result = (
        client.table("control_alerts")
        .upsert(payload, on_conflict="content_hash", ignore_duplicates=True)
        .execute()
    )
    return len(result.data or [])


def record_scrape_run(run: ScrapeRunResult) -> None:
    client = get_client()
    client.table("scrape_runs").insert(run.model_dump(mode="json")).execute()
    logger.info(
        "scrape_run source=%s status=%s found=%d inserted=%d deduped=%d",
        run.source_name,
        run.status,
        run.items_found,
        run.items_inserted,
        run.items_deduplicated,
    )
