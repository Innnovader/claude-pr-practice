"""Vigía de entes de control (Módulo 3 — brief §3).

Cubre: Procuraduría General de la Nación, Contraloría General, Fiscalía
General, Defensoría del Pueblo.

Estos organismos publican boletines/comunicados en HTML sin RSS estable, por
lo que el patrón recomendado es Playwright (para páginas con JS) o
BeautifulSoup (para HTML estático) apuntando a sus secciones de sala de
prensa / comunicados. Las URLs base se dejan como configuración explícita —
DEBEN verificarse y ajustarse contra la estructura real de cada sitio antes
de producción, ya que estos portales cambian de plantilla con frecuencia.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

from app.models import ScrapedControlAlert

logger = logging.getLogger(__name__)


@dataclass
class ControlEntitySource:
    name: str
    # Sección de comunicados/sala de prensa. Verificar y actualizar
    # periódicamente: estos organismos no garantizan URLs estables.
    press_room_url: str
    uses_js_rendering: bool = True  # True => requiere Playwright, no basta httpx+BS4


# URLs verificadas con HTTP 200 el 2026-07-23. La de Procuraduría vive en su
# subdominio de aplicaciones (apps.procuraduria.gov.co) — la ruta intuitiva
# procuraduria.gov.co/Pages/comunicados.aspx da 404, quedó documentado el
# error para no repetirlo.
CONTROL_ENTITY_SOURCES: list[ControlEntitySource] = [
    ControlEntitySource(
        name="Procuraduría General de la Nación",
        press_room_url="https://apps.procuraduria.gov.co/portal/COMUNICADO-A-LA-PRENSA.news",
    ),
    ControlEntitySource(
        name="Contraloría General de la República",
        press_room_url="https://www.contraloria.gov.co/contraloria/sala-de-prensa",
    ),
    ControlEntitySource(
        name="Fiscalía General de la Nación",
        press_room_url="https://www.fiscalia.gov.co/colombia/noticias/",
    ),
    ControlEntitySource(
        name="Defensoría del Pueblo",
        press_room_url="https://www.defensoria.gov.co/web/guest/noticias",
    ),
]


async def scrape_control_entity(source: ControlEntitySource) -> list[ScrapedControlAlert]:
    """Extrae comunicados recientes de un ente de control.

    STUB: la extracción real con Playwright (selectors por sitio, paginación,
    manejo de cookies/consent banners) se implementa por-fuente porque cada
    portal tiene una estructura distinta. Este stub documenta el contrato de
    salida esperado (ScrapedControlAlert) y el punto de integración con
    Claude para clasificar impact_level automáticamente.

    Flujo real (a completar):
      1. Playwright: abrir press_room_url, esperar selector de listado.
      2. Extraer (título, url, fecha) de cada item nuevo desde el último
         scrape_runs exitoso para esta fuente.
      3. Para cada item nuevo: llamar a Claude (services/scraper/app/ai.py,
         pendiente) para clasificar impact_level (alto/medio/bajo) según
         relevancia para el Partido Liberal, y generar `summary`.
      4. Construir ScrapedControlAlert con content_hash = content_hash(titulo, source.name).
    """
    logger.info("scrape_control_entity: %s — pendiente de implementación con Playwright", source.name)
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
