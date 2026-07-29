"""Clasificación con Claude (Anthropic API) — brief §2 "Procesamiento e IA".

Punto único de integración con el modelo para:
  * Sentimiento (positivo/neutro/negativo) de noticias, tweets y declaraciones.
  * Extracción de entidades (NER) en noticias.
  * Resumen ejecutivo de discursos / proyectos de ley.
  * Clasificación de impacto (alto/medio/bajo) para alertas de entes de
    control y centros de pensamiento, en función de relevancia partidista.

Se aísla en un solo módulo para que los scrapers de app/sources/*.py no
dependan directamente del SDK de Anthropic y para poder testear con un
cliente mockeado.
"""

from __future__ import annotations

import json
import logging

from anthropic import AsyncAnthropic

from app.config import settings

logger = logging.getLogger(__name__)

_client: AsyncAnthropic | None = None


def get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        if not settings.anthropic_api_key:
            raise RuntimeError("ANTHROPIC_API_KEY no configurado.")
        _client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


CLASSIFY_NEWS_SYSTEM_PROMPT = """\
Eres un analista político. Clasifica el siguiente contenido y responde
ÚNICAMENTE con JSON válido, sin texto adicional, con este esquema exacto:
{
  "sentiment": "positivo" | "neutro" | "negativo",
  "topic": string,                 // p.ej. "Reforma tributaria", "Orden público"
  "entities": [{"name": string, "type": "persona" | "organizacion" | "lugar"}],
  "dnl_relevance": "alto" | "medio" | "bajo",
  "summary": string                // resumen ejecutivo en máx. 3 frases
}
No inventes datos que no estén en el texto. Si no hay suficiente información
para un campo, usa el valor más conservador ("neutro", "bajo", lista vacía).
"""


async def classify_news_item(headline: str, body: str | None) -> dict:
    """Clasifica una noticia. Retorna el dict parseado del esquema anterior.

    Lanza si la respuesta del modelo no es JSON válido — el llamador decide
    si degradar a valores por defecto o descartar el item.
    """
    client = get_client()
    text = f"Titular: {headline}\n\nCuerpo: {body or '(sin cuerpo disponible)'}"
    response = await client.messages.create(
        model=settings.anthropic_model,
        max_tokens=1024,
        system=CLASSIFY_NEWS_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": text}],
    )
    raw = "".join(block.text for block in response.content if block.type == "text")
    return json.loads(raw)


CLASSIFY_ALERT_SYSTEM_PROMPT = """\
Eres un analista político liberal. Evalúa el impacto del siguiente comunicado
de un ente de control o centro de pensamiento para la agenda del Partido
Liberal colombiano. Responde ÚNICAMENTE con JSON:
{
  "impact_level": "alto" | "medio" | "bajo",
  "summary": string   // resumen ejecutivo en máx. 3 frases
}
"""


async def classify_control_alert(title: str, body: str | None) -> dict:
    client = get_client()
    text = f"Título: {title}\n\nContenido: {body or '(sin contenido adicional disponible)'}"
    response = await client.messages.create(
        model=settings.anthropic_model,
        max_tokens=512,
        system=CLASSIFY_ALERT_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": text}],
    )
    raw = "".join(block.text for block in response.content if block.type == "text")
    return json.loads(raw)


async def embed_text(text: str) -> list[float]:
    """Genera un embedding para búsqueda semántica (Módulo 5 — RAG).

    NOTA: la Anthropic API no expone actualmente un endpoint de embeddings
    de propósito general; este proyecto asume un proveedor de embeddings
    separado (p.ej. Voyage AI, recomendado por Anthropic para RAG). Definir
    VOYAGE_API_KEY y completar esta función antes de activar el buscador
    semántico del Módulo 5.
    """
    raise NotImplementedError(
        "Configura un proveedor de embeddings (p.ej. Voyage AI) para habilitar "
        "la búsqueda semántica del Módulo 5."
    )
