# Radar Liberal DNL — Servicio de Scraping

Servicio Python (FastAPI + APScheduler) que alimenta las tablas de Supabase
con noticias de coyuntura, comunicados de entes de control / centros de
pensamiento y actividad en X (Twitter) de figuras clave.

## Estado actual

**Noticias y centros de pensamiento: funcional y verificado en vivo el
2026-07-23.** `scrape_all_news()` se corrió de extremo a extremo contra sus
3 feeds RSS reales (El Tiempo, La FM, La Silla Vacía) y trajo noticias
reales de ese mismo día. `scrape_all_think_tanks()` también se corrió en
vivo: Fedesarrollo y Dejusticia vía RSS, e IPL y ANIF vía scraping HTML real
con BeautifulSoup (no tienen RSS) — 24 publicaciones reales obtenidas en la
última corrida, todo sin necesidad de ninguna credencial. Banco de la
República (dentro de centros de pensamiento) también quedó resuelto con
BeautifulSoup — ver docstring de `_scrape_banrep`.

**Entes de control: 2 de 4 fuentes reales desde el 2026-07-30.** Fiscalía y
Defensoría corren en HTML server-rendered con listados fechados en vivo —
scraping real con BeautifulSoup (`_scrape_fiscalia`, `_scrape_defensoria`),
con tests contra fixtures fijos en `tests/test_control_entities.py`.
Procuraduría y Contraloría siguen como `STUB`: sus secciones de sala de
prensa renderizan el listado 100% por JS (SharePoint moderno / SPA), no basta
httpx+BeautifulSoup. X/Twitter sigue como `STUB` a la espera de:

- Credenciales reales (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`,
  `X_BEARER_TOKEN` o `TAVILY_API_KEY`).
- Implementación de scraping HTML dirigido (Playwright/BeautifulSoup) contra
  la estructura *actual* de cada sitio — las URLs ya están verificadas (ver
  tabla abajo), falta extraer los comunicados individuales de cada página.

Lo que sí funciona hoy sin credenciales:

- `app/sources/news.py` — scraping real de 3 feeds RSS en vivo.
- `app/dedup.py` — deduplicación por hash y por similitud vectorial (con tests).
- El esquema de modelos (`app/models.py`) que espeja `supabase/migrations/0001_init_schema.sql`.
- El scheduler y los endpoints de health/trigger manual.

### URLs verificadas (HTTP 200) el 2026-07-23 (re-verificado y ampliado 2026-07-30)

| Fuente | URL | Notas |
|---|---|---|
| El Tiempo - Política | `eltiempo.com/rss/politica.xml` | RSS ✓ |
| La FM - Actualidad | `lafm.com.co/rss/actualidad.xml` | RSS ✓ (no `/rss.xml`, que da 404) |
| La Silla Vacía | `lasillavacia.com/feed/` | RSS ✓ |
| El Espectador - Política | `elespectador.com/arc/outboundfeeds/discover/category/politica/` | RSS ✓ (verificado 2026-07-30) — ruta Arc "discover", no "rss" (por eso no se encontró antes) |
| Semana - Política | `semana.com/arc/outboundfeeds/rss/category/politica/` | RSS ✓ (verificado 2026-07-30) — no existía o daba 404 el 2026-07-28 |
| Blu Radio - Noticias del Día | feed Omny.fm del show (ver `app/sources/news.py`) | RSS ✓ (verificado 2026-07-30) — su sitio no tiene RSS de texto, pero el reproductor de audio sí usa RSS estándar por episodio |
| Noticias Caracol (YouTube) | `youtube.com/feeds/videos.xml?channel_id=UC2Xq2PK-got3Rtz9ZJ32hLQ` | RSS ✓ (verificado 2026-07-30) — feed oficial de YouTube por canal, sin API key. Mismo patrón sirve para cualquier otro canal (RCN, W Radio, etc.) si se necesita más adelante |
| Portafolio - Economía | `portafolio.co/rss/economia.xml` | RSS ✓ (verificado 2026-07-30) — su URL "obvia" `/rss` en realidad sirve una página HTML índice de feeds por sección, no el feed en sí |
| La República - Economía | `larepublica.co/rss/economia` | RSS ✓ (verificado 2026-07-30) — usar la ruta scoped a economía, no `/rss` (el feed general mete también sección "Ocio") |
| Fedesarrollo | `repository.fedesarrollo.org.co/feed/rss_1.0/site` | RSS 1.0 del repositorio institucional, no `/feed` |
| Dejusticia | `dejusticia.org/feed/` | RSS ✓ |
| Fiscalía | `fiscalia.gov.co/colombia/noticias/` | HTML ✓ scraping real (verificado 2026-07-30) — WordPress, `article.noticia-card` |
| Defensoría | `defensoria.gov.co/web/guest/noticias` | HTML ✓ scraping real (verificado 2026-07-30) — Liferay, `h3 > a` + `p > a` de fecha |
| Procuraduría | `procuraduria.gov.co/Lists/Sala de Prensa/AllItems.aspx` | STUB — SharePoint moderno, listado 100% JS. La URL vieja (`apps.procuraduria.gov.co/portal/COMUNICADO-A-LA-PRENSA.news`) sigue con HTTP 200 pero quedó congelada en oct-2022, es un CMS abandonado |
| Contraloría | `contraloria.gov.co/contraloria/sala-de-prensa` | STUB — listado no viene en el HTML inicial (SPA) |
| ANIF, Banrep | ver `think_tanks.py` | HTML ✓ scraping real |
| IPL | `institutopensamientoliberal.com` | dominio correcto — NO `pensamientoliberal.org` (no resuelve). Requiere header `Accept` de navegador o responde 406 |

## Setup

```bash
cd services/scraper
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
playwright install chromium   # solo si vas a implementar scraping con JS rendering
cp .env.example .env          # y completa las credenciales
```

## Correr en desarrollo

```bash
uvicorn main:app --reload --port 8000
```

- `GET /health` — chequeo de salud.
- `POST /trigger/news` — dispara un ciclo de noticias inmediatamente.
- `POST /trigger/control` — dispara un ciclo de entes de control/centros de pensamiento.
- `POST /trigger/x` — dispara un ciclo de radar de X.

En producción, el ciclo automático corre cada `SCRAPE_INTERVAL_MINUTES`
(default 10, rango recomendado 5-15 según el brief).

## Correr los tests

```bash
pip install pytest pytest-asyncio
pytest -q
```

## Próximos pasos para conectar fuentes reales

1. **Noticias** (`app/sources/news.py`): ✅ funcional y verificado contra RSS
   en vivo — solo revalidar periódicamente que las URLs sigan vigentes.
   Falta activar El Espectador/Semana (sin RSS estable, ver tabla arriba) y
   conectar `upsert_news()` a un Supabase real.
2. **Entes de control** (`app/sources/control_entities.py`): ✅ Fiscalía y
   Defensoría funcionando (HTML real, sin JS). Falta Procuraduría y
   Contraloría — ambas requieren Playwright porque sus sitios renderizan el
   listado por JS (SharePoint/SPA respectivamente).
3. **Centros de pensamiento** (`app/sources/think_tanks.py`): ✅ Fedesarrollo
   y Dejusticia (RSS) e IPL y ANIF (scraping HTML real) funcionando. Falta
   solo Banco de la República — su listado de publicaciones no trae los
   títulos en el HTML inicial (probablemente los carga por JS), necesita
   investigación adicional o Playwright.
4. **X/Twitter** (`app/sources/x_twitter.py`): poblar `MONITORED_ACCOUNTS`
   con los @handles reales a monitorear y completar la llamada a la API v2
   de X (o Tavily como fallback).
5. **Clasificación IA** (`app/ai.py`): requiere `ANTHROPIC_API_KEY`. La
   función `embed_text` requiere además un proveedor de embeddings (p.ej.
   Voyage AI) para el buscador semántico del Módulo 5 — la API de Anthropic
   no expone embeddings de propósito general.

## Alternativa serverless (recomendada a mediano plazo)

El brief permite Supabase Edge Functions + `pg_cron` en vez de mantener este
proceso Python de larga duración. Cada función `run_*_cycle` en
`app/scheduler.py` está escrita de forma que su lógica pueda migrarse a una
Edge Function (Deno/TypeScript) reescribiendo solo la capa de I/O.
