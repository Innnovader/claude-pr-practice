"""Deduplicación de contenido scrapeado (brief §4.3).

Dos capas:
  1. Hash exacto (sha256 de título+fuente normalizados) — filtra reinserciones
     idénticas antes de tocar la base de datos.
  2. Similitud vectorial (coseno sobre embeddings) — filtra near-duplicates
     (la misma noticia reescrita por dos medios, un hilo de X repetido).
     Se calcula en el momento de insertar contra los embeddings recientes
     ya almacenados en Postgres/pgvector.
"""

from __future__ import annotations

import hashlib
import re


def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\w\sáéíóúñ]", "", text)
    return text


def content_hash(title: str, source_name: str) -> str:
    """Hash determinístico usado como clave única de deduplicación exacta."""
    normalized = f"{normalize_text(title)}|{normalize_text(source_name)}"
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if len(a) != len(b) or not a:
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(y * y for y in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def is_near_duplicate(
    candidate_embedding: list[float],
    existing_embeddings: list[list[float]],
    threshold: float,
) -> bool:
    """True si el candidato es semánticamente casi-idéntico a algo ya guardado.

    En producción, `existing_embeddings` debería venir de una consulta
    pgvector `ORDER BY embedding <=> candidate LIMIT N` en vez de traer todo
    a memoria — aquí se deja simple porque este módulo es el que se testea
    unitariamente (ver services/scraper/tests/test_dedup.py).
    """
    return any(
        cosine_similarity(candidate_embedding, existing) >= threshold
        for existing in existing_embeddings
    )
