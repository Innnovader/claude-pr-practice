"""GDELT Project — cobertura ampliada de medios (tarea pendiente #22).

GDELT indexa cientos de miles de medios de noticias online casi en tiempo
real (actualización cada 15 min) y expone su índice vía la DOC 2.0 API,
gratis y sin autenticación — agrega cobertura de medios más pequeños o
regionales que no tienen RSS estable ni justifican un scraper dedicado por
sitio (ver app/sources/news.py para las ~14 fuentes curadas con RSS real).

LIMITACIÓN CONOCIDA: la API de GDELT tiene un rate limit estricto ("please
limit requests to one every 5 seconds") y el entorno de desarrollo usado para
este proyecto quedó devolviendo 429 de forma persistente incluso respetando
ese espaciado (una sola consulta cada varios segundos) — probablemente por IP
compartida de un proveedor cloud, no por abuso real. Sí se confirmó una
respuesta 200 con JSON válido en al menos una corrida desde este mismo
entorno, así que no es un bloqueo total, solo poco confiable. GitHub Actions
corre esta consulta una sola vez cada 15 minutos desde una IP distinta en
cada ejecución — muy por debajo de cualquier límite razonable — pero no se
pudo validar de punta a punta contra datos en vivo desde este entorno de
desarrollo. Revisar `scrape_runs` después de las primeras corridas en CI para
confirmar que esta fuente no está fallando silenciosamente; `scrape_gdelt_news`
no lanza excepción ante un fallo (ni 429 ni JSON vacío) — retorna lista vacía
y deja que el resto del ciclo de noticias siga funcionando.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.dedup import content_hash
from app.models import ScrapedNews
from app.relevance_filter import is_relevant
from app.sources.rss_base import REQUEST_HEADERS
from app.topic_classifier import classify_topic

logger = logging.getLogger(__name__)

GDELT_DOC_API_URL = "https://api.gdeltproject.org/api/v2/doc/doc"

# Sintaxis verificada contra la API en vivo el 2026-07-30: "sourcecountry:CO"
# (código de 2 letras) SÍ trae resultados; "sourcecountry:Colombia" (nombre
# completo) devuelve vacío pese a estar documentado como válido — no se
# investigó más a fondo por el rate limit, se deja el código que sí funciona.
GDELT_QUERY = (
    'Colombia sourcecountry:CO (Congreso OR Senado OR Camara OR Gobierno OR '
    'Presidencia OR "Partido Liberal" OR Contraloria OR Fiscalia OR '
    'Defensoria OR Procuraduria OR economia OR Minhacienda)'
)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=15))
async def _fetch_gdelt_articles() -> list[dict]:
    params = {
        "query": GDELT_QUERY,
        "mode": "artlist",
        "format": "json",
        "maxrecords": 50,
        "sort": "datedesc",
        "timespan": "1d",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(GDELT_DOC_API_URL, params=params, headers=REQUEST_HEADERS)
        response.raise_for_status()
    try:
        data = response.json()
    except ValueError:
        # GDELT devuelve texto plano (no JSON) cuando aplica su rate limit,
        # con HTTP 200 en vez de 429 en algunos casos — no es un error de red
        # que valga la pena reintentar más, se trata como "sin resultados".
        logger.warning("GDELT: respuesta no-JSON (probable rate limit): %s", response.text[:200])
        return []
    return data.get("articles", [])


def _parse_gdelt_date(seendate: str) -> datetime:
    """Formato GDELT: 'YYYYMMDDTHHMMSSZ'."""
    try:
        return datetime.strptime(seendate, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        return datetime.now(timezone.utc)


async def scrape_gdelt_news() -> list[ScrapedNews]:
    """Consulta GDELT y mapea resultados a ScrapedNews.

    La DOC API en modo `artlist` no expone un resumen/snippet del artículo
    (solo título, URL, dominio, idioma y fecha) — `summary` queda en None,
    igual que `dnl_relevance`/`sentiment`, pendientes de clasificación IA
    (mismo patrón que app/sources/news.py).
    """
    try:
        articles = await _fetch_gdelt_articles()
    except Exception:  # noqa: BLE001 — un fallo de GDELT no debe tumbar el ciclo de noticias
        logger.exception("Fallo consultando GDELT")
        return []

    items: list[ScrapedNews] = []
    skipped = 0
    for article in articles:
        title = (article.get("title") or "").strip()
        url = (article.get("url") or "").strip()
        domain = (article.get("domain") or "GDELT").strip()
        if not title or not url:
            continue
        if not is_relevant(title, None, url, None):
            skipped += 1
            continue
        source_name = f"GDELT · {domain}"
        items.append(
            ScrapedNews(
                headline=title,
                summary=None,
                body=None,
                source_name=source_name,
                source_url=url,
                topic=classify_topic(title, None, source_name),
                sentiment=None,
                entities=[],
                dnl_relevance=None,
                published_at=_parse_gdelt_date(article.get("seendate", "")),
                content_hash=content_hash(title, source_name),
            )
        )
    if skipped:
        logger.info("GDELT: %d items descartados por el filtro de relevancia", skipped)
    return items


__all__ = ["GDELT_DOC_API_URL", "GDELT_QUERY", "scrape_gdelt_news"]
