"""Filtro de relevancia para noticias (brief: la Dirección Nacional Liberal
sigue muchos temas, pero contenido de entretenimiento/horóscopos/deportes/
loterías/clima no aporta nada y solo le resta señal al panel).

Es un filtro de PRE-FILTRADO conservador (dos capas: ruta de URL + palabras
clave). NO reemplaza la clasificación real con Claude (`app/ai.py`) — esa
decide relevancia política/económica fina (alto/medio/bajo). Este filtro
solo evita que basura evidente entre a la base de datos, sin costo de IA.

LIMITACIÓN CONOCIDA: un filtro de palabras clave nunca va a ser perfecto —
farándula/entretenimiento en particular usa las mismas URLs "planas" que
las noticias políticas (sin subcategoría en la ruta), así que depende de
mantener la lista de figuras públicas de entretenimiento actualizada. La
solución definitiva es activar la clasificación con Claude.
"""

from __future__ import annotations

import re
import unicodedata

# Medios tipo Arc Publishing (Infobae, etc.) a veces marcan la subcategoría
# en la ruta de la URL — esto SÍ es una señal estructural confiable, a
# diferencia de las palabras clave. "/deportes/" es la única subcategoría
# irrelevante observada de forma consistente en la ruta (ver services/
# scraper/README.md); farándula/entretenimiento no se distingue por URL.
_IRRELEVANT_URL_SEGMENTS = ("/deportes/",)

# Frases/palabras que indican categorías obviamente irrelevantes para un
# panel de inteligencia política. Escritas sin tildes (se normaliza el
# texto antes de comparar). Agrupadas por categoría para facilitar mantenimiento.
_IRRELEVANT_PATTERNS = [
    # Horóscopos / esoterismo
    r"\bhoroscopo\b", r"\bastro\b", r"\btarot\b", r"\bsigno[s]? zodiacal",
    r"\btu signo\b",
    # Loterías / juegos de azar — nombres de marca colombianos + genéricos
    r"\bloteria\b", r"\bchance\b", r"\bbaloto\b", r"\bmiloto\b",
    r"\bchontico\b", r"\bsinuano\b", r"\bpaisita\b", r"\bcash *3\b",
    r"\bjugada ganadora\b", r"\bultimo sorteo\b", r"\bresultados? de hoy\b.*\bsorteo\b",
    # Clima / pronóstico (no confundir con desastres naturales, que sí
    # pueden ser relevantes políticamente — solo se excluye "pronóstico
    # del tiempo" genérico, no alertas del Ideam por emergencia)
    r"\bpronostico del tiempo\b", r"\bclima hoy\b",
    # Farándula / entretenimiento — nombres de figuras de entretenimiento
    # colombianas/latinas conocidas, combinado con contexto no-político
    # (evita falsos positivos si esa persona hiciera algo políticamente
    # relevante, p.ej. una demanda por corrupción)
    # NOTA: sin \b de cierre en el grupo de contexto — así "cancion" matchea
    # también dentro de "canciones", "album" dentro de "albumes", etc.
    r"\b(karol *g|feid|maluma|shakira|j balvin|manuel turizo|be+le|yeison jimenez|"
    r"karina garcia|day vasquez)\b.*\b(cancion|album|gira|concierto|tropitour|"
    r"novia|novio|ruptura|nominacion|premios juventud|reality)",
    r"\b(cancion|album|gira|concierto|tropitour|novia|novio|ruptura|nominacion)\b.*"
    r"\b(karol *g|feid|maluma|shakira|j balvin|manuel turizo|be+le|yeison jimenez)\b",
    r"\breality show\b", r"\btendencias tiktok\b", r"\bviral en redes\b",
    # Salud/lifestyle genérico sin relación política (tips caseros)
    r"\breceta[s]? de cocina\b", r"\bcomo preparar\b",
    r"\bplantas? (que puede tener en casa|para ahuyentar)\b",
]
_IRRELEVANT_RE = re.compile("|".join(_IRRELEVANT_PATTERNS), re.IGNORECASE)


def _normalize(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


def is_relevant(headline: str, summary: str | None = None, url: str | None = None) -> bool:
    """True si la noticia probablemente le interesa a la DNL — False si cae
    en una categoría de deportes/entretenimiento/horóscopos/loterías/clima
    evidente. Filtro conservador: ante la duda, deja pasar la noticia (mejor
    un falso negativo ocasional que perder algo políticamente relevante)."""
    if url and any(seg in url for seg in _IRRELEVANT_URL_SEGMENTS):
        return False
    text = _normalize(f"{headline} {summary or ''}")
    return not _IRRELEVANT_RE.search(text)


__all__ = ["is_relevant"]
