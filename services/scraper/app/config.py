"""Configuración centralizada del servicio de scraping.

Todos los secretos se leen de variables de entorno (.env local o secretos
del orquestador en producción). Nunca se deben hardcodear credenciales.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    # Anthropic (clasificación de sentimiento, NER, resúmenes ejecutivos)
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-5"

    # X (Twitter) API v2 — requiere plan con acceso a filtered stream / recent search
    x_bearer_token: str = ""

    # Tavily (búsqueda/scraping asistido como alternativa a X API directa)
    tavily_api_key: str = ""

    # Scheduler
    scrape_interval_minutes: int = 10  # rango recomendado por el brief: 5-15 min

    # Deduplicación por similitud vectorial (umbral coseno; 1.0 = idéntico)
    dedup_similarity_threshold: float = 0.92


settings = Settings()
