"""Modelos Pydantic espejo del esquema SQL en supabase/migrations/0001_init_schema.sql.

Mantener sincronizados manualmente con la migración: estos modelos son el
contrato de datos entre los scrapers y las tablas de Postgres.
"""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field, HttpUrl


class ImpactLevel(str, Enum):
    alto = "alto"
    medio = "medio"
    bajo = "bajo"


class Sentiment(str, Enum):
    positivo = "positivo"
    neutro = "neutro"
    negativo = "negativo"


class SourceCategory(str, Enum):
    ente_control = "ente_control"
    centro_pensamiento = "centro_pensamiento"


class ScrapedNews(BaseModel):
    """Fila candidata para public.coyuntura_news."""

    headline: str
    summary: str | None = None
    body: str | None = None
    source_name: str
    source_url: HttpUrl
    topic: str | None = None
    sentiment: Sentiment | None = None
    entities: list[dict] = Field(default_factory=list)
    dnl_relevance: ImpactLevel | None = None
    published_at: datetime
    content_hash: str


class ScrapedTweet(BaseModel):
    """Fila candidata para public.x_tweets."""

    author_handle: str
    author_name: str
    author_category: str  # gobierno | oposicion | aliados | dnl_liderazgo | medios
    content: str
    tweet_url: HttpUrl
    sentiment: Sentiment | None = None
    topic: str | None = None
    engagement_likes: int = 0
    engagement_reposts: int = 0
    posted_at: datetime
    content_hash: str


class ScrapedControlAlert(BaseModel):
    """Fila candidata para public.control_alerts."""

    source_entity: str
    source_category: SourceCategory
    title: str
    summary: str | None = None
    alert_type: str | None = None
    impact_level: ImpactLevel
    source_url: HttpUrl
    published_at: datetime
    content_hash: str


class ScrapeRunResult(BaseModel):
    """Resultado de auditoría de un ciclo de scraping (public.scrape_runs)."""

    source_name: str
    status: str  # success | partial | failed
    items_found: int = 0
    items_inserted: int = 0
    items_deduplicated: int = 0
    error_message: str | None = None
    started_at: datetime
    finished_at: datetime | None = None
