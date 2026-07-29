"""Centros de pensamiento y análisis económico (Módulo 3 — brief §3).

Cubre: Instituto de Pensamiento Liberal (IPL), Fedesarrollo, Dejusticia,
ANIF, Banco de la República (informes macro).

Estado verificado el 2026-07-23 (ver services/scraper/README.md):
  - Fedesarrollo, Dejusticia: RSS real, funcional.
  - IPL, ANIF: sin RSS, pero WordPress con HTML server-rendered — scraping
    real vía BeautifulSoup implementado abajo.
  - Banco de la República: la página de publicaciones no trae los títulos
    en el HTML inicial (probablemente carga la lista por JS) — sigue como
    STUB hasta investigar más o incorporar Playwright.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from datetime import datetime, timezone

from bs4 import BeautifulSoup

from app.dedup import content_hash
from app.models import ImpactLevel, ScrapedControlAlert, SourceCategory
from app.sources.rss_base import fetch_feed, fetch_html

logger = logging.getLogger(__name__)


@dataclass
class ThinkTankSource:
    name: str
    rss_url: str | None  # None => requiere scraping HTML directo (fallback)
    fallback_url: str


# URLs verificadas con HTTP 200 el 2026-07-23.
#   - IPL: el dominio correcto es institutopensamientoliberal.com (NO
#     pensamientoliberal.org, que ni siquiera resuelve por DNS). Además el
#     sitio devuelve 406 sin un User-Agent/Accept de navegador real — el
#     scraper debe enviar headers completos, no solo un UA genérico.
#   - Fedesarrollo: fedesarrollo.org.co/feed da 404; el feed real vive en su
#     repositorio institucional (OJS/DSpace), que sí es RSS 1.0 válido.
THINK_TANK_SOURCES: list[ThinkTankSource] = [
    ThinkTankSource(
        name="Instituto de Pensamiento Liberal (IPL)",
        rss_url=None,
        fallback_url="https://institutopensamientoliberal.com/",
    ),
    ThinkTankSource(
        name="Fedesarrollo",
        rss_url="https://www.repository.fedesarrollo.org.co/feed/rss_1.0/site",
        fallback_url="https://www.fedesarrollo.org.co/p/publicaciones",
    ),
    ThinkTankSource(
        name="Dejusticia",
        rss_url="https://www.dejusticia.org/feed/",
        fallback_url="https://www.dejusticia.org/publicaciones/",
    ),
    ThinkTankSource(
        name="ANIF",
        rss_url=None,
        fallback_url="https://www.anif.com.co/publicaciones/",
    ),
    ThinkTankSource(
        name="Banco de la República",
        rss_url=None,
        fallback_url="https://www.banrep.gov.co/es/publicaciones-investigaciones",
    ),
]


def _entry_to_alert(source_name: str, title: str, url: str, published_at: datetime, summary: str | None = None) -> ScrapedControlAlert:
    return ScrapedControlAlert(
        source_entity=source_name,
        source_category=SourceCategory.centro_pensamiento,
        title=title,
        summary=summary,
        alert_type="analisis",
        # impact_level real requiere clasificación con Claude (app/ai.py) según
        # relevancia para la agenda del Partido Liberal. "medio" es un default
        # conservador aquí, NO una clasificación real — reemplazar antes de
        # usar este campo para priorizar alertas en producción.
        impact_level=ImpactLevel.medio,
        source_url=url,
        published_at=published_at,
        content_hash=content_hash(title, source_name),
    )


_IPL_POST_URL_RE = re.compile(r"institutopensamientoliberal\.com/\d{4}/\d{2}/\d{2}/")

# Slugs de contenido no-editorial (parrilla de un programa de radio/TV,
# eventos del instituto) que comparten la clase `entry-title` con los
# artículos reales pero no son análisis publicables como alerta.
_IPL_NOISE_PREFIXES = ("programa-", "evento-")


async def _scrape_ipl(source: ThinkTankSource) -> list[ScrapedControlAlert]:
    """IPL corre en WordPress — los títulos están en `div.entry-title > a`.

    El mismo selector también matchea entradas de parrilla ("Programa 1",
    "Evento 2") que no son artículos de análisis — se filtran por el slug
    final de la URL, no por el título (los títulos de esas entradas son
    genéricos y no distinguibles del texto de un artículo real corto).
    """
    html = await fetch_html(source.fallback_url)
    soup = BeautifulSoup(html, "html.parser")
    now = datetime.now(timezone.utc)

    results: list[ScrapedControlAlert] = []
    seen_urls: set[str] = set()
    for container in soup.select("div.entry-title"):
        link = container.find("a")
        if not link or not link.get("href"):
            continue
        title = link.get_text(strip=True)
        url = link["href"]
        if not title or url in seen_urls or not _IPL_POST_URL_RE.search(url):
            continue
        slug = url.rstrip("/").rsplit("/", 1)[-1]
        if slug.startswith(_IPL_NOISE_PREFIXES):
            continue
        seen_urls.add(url)
        # NOTA: WordPress no muestra la fecha de publicación en esta vista de
        # listado sin una petición adicional por artículo; se usa la hora de
        # scraping como aproximación. Mejora futura: visitar cada artículo o
        # leer <time datetime> si el tema lo expone.
        results.append(_entry_to_alert(source.name, title, url, now))
    return results


async def _scrape_anif(source: ThinkTankSource) -> list[ScrapedControlAlert]:
    """ANIF usa WordPress + Elementor — títulos en `h5.elementor-heading-title > a`
    dentro de enlaces a rutas de contenido real (se filtran anclas de navegación)."""
    html = await fetch_html(source.fallback_url)
    soup = BeautifulSoup(html, "html.parser")
    now = datetime.now(timezone.utc)

    results: list[ScrapedControlAlert] = []
    seen_urls: set[str] = set()
    for heading in soup.select("h5.elementor-heading-title"):
        link = heading.find("a")
        if not link or not link.get("href"):
            continue
        title = link.get_text(strip=True)
        url = link["href"]
        # Filtra enlaces de navegación/menú: los artículos reales de ANIF
        # viven bajo una subruta con al menos 2 segmentos de path.
        path_segments = [p for p in url.split("anif.com.co")[-1].split("/") if p]
        if not title or url in seen_urls or len(path_segments) < 2:
            continue
        seen_urls.add(url)
        results.append(_entry_to_alert(source.name, title, url, now))
    return results


_BANREP_NOISE_PREFIXES = ("/es/banco/", "/es/el-banco/")
_BANREP_CONTENT_PREFIXES = ("/es/noticias/", "/publicaciones-investigaciones/", "/es/publicaciones-investigaciones/")


async def _scrape_banrep(source: ThinkTankSource) -> list[ScrapedControlAlert]:
    """Banrep corre en Drupal (Views) — títulos en `.views-field-title > a`.

    El listado mezcla 3 tipos de enlace bajo el mismo selector:
      1. Publicaciones/noticias fechadas reales (lo que queremos).
      2. Páginas de categoría/serie sin fecha (p.ej. ".../informe-politica-monetaria"
         a secas) — se repetirían en cada scrape como si fueran nuevas.
      3. Biografías de la Junta Directiva (bajo /es/banco/ o /es/el-banco/) —
         ruido de un widget lateral, no contenido editorial.
    Se filtra por profundidad de path: una publicación fechada real tiene
    >=2 segmentos después de "publicaciones-investigaciones/" (p.ej.
    ".../reporte-estabilidad-financiera/primer-semestre-2026"), mientras que
    una página de categoría tiene solo 1.

    LIMITACIÓN CONOCIDA: banrep.gov.co está detrás de un WAF anti-bot
    (ShieldSquare/Radware) que a veces responde con una página de "challenge"
    en vez del contenido real, incluso con un User-Agent honesto y sin abusar
    de la frecuencia de peticiones. Cuando eso pasa, el selector simplemente
    no matchea nada y esta función retorna una lista vacía — no lanza
    excepción, no reintenta agresivamente, y sobre todo NO se intenta rotar
    fingerprints/headers ni resolver el challenge para evadir la protección;
    eso cruzaría a evasión de detección de bots, fuera de alcance de este
    proyecto. En producción, aceptar cobertura parcial de esta fuente o
    evaluar si Banrep ofrece un API/RSS oficial en vez de scraping HTML.
    """
    html = await fetch_html(source.fallback_url)
    soup = BeautifulSoup(html, "html.parser")
    now = datetime.now(timezone.utc)

    results: list[ScrapedControlAlert] = []
    seen_urls: set[str] = set()
    for field in soup.select(".views-field-title"):
        link = field.find("a")
        if not link or not link.get("href"):
            continue
        title = link.get_text(strip=True)
        url = link["href"]
        if not title or url in seen_urls or url.startswith(_BANREP_NOISE_PREFIXES):
            continue

        is_news = "/es/noticias/" in url
        is_dated_publication = False
        if "publicaciones-investigaciones/" in url:
            after = url.split("publicaciones-investigaciones/", 1)[1]
            is_dated_publication = len([p for p in after.split("/") if p]) >= 2

        if not (is_news or is_dated_publication):
            continue

        seen_urls.add(url)
        full_url = url if url.startswith("http") else f"https://www.banrep.gov.co{url}"
        # NOTA: igual que IPL, la vista de listado no expone la fecha exacta
        # de publicación sin abrir cada página — se usa la hora de scraping.
        results.append(_entry_to_alert(source.name, title, full_url, now))
    return results


async def scrape_think_tank(source: ThinkTankSource) -> list[ScrapedControlAlert]:
    """Extrae publicaciones recientes de un centro de pensamiento.

    `impact_level` real requiere clasificación con Claude (relevancia del
    informe/publicación para la agenda del Partido Liberal) — ver
    `app/ai.py`. Aquí se deja "medio" como default explícito, no una
    clasificación real (mismo patrón que control_entities.py).
    """
    if source.name == "Instituto de Pensamiento Liberal (IPL)":
        return await _scrape_ipl(source)
    if source.name == "ANIF":
        return await _scrape_anif(source)
    if source.name == "Banco de la República":
        return await _scrape_banrep(source)

    if source.rss_url:
        entries = await fetch_feed(source.rss_url)
        return [
            _entry_to_alert(source.name, e.title, e.link, e.published_at, e.summary or None)
            for e in entries
            if e.title and e.link
        ]

    logger.info("scrape_think_tank: %s — sin RSS ni scraper HTML implementado (STUB)", source.name)
    return []


async def scrape_all_think_tanks() -> list[ScrapedControlAlert]:
    results: list[ScrapedControlAlert] = []
    for source in THINK_TANK_SOURCES:
        try:
            results.extend(await scrape_think_tank(source))
        except Exception:  # noqa: BLE001
            logger.exception("Fallo scrapeando %s", source.name)
    return results


__all__ = ["ThinkTankSource", "THINK_TANK_SOURCES", "scrape_think_tank", "scrape_all_think_tanks"]
