"""Archivo legislativo histórico (Buscador RAG — brief: "el PLC es el
partido más antiguo de Colombia", el buscador debe cubrir más que el
periodo legislativo actual).

Fuente: datos.gov.co, dataset "Vista Proyectos de Ley" (id xs56-s7w6),
publicado por la Cámara de Representantes bajo licencia Creative Commons
Attribution-ShareAlike 4.0. Verificado el 2026-07-29: 1075 filas, API
Socrata pública (sin necesidad de API key para este volumen).

NO se intenta vincular estos proyectos a `parliamentarians` — son de
periodos legislativos anteriores, personas distintas a los congresistas
actuales.

ADVERTENCIA sobre el dataset fuente: los nombres de columna de la API
Socrata NO corresponden de forma estable a su contenido real — se
verificó contra filas reales de distintos lotes del dataset y el
significado de `enlace_proyecto_de_ley`, `tipo_de_proyecto` y
`legislatura` varía (a veces trae autor(es), a veces tipo de ley, a
veces una URL de gaceta, a veces el periodo legislativo). En vez de
adivinar y arriesgarse a etiquetar mal un dato real, esos 3 campos se
guardan tal cual en `raw_extra` (jsonb) con sus llaves originales.
Los campos que SÍ se verificaron consistentes entre lotes (número de
proyecto, título, estado, url de contenido) se mapean directo.
"""

from __future__ import annotations

import logging

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

DATASET_ID = "xs56-s7w6"
BASE_URL = f"https://www.datos.gov.co/resource/{DATASET_ID}.json"
PAGE_SIZE = 1000

# Campos verificados como estables entre lotes del dataset.
_STABLE_FIELDS = {
    "_": "bill_number_camara",
    "camara": "bill_number_senado",
    "senado": "title",                       # la fuente nombra mal esta columna: trae el título largo
    "nombre_del_proyecto_de_ley": "summary_title",
    "estado_del_proyecto_de_ley": "status",
}
_CONTENT_URL_FIELD = "contenido_del_proyecto_de_ley"
# Campos con significado inconsistente entre lotes — se preservan crudos.
_RAW_FIELDS = ["enlace_proyecto_de_ley", "tipo_de_proyecto", "legislatura"]


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def _fetch_page(offset: int) -> list[dict]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            BASE_URL,
            params={"$limit": PAGE_SIZE, "$offset": offset, "$order": ":id"},
            headers={"User-Agent": "RadarLiberalDNL/1.0 (+monitoreo politico; contacto: analitica@dnl.example)"},
        )
        response.raise_for_status()
        return response.json()


def _map_row(raw: dict) -> dict:
    mapped: dict = {}
    for source_key, dest_key in _STABLE_FIELDS.items():
        mapped[dest_key] = raw.get(source_key)

    content = raw.get(_CONTENT_URL_FIELD)
    mapped["content_url"] = content.get("url") if isinstance(content, dict) else content

    mapped["raw_extra"] = {k: raw.get(k) for k in _RAW_FIELDS if raw.get(k) is not None}
    return mapped


async def fetch_all_historical_bills() -> list[dict]:
    """Descarga el dataset completo (paginado) y lo mapea a columnas de
    public.historical_bills."""
    all_rows: list[dict] = []
    offset = 0
    while True:
        page = await _fetch_page(offset)
        if not page:
            break
        all_rows.extend(_map_row(row) for row in page)
        if len(page) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    logger.info("historical_bills: %d filas descargadas de datos.gov.co", len(all_rows))
    return all_rows


def upsert_historical_bills(rows: list[dict]) -> int:
    from app.db import get_client

    if not rows:
        return 0
    client = get_client()
    # Sin content_hash/unique constraint en esta tabla (dataset estático,
    # no se re-scrapea en vivo) — se limpia la tabla antes de insertar
    # para evitar duplicados si este script se corre más de una vez.
    client.table("historical_bills").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    # Insertar en lotes de 200 — Supabase/PostgREST puede rechazar payloads
    # muy grandes de una sola vez.
    total = 0
    batch_size = 200
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        result = client.table("historical_bills").insert(batch).execute()
        total += len(result.data or [])
    return total


__all__ = ["fetch_all_historical_bills", "upsert_historical_bills"]
