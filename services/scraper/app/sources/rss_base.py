"""Utilidades base para fuentes RSS.

feedparser cubre la mayoría de RSS/Atom oficiales. Cuando una fuente no
publica feed (frecuente en Procuraduría/Contraloría/Fiscalía) se usa
Playwright/BeautifulSoup en su lugar (ver control_entities.py).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone

import feedparser
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


@dataclass
class FeedEntry:
    title: str
    link: str
    summary: str
    published_at: datetime
    category: str = ""  # tags/categorías tal como los publica el feed (ver relevance_filter.py)


# Algunos sitios (p.ej. institutopensamientoliberal.com) devuelven 406 a
# requests sin un Accept de navegador real, aunque el User-Agent sea
# honesto — se envían ambos headers para evitar falsos negativos.
# IMPORTANTE: los headers HTTP deben ser ASCII puro (httpx los codifica como
# ascii por defecto) — nada de tildes/ñ en este string, aunque sea texto
# descriptivo y no vaya a URL.
REQUEST_HEADERS = {
    "User-Agent": "RadarLiberalDNL/1.0 (+monitoreo politico; contacto: analitica@dnl.example)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def fetch_html(url: str, timeout: float = 15.0) -> str:
    """Descarga HTML crudo (para scraping con BeautifulSoup). Reintenta con
    backoff exponencial ante fallos transitorios de red."""
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        response = await client.get(url, headers=REQUEST_HEADERS)
        response.raise_for_status()
    return response.text


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def fetch_feed(url: str, timeout: float = 15.0) -> list[FeedEntry]:
    """Descarga y parsea un feed RSS/Atom. Reintenta con backoff exponencial
    ante fallos transitorios de red (comunes en dominios .gov.co)."""
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        response = await client.get(url, headers=REQUEST_HEADERS)
        response.raise_for_status()

    parsed = feedparser.parse(response.text)
    entries: list[FeedEntry] = []
    for entry in parsed.entries:
        published = _parse_published(entry)
        tags = ", ".join(t.get("term", "") for t in entry.get("tags", []) if t.get("term"))
        entries.append(
            FeedEntry(
                title=entry.get("title", "").strip(),
                link=entry.get("link", "").strip(),
                summary=entry.get("summary", "").strip(),
                published_at=published,
                category=tags,
            )
        )
    return entries


def _parse_published(entry) -> datetime:
    if getattr(entry, "published_parsed", None):
        return datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
    return datetime.now(timezone.utc)
