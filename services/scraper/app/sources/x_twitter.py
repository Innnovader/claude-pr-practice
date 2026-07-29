"""Radar de X/Twitter (Módulo 1 — brief §2).

Dos vías soportadas por diseño, seleccionables por configuración:

  1. API oficial v2 de X (recent search / filtered stream) — requiere
     X_BEARER_TOKEN con un plan de acceso que permita el volumen de
     consultas necesario. Es la vía recomendada por estabilidad y ToS.
  2. Tavily Search API como capa de búsqueda asistida cuando no se cuenta
     con acceso a la API de X — retorna resultados indexados públicamente,
     con más latencia y cobertura parcial.

Este módulo NO implementa scraping directo de x.com vía navegador headless:
va contra los Términos de Servicio de X y el brief pide explícitamente
"sin bloqueos", lo cual solo se logra de forma sostenible con acceso de API
autorizado.
"""

from __future__ import annotations

import logging

from app.config import settings
from app.dedup import content_hash
from app.models import ScrapedTweet

logger = logging.getLogger(__name__)

# Cuentas monitoreadas por categoría (brief §3 Módulo 1: Radar de X).
# Los @handles deben verificarse/actualizarse contra las cuentas oficiales
# vigentes antes de producción.
MONITORED_ACCOUNTS: dict[str, list[str]] = {
    "gobierno": [],       # Presidencia, Ministros, Viceministros
    "oposicion": [],      # Liderazgos de oposición y partidos aliados
    "dnl_liderazgo": [],  # Dirección Nacional Liberal
}


async def fetch_recent_tweets_via_x_api(handles: list[str]) -> list[ScrapedTweet]:
    """STUB — Vía recomendada: API v2 de X (recent search por lista de autores).

    Implementación real:
      1. GET https://api.twitter.com/2/tweets/search/recent
         con query `from:{handle} OR from:{handle2} ...` (máx. 25 handles/query,
         paginar por categoría) y Authorization: Bearer {settings.x_bearer_token}.
      2. Mapear cada tweet a ScrapedTweet, resolviendo author_category desde
         MONITORED_ACCOUNTS.
      3. Clasificar sentiment/topic vía Claude antes del upsert.
    """
    if not settings.x_bearer_token:
        logger.warning("X_BEARER_TOKEN no configurado — omitiendo scraping de X API")
        return []
    logger.info("fetch_recent_tweets_via_x_api: pendiente de implementación (%d handles)", len(handles))
    return []


async def fetch_recent_tweets_via_tavily(handles: list[str]) -> list[ScrapedTweet]:
    """STUB — Vía alternativa: Tavily Search API cuando no hay acceso a X API v2."""
    if not settings.tavily_api_key:
        logger.warning("TAVILY_API_KEY no configurado — omitiendo scraping vía Tavily")
        return []
    logger.info("fetch_recent_tweets_via_tavily: pendiente de implementación (%d handles)", len(handles))
    return []


async def scrape_all_tweets() -> list[ScrapedTweet]:
    all_handles = [h for handles in MONITORED_ACCOUNTS.values() for h in handles]
    if settings.x_bearer_token:
        return await fetch_recent_tweets_via_x_api(all_handles)
    if settings.tavily_api_key:
        return await fetch_recent_tweets_via_tavily(all_handles)
    logger.warning("Ninguna credencial de X/Tavily configurada — radar de X inactivo")
    return []


__all__ = ["MONITORED_ACCOUNTS", "scrape_all_tweets"]
