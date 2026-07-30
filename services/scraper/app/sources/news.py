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
    # Re-verificadas el 2026-07-30 a pedido explícito de la usuaria — El
    # Espectador y Semana SÍ tienen feed hoy (antes daban 404 con los
    # patrones probados el 2026-07-28; ver BROKEN_NEWS_SOURCES abajo para el
    # detalle histórico). El Espectador usa la ruta Arc "discover", no "rss"
    # (por eso no se encontró antes) — se confirmó vía el
    # <link rel="alternate" type="application/rss+xml"> de su propia página.
    "El Espectador - Política": "https://www.elespectador.com/arc/outboundfeeds/discover/category/politica/?outputType=xml",
    "Semana - Política": "https://www.semana.com/arc/outboundfeeds/rss/category/politica/?outputType=xml",
    # Blu Radio no tiene RSS de texto en su sitio, pero su reproductor de
    # audio SÍ usa un feed RSS estándar de Omny.fm por show (encontrado vía
    # el <link rel="alternate"> de la página de su show "Noticias del Día")
    # — feedparser lo procesa igual que cualquier otro feed, un episodio =
    # una noticia real (no el resumen de todo el día en un solo item).
    "Blu Radio - Noticias del Día": "https://www.omnycontent.com/d/playlist/1fc614ef-7db7-429f-a252-a989012fd0c6/0feeb069-0137-4fda-805b-ab43016be51c/bd7c2878-7556-4ca1-9153-ab43016d2cc6/podcast.rss",
    # YouTube expone un feed RSS/Atom estándar y gratuito por canal (sin API
    # key, sin cuota) en /feeds/videos.xml?channel_id=... — feedparser lo lee
    # igual que cualquier feed de noticias; el título del video es el
    # headline y la descripción cae en `summary`. Canal verificado como el
    # oficial de Noticias Caracol (feed.title == "Noticias Caracol").
    "Noticias Caracol (YouTube)": "https://www.youtube.com/feeds/videos.xml?channel_id=UC2Xq2PK-got3Rtz9ZJ32hLQ",
    # Verificados el 2026-07-30 a pedido explícito de la usuaria (medios
    # económicos). Portafolio: su URL "obvia" (/rss) en realidad sirve una
    # página HTML índice de feeds por sección, no XML — el feed real está en
    # /rss/economia.xml (se extrajo de los <a href> de esa página índice).
    # La República: sí tiene <link rel="alternate"> pero solo en subrutas,
    # no en el homepage — se usa /rss/economia (scoped) en vez de /rss (el
    # feed general trae también sección "Ocio", fuera del alcance del panel).
    "Portafolio - Economía": "https://www.portafolio.co/rss/economia.xml",
    "La República - Economía": "https://www.larepublica.co/rss/economia",
}

# Fuentes evaluadas y descartadas — no usar sin volver a verificar primero:
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
BROKEN_NEWS_SOURCES: list[str] = []


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
        if not is_relevant(entry.title, entry.summary, entry.link, entry.category):
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
