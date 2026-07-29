"""Ingesta de noticias políticas/económicas de Colombia (Módulo 1 — brief §2).

Prioriza RSS de medios masivos (más estable y liviano que scraping HTML).
Cada fuente nueva solo requiere añadir su feed a NEWS_RSS_SOURCES.
"""

from __future__ import annotations

import logging

from app.dedup import content_hash
from app.models import ScrapedNews
from app.relevance_filter import is_relevant
from app.sources.rss_base import fetch_feed
from app.topic_classifier import classify_topic

logger = logging.getLogger(__name__)

# Feeds públicos de medios colombianos de referencia. Verificados con HTTP
# 200 + contenido RSS válido el 2026-07-23 (ver services/scraper/README.md
# para el procedimiento de verificación) — pero los medios reestructuran sus
# feeds sin aviso, así que hay que revalidar periódicamente.
NEWS_RSS_SOURCES: dict[str, str] = {
    "El Tiempo - Política": "https://www.eltiempo.com/rss/politica.xml",
    "La FM - Actualidad": "https://www.lafm.com.co/rss/actualidad.xml",
    "La Silla Vacía": "https://www.lasillavacia.com/feed/",
    "Infobae Colombia": "https://www.infobae.com/arc/outboundfeeds/rss/category/colombia/?outputType=xml",
    "El Espectador - Blogs de Política": "https://blogs.elespectador.com/category/politica/feed/",
    "KienyKe": "https://www.kienyke.com/feed",
    "Las2Orillas": "https://www.las2orillas.co/feed/",
    "Razón Pública": "https://razonpublica.com/feed/",
}

# Fuentes evaluadas y descartadas — no usar sin volver a verificar primero:
#   - El Espectador (sitio principal, no el subdominio de blogs): sin RSS
#     público estable encontrado (probado: /arc/outboundfeeds/rss/category/
#     politica/, /rss/politica/, /feed/ — todos 404). El subdominio de blogs
#     sí tiene feed (arriba), pero es contenido de opinión, no la sección de
#     noticias principal.
#   - Semana - Política: sin RSS público estable encontrado (su página de
#     "servicio RSS" es de 2005 y ya no lista feeds vigentes).
#   - Blu Radio: no publica RSS de texto en su sitio — solo tiene feeds de
#     podcast (audio) en Omny.fm, no útiles para este pipeline de texto.
#   - Google News RSS (news.google.com/rss/search?q=site:...) funciona
#     técnicamente para CUALQUIER medio, pero su licencia dice explícitamente
#     "personal, non-commercial use... any other use expressly prohibited" —
#     NO usar para este proyecto (uso organizacional, no personal).
#   - The Economist: sin RSS público gratuito relevante para Colombia
#     específicamente; su contenido además está pagado/paywalled.
#   - RCN Radio, Caracol Radio, W Radio, El Colombiano, El País (Cali),
#     Vanguardia, El Heraldo, Publimetro, Pulzo: probados con varios patrones
#     de URL (/feed, /rss.xml, /politica/rss.xml, /politica/feed, subdominio
#     newsroom.*) el 2026-07-28 — o dan 404, o redirigen a la home normal del
#     sitio (200 pero HTML, no XML), o devuelven un dump de debug de PHP.
#     Ninguno tiene RSS público localizable con esfuerzo razonable; requieren
#     scraping HTML dirigido si se quieren activar.
#     (probado: /rss.xml, /rss/politica.xml, /feed/)
BROKEN_NEWS_SOURCES: list[str] = ["El Espectador - Política", "Semana - Política"]


async def scrape_news_source(source_name: str, rss_url: str) -> list[ScrapedNews]:
    """Descarga un feed y lo mapea a ScrapedNews.

    `topic` se asigna aquí mismo con reglas por palabras clave (ver
    app/topic_classifier.py — es el "Archivo" automático que pidió la DNL,
    sin costo de IA). `sentiment`, `entities` (NER) y `dnl_relevance` siguen
    pendientes de un paso con Claude (ver app/ai.py) antes del upsert.
    """
    try:
        entries = await fetch_feed(rss_url)
    except Exception:  # noqa: BLE001
        logger.exception("Fallo obteniendo feed de %s", source_name)
        return []

    items: list[ScrapedNews] = []
    skipped = 0
    for entry in entries:
        if not entry.title or not entry.link:
            continue
        if not is_relevant(entry.title, entry.summary, entry.link):
            skipped += 1
            continue
        items.append(
            ScrapedNews(
                headline=entry.title,
                summary=entry.summary or None,
                body=None,
                source_name=source_name,
                source_url=entry.link,
                topic=classify_topic(entry.title, entry.summary, source_name),  # reglas, no IA — ver topic_classifier.py
                sentiment=None,      # pendiente: clasificación IA
                entities=[],         # pendiente: NER vía Claude
                dnl_relevance=None,  # pendiente: clasificación IA
                published_at=entry.published_at,
                content_hash=content_hash(entry.title, source_name),
            )
        )
    if skipped:
        logger.info("%s: %d items descartados por el filtro de relevancia", source_name, skipped)
    return items


async def scrape_all_news() -> list[ScrapedNews]:
    results: list[ScrapedNews] = []
    for source_name, rss_url in NEWS_RSS_SOURCES.items():
        results.extend(await scrape_news_source(source_name, rss_url))
    return results


__all__ = ["NEWS_RSS_SOURCES", "scrape_news_source", "scrape_all_news"]
