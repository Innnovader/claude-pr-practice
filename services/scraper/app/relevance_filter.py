"""Filtro de relevancia para noticias (brief: la Dirección Nacional Liberal
sigue muchos temas, pero contenido de entretenimiento/horóscopos/deportes/
loterías/clima no aporta nada y solo le resta señal al panel).

Es un filtro de PRE-FILTRADO conservador (tres capas: ruta de URL + categoría
del feed RSS + palabras clave). NO reemplaza la clasificación real con Claude
(`app/ai.py`) — esa decide relevancia política/económica fina (alto/medio/
bajo). Este filtro solo evita que basura evidente entre a la base de datos,
sin costo de IA.

Verificado el 2026-07-30 (incidente real: "Jhon Álex Castaño reveló por qué
decidió vivir solo" y "¿Cómo formaría Santa Fe...Copa Sudamericana?" de
KienyKe llegaron al panel — ninguno matcheaba la lista de nombres de famosos
ni "/deportes/" en la URL). Al inspeccionar los feeds en vivo se confirmó que
la mayoría de medios SÍ exponen la sección real como señal estructural:
KienyKe la pone en la ruta (`/entretenimiento/...`, `/futbol/...`) Y en la
categoría RSS (`<category>Entretenimiento</category>`); Las2Orillas la pone
solo en la categoría RSS (URLs son planas, sin sección en la ruta). Por eso
`app/sources/rss_base.py` ahora captura `entry.tags` como `FeedEntry.category`
y este filtro la revisa junto con la URL — mucho más robusto que mantener una
lista de nombres de famosos, que siempre va a quedarse corta. Infobae es la
excepción: su RSS no trae `<category>` (`tags: []` en todas sus entradas), así
que para esa fuente seguimos dependiendo de la URL (`/deportes/` sí aparece
ahí) y, para entretenimiento sin marca de sección, de patrones de frase
genéricos (ver más abajo) en vez de nombres propios.
"""

from __future__ import annotations

import re
import unicodedata

# Medios tipo Arc Publishing (Infobae, etc.) a veces marcan la subcategoría
# en la ruta de la URL — esto SÍ es una señal estructural confiable, a
# diferencia de las palabras clave. Cubre las variantes de sección vistas en
# vivo el 2026-07-30 en los 8 medios configurados (ver docstring del módulo).
_IRRELEVANT_URL_SEGMENTS = (
    "/deportes/", "/futbol/", "/entretenimiento/", "/farandula/",
    "/moda/", "/horoscopo/", "/horoscopos/", "/loteria/", "/loterias/",
    "/cine/", "/gastronomia/", "/mascotas/",
)

# Igual que arriba, pero comparado contra la categoría que trae el <category>
# del RSS (feedparser -> entry.tags), normalizada (sin tildes, minúscula).
# Coincide por substring: "boxeo, deportes" matchea "deportes".
_IRRELEVANT_CATEGORY_TERMS = (
    "deportes", "futbol", "entretenimiento", "farandula", "moda",
    "horoscopo", "loteria", "cine", "series de tv", "gastronomia",
    "toros", "mascotas", "viral", "tendencias",
)

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
    # Patrones GENÉRICOS de farándula (no atados a un nombre propio — fuentes
    # como Infobae no marcan sección en su RSS, así que una lista de nombres
    # siempre se va a quedar corta; esto cubre "el cantante/actor/actriz X
    # reveló/confesó/contó..." sin importar quién sea X).
    r"\b(el cantante|la cantante|el actor|la actriz|el humorista|la humorista|"
    r"el comediante|la comediante|el influencer|la influencer|la modelo|el modelo|"
    r"la exreina|el actor de television)\b.*\b(revelo|confeso|conto que|"
    r"hablo de su relacion|se pronuncio sobre su)",
    r"\b(anuncia|anuncio|confirma|confirmo) su gira\b", r"\bnuevo sencillo\b",
    r"\b(concierto|gira) (en colombia|por colombia)\b", r"\bpreventa de boletas\b",
    r"\bfechas de preventa\b", r"\bboleteria\b.*\bconcierto\b",
    # Salud/lifestyle genérico sin relación política (tips caseros)
    r"\breceta[s]? de cocina\b", r"\bcomo preparar\b",
    r"\bplantas? (que puede tener en casa|para ahuyentar)\b",
]
_IRRELEVANT_RE = re.compile("|".join(_IRRELEVANT_PATTERNS), re.IGNORECASE)


def _normalize(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


def is_relevant(
    headline: str,
    summary: str | None = None,
    url: str | None = None,
    category: str | None = None,
) -> bool:
    """True si la noticia probablemente le interesa a la DNL — False si cae
    en una categoría de deportes/entretenimiento/horóscopos/loterías/clima
    evidente. Filtro conservador: ante la duda, deja pasar la noticia (mejor
    un falso negativo ocasional que perder algo políticamente relevante).

    `category` es la(s) categoría(s) que trae el propio RSS del medio
    (`FeedEntry.category`) — cuando está disponible es más confiable que
    adivinar por palabras clave (ver docstring del módulo)."""
    if url and any(seg in url for seg in _IRRELEVANT_URL_SEGMENTS):
        return False
    if category:
        normalized_category = _normalize(category)
        if any(term in normalized_category for term in _IRRELEVANT_CATEGORY_TERMS):
            return False
    text = _normalize(f"{headline} {summary or ''}")
    return not _IRRELEVANT_RE.search(text)


__all__ = ["is_relevant"]
