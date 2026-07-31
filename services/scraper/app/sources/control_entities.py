"""Vigía de entes de control (Módulo 3 — brief §3).

Cubre: Procuraduría General de la Nación, Contraloría General, Fiscalía
General, Defensoría del Pueblo.

Estado verificado el 2026-07-30 (a pedido explícito de la usuaria — este
módulo llevaba desde el scaffold inicial como stub que siempre devolvía []):
  - Fiscalía, Defensoría: HTML server-rendered con listados fechados reales
    (confirmado con fechas del mismo día) — scraping real con BeautifulSoup
    implementado abajo. Defensoría corre bien en producción; Fiscalía tiene
    una limitación de red conocida desde GitHub Actions específicamente —
    ver docstring de `_scrape_fiscalia` abajo.
  - Procuraduría: la URL histórica (apps.procuraduria.gov.co/portal/
    COMUNICADO-A-LA-PRENSA.news) sigue respondiendo 200 pero quedó congelada
    en octubre de 2022 — es una página abandonada de su CMS anterior. Su Sala
    de Prensa actual migró a SharePoint moderno (/Lists/Sala de Prensa/
    AllItems.aspx), que renderiza el listado 100% por JS (SPFx) — confirmado
    porque el HTML crudo solo trae metadata de servidor, ningún comunicado.
    Sigue como STUB — requiere Playwright.
  - Contraloría: su sección de sala de prensa tampoco expone el listado en
    el HTML inicial (SPA) — sigue como STUB — requiere Playwright.
"""

from __future__ import annotations

import logging
import re
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timezone

from bs4 import BeautifulSoup

from app.dedup import content_hash
from app.models import ImpactLevel, ScrapedControlAlert, SourceCategory
from app.sources.rss_base import fetch_html

logger = logging.getLogger(__name__)


@dataclass
class ControlEntitySource:
    name: str
    # Sección de comunicados/sala de prensa. Verificar y actualizar
    # periódicamente: estos organismos no garantizan URLs estables.
    press_room_url: str
    uses_js_rendering: bool = True  # True => requiere Playwright, no basta httpx+BS4


CONTROL_ENTITY_SOURCES: list[ControlEntitySource] = [
    ControlEntitySource(
        name="Procuraduría General de la Nación",
        press_room_url="https://www.procuraduria.gov.co/Lists/Sala de Prensa/AllItems.aspx",
    ),
    ControlEntitySource(
        name="Contraloría General de la República",
        press_room_url="https://www.contraloria.gov.co/contraloria/sala-de-prensa",
    ),
    ControlEntitySource(
        name="Fiscalía General de la Nación",
        press_room_url="https://www.fiscalia.gov.co/colombia/noticias/",
        uses_js_rendering=False,
    ),
    ControlEntitySource(
        name="Defensoría del Pueblo",
        press_room_url="https://www.defensoria.gov.co/web/guest/noticias",
        uses_js_rendering=False,
    ),
]


def _normalize(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


_MESES_ES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
    "julio": 7, "agosto": 8, "septiembre": 9, "setiembre": 9, "octubre": 10,
    "noviembre": 11, "diciembre": 12,
}
# Abreviaturas de 3 letras que usa Defensoría (formato Liferay) — algunas
# coinciden con el inglés por casualidad (jul, mar), otras no (ene vs jan).
_MESES_ABR_ES = {
    "ene": 1, "feb": 2, "mar": 3, "abr": 4, "may": 5, "jun": 6, "jul": 7,
    "ago": 8, "sep": 9, "set": 9, "oct": 10, "nov": 11, "dic": 12,
}

_FISCALIA_DATE_RE = re.compile(
    r"(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*([ap]\.?\s*m\.?)",
)
_DEFENSORIA_DATE_RE = re.compile(r"([a-z]{3})\s+(\d{1,2}),\s*(\d{4})", re.IGNORECASE)


def _parse_fiscalia_date(text: str) -> datetime:
    """Formato: 'Jueves, 30 de julio de 2026 5:35 pm'."""
    m = _FISCALIA_DATE_RE.search(_normalize(text))
    if not m:
        return datetime.now(timezone.utc)
    day, month_name, year, hour, minute, meridiem = m.groups()
    month = _MESES_ES.get(month_name)
    if not month:
        return datetime.now(timezone.utc)
    hour_i = int(hour) % 12
    if meridiem.startswith("p"):
        hour_i += 12
    # Hora local de Bogotá (UTC-5) — se asume el reloj del sitio en hora local.
    return datetime(int(year), month, int(day), hour_i, int(minute), tzinfo=timezone.utc)


def _parse_defensoria_date(text: str) -> datetime:
    """Formato: 'Jul 30, 2026' (sin hora)."""
    m = _DEFENSORIA_DATE_RE.search(_normalize(text))
    if not m:
        return datetime.now(timezone.utc)
    month_abbr, day, year = m.groups()
    month = _MESES_ABR_ES.get(month_abbr)
    if not month:
        return datetime.now(timezone.utc)
    return datetime(int(year), month, int(day), tzinfo=timezone.utc)


def _entry_to_alert(source_name: str, title: str, url: str, published_at: datetime, summary: str | None = None) -> ScrapedControlAlert:
    return ScrapedControlAlert(
        source_entity=source_name,
        source_category=SourceCategory.ente_control,
        title=title,
        summary=summary,
        alert_type="comunicado",
        # impact_level real requiere clasificación con Claude (app/ai.py) según
        # relevancia para la agenda del Partido Liberal. "medio" es un default
        # conservador aquí, NO una clasificación real (mismo patrón que
        # think_tanks.py) — reemplazar antes de usar este campo para priorizar.
        impact_level=ImpactLevel.medio,
        source_url=url,
        published_at=published_at,
        content_hash=content_hash(title, source_name),
    )


async def _scrape_fiscalia(source: ControlEntitySource) -> list[ScrapedControlAlert]:
    """Fiscalía corre en WordPress — cada comunicado es un `article.noticia-card`
    con título/link en `h2.noticia-card-title > a`, fecha en `.noticia-card-date`
    (formato largo en español) y resumen en `.noticia-card-excerpt`.

    LIMITACIÓN CONOCIDA (actualizado 2026-07-31): esta fuente funciona bien
    probada manualmente (confirmó datos reales al construir el scraper), pero
    falla de forma consistente y reproducible desde GitHub Actions —
    `httpcore.ConnectTimeout` en las 3 corridas de CI revisadas en el lapso de
    ~1.5h después de subir el fix, incluso ampliando el timeout de 15s a 30s
    (descartado: no era un problema de lentitud/timeout corto, el timeout más
    largo no cambió nada). Todo apunta a que fiscalia.gov.co bloquea o
    descarta silenciosamente conexiones desde los rangos de IP de GitHub
    Actions — mismo patrón defensivo que el WAF ya documentado de Banco de la
    República (ver think_tanks.py), solo que sin página de challenge visible.
    No se investiga más a fondo ni se intenta evadir el bloqueo (headers/
    proxies/rotación de IP) — eso cruzaría a evasión de detección de bots,
    fuera de alcance de este proyecto. Se deja el timeout en 30s (no hace
    daño) pero no se debe asumir que subirlo más va a arreglar esto."""
    html = await fetch_html(source.press_room_url, timeout=30.0)
    soup = BeautifulSoup(html, "html.parser")

    results: list[ScrapedControlAlert] = []
    for card in soup.select("article.noticia-card"):
        title_link = card.select_one("h2.noticia-card-title a")
        if not title_link or not title_link.get("href"):
            continue
        title = title_link.get_text(strip=True)
        url = title_link["href"]
        date_el = card.select_one(".noticia-card-date")
        published_at = _parse_fiscalia_date(date_el.get_text(strip=True)) if date_el else datetime.now(timezone.utc)
        excerpt_el = card.select_one(".noticia-card-excerpt")
        summary = excerpt_el.get_text(strip=True) if excerpt_el else None
        results.append(_entry_to_alert(source.name, title, url, published_at, summary))
    return results


async def _scrape_defensoria(source: ControlEntitySource) -> list[ScrapedControlAlert]:
    """Defensoría corre en Liferay — cada comunicado tiene un `h3 > a` con el
    título/link y un `p > a` previo con la fecha ('Fecha: <a>Jul 30, 2026</a>'),
    ambos apuntando a la misma URL del artículo."""
    html = await fetch_html(source.press_room_url)
    soup = BeautifulSoup(html, "html.parser")

    results: list[ScrapedControlAlert] = []
    seen_urls: set[str] = set()
    for heading in soup.select("h3.h3 a, h3 a"):
        url = heading.get("href")
        title = heading.get_text(strip=True)
        if not url or not title or url in seen_urls or "/web/guest/-/" not in url:
            continue
        seen_urls.add(url)
        # La fecha vive en el <a> "Fecha:" que precede al <h3> dentro del
        # mismo bloque de tarjeta — se busca el ancla previa con el mismo href.
        date_link = soup.find("a", href=url, string=_DEFENSORIA_DATE_RE.search)
        published_at = _parse_defensoria_date(date_link.get_text(strip=True)) if date_link else datetime.now(timezone.utc)
        summary_p = heading.find_parent("h3").find_next_sibling("p")
        summary = summary_p.get_text(strip=True) if summary_p else None
        results.append(_entry_to_alert(source.name, title, url, published_at, summary))
    return results


async def scrape_control_entity(source: ControlEntitySource) -> list[ScrapedControlAlert]:
    """Extrae comunicados recientes de un ente de control.

    Fiscalía y Defensoría tienen scraping real (BeautifulSoup, ver docstring
    del módulo). Procuraduría y Contraloría siguen como STUB porque sus
    portales renderizan el listado por JS — requieren Playwright, fuera de
    alcance de esta iteración.
    """
    if source.name == "Fiscalía General de la Nación":
        return await _scrape_fiscalia(source)
    if source.name == "Defensoría del Pueblo":
        return await _scrape_defensoria(source)

    logger.info("scrape_control_entity: %s — requiere Playwright (JS-rendered), pendiente", source.name)
    return []


async def scrape_all_control_entities() -> list[ScrapedControlAlert]:
    results: list[ScrapedControlAlert] = []
    for source in CONTROL_ENTITY_SOURCES:
        try:
            results.extend(await scrape_control_entity(source))
        except Exception:  # noqa: BLE001 — un fallo de fuente no debe tumbar el ciclo completo
            logger.exception("Fallo scrapeando %s", source.name)
    return results


__all__ = ["ControlEntitySource", "CONTROL_ENTITY_SOURCES", "scrape_control_entity", "scrape_all_control_entities"]
