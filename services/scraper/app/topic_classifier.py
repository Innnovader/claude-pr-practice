"""Clasificación automática de noticias por tema (Archivo — brief de la DNL:
"consolidar un archivo bien sólido, automatizado" por categorías fijas).

Es clasificación por palabras clave (gratis, sin IA) — un primer nivel útil
mientras no haya presupuesto para Anthropic. Cuando se active la
clasificación con Claude (app/ai.py), esta función puede quedar como
fallback para cuando la IA no esté disponible, o reemplazarse del todo.

LIMITACIÓN: igual que relevance_filter.py, esto es un clasificador de
reglas, no de IA — no entiende contexto ni matices. Una noticia se asigna
al PRIMER tema cuya categoría matchee, en el orden de PRIORITY (los temas
más específicos van primero para no perderse dentro de "Gobierno ADLE",
que es el más genérico/catch-all de la política de gobierno).
"""

from __future__ import annotations

import re
import unicodedata

# Orden = prioridad (de más específico a más genérico). Se evalúa en este
# orden y se asigna la PRIMERA categoría que matchee.
TOPIC_KEYWORDS: dict[str, list[str]] = {
    "Salud": [
        r"\bsalud\b", r"\beps\b", r"\bminsalud\b", r"\bhospital", r"\bcirugia",
        r"\bmedicament", r"\bvacuna", r"\bpandemia", r"\bsistema de salud\b",
        r"\breforma a la salud\b", r"\badres\b",
    ],
    "Pensiones": [
        r"\bpension", r"\bcolpensiones\b", r"\bfomag\b", r"\bregimen pensional\b",
        r"\breforma pensional\b", r"\bcolfondos\b", r"\bproteccion s\.?a\b",
    ],
    "Seguridad": [
        r"\bseguridad\b", r"\borden publico\b", r"\bejercito\b", r"\bpolicia\b",
        r"\bfuerzas militares\b", r"\bdisidencias\b", r"\bclan del golfo\b",
        r"\beln\b", r"\bextorsion", r"\bsecuestro\b", r"\bmasacre\b",
        r"\bterrorismo\b", r"\battentado\b", r"\bhomicidio",
    ],
    "Medio ambiente": [
        r"\bmedio ambiente\b", r"\bminambiente\b", r"\bdeforestacion\b",
        r"\bamazonia\b", r"\bcambio climatico\b", r"\bemisiones\b",
        r"\bbiodiversidad\b", r"\bparamo\b", r"\brecursos naturales\b",
        r"\bmineria ilegal\b",
    ],
    "Justicia": [
        r"\bcorte constitucional\b", r"\bcorte suprema\b", r"\bfiscalia\b",
        r"\bjep\b", r"\bprocuraduria\b", r"\bcontraloria\b", r"\bimputacion\b",
        r"\bcondena[dr]", r"\bjuez\b", r"\bjuicio\b",
    ],
    "Congreso": [
        r"\bcongreso\b", r"\bsenado\b", r"\bcamara de representantes\b",
        r"\bproyecto de ley\b", r"\bsenador", r"\brepresentante a la camara\b",
        r"\bplenaria\b", r"\bponente\b",
    ],
    "Economia": [
        r"\beconomi", r"\bdolar\b", r"\binflacion\b", r"\bpib\b", r"\bimpuesto",
        r"\breforma tributaria\b", r"\bdian\b", r"\bminhacienda\b",
        r"\bpresupuesto (general |nacional )?de la nacion\b", r"\bbanco de la republica\b",
        r"\btasa de interes\b", r"\bdesempleo\b", r"\bempleo\b", r"\bexportacion",
        r"\bimportacion",
    ],
    # Catch-all de gobierno/presidencia — al final por ser el más genérico.
    "Gobierno ADLE": [
        r"\babelardo de la espriella\b", r"\badle\b", r"\bgabinete\b",
        r"\bcasa de narino\b", r"\bposesion presidencial\b",
        r"\bdecreto presidencial\b", r"\bpresidencia de la republica\b",
        r"\bministro de\b", r"\bministra de\b",
    ],
}

_COMPILED = {topic: re.compile("|".join(patterns), re.IGNORECASE) for topic, patterns in TOPIC_KEYWORDS.items()}

FALLBACK_TOPIC = "Otros"


def _normalize(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


def classify_topic(headline: str, summary: str | None = None) -> str:
    """Retorna el nombre de la primera categoría que matchee, o "Otros" si
    ninguna aplica. NO es clasificación con IA — ver docstring del módulo."""
    text = _normalize(f"{headline} {summary or ''}")
    for topic, pattern in _COMPILED.items():
        if pattern.search(text):
            return topic
    return FALLBACK_TOPIC


__all__ = ["classify_topic", "TOPIC_KEYWORDS", "FALLBACK_TOPIC"]
