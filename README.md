# CLAUDE

Este repositorio contiene dos proyectos independientes:

1. **[hello.py](hello.py)** — script de práctica original para aprender el flujo de Pull Requests con Claude Code.
   ```bash
   python hello.py
   ```
2. **Radar Liberal DNL** — plataforma de inteligencia política para la Dirección Nacional Liberal (Colombia), documentada abajo.

---

# Radar Liberal DNL

Plataforma web de monitoreo político en tiempo real para la Dirección
Nacional Liberal: coyuntura nacional, bancada liberal en el Congreso
(2026–2030), entes de control, centros de pensamiento, poder territorial y
un buscador semántico sobre todo el archivo documental.

## Estado del proyecto

**Verificado en ejecución real el 2026-07-23:** `npm run build` compila sin
errores, `npm audit` reporta 0 vulnerabilidades, y el scraper de noticias
(`services/scraper/app/sources/news.py`) se probó contra sus 3 feeds RSS en
vivo, trayendo noticias reales de ese mismo día. El dashboard se navegó
completo en los 5 módulos, en modo claro y oscuro, sin errores de consola.

El frontend es completamente navegable con datos de ejemplo (claramente
marcados como `is_mock_data`/mock en toda la UI), salvo el Senado 2026-2030
(ver abajo), que ya es un registro real y verificado. El esquema de base de
datos está completo. El servicio de scraping tiene 3 fuentes de noticias
funcionando de extremo a extremo contra RSS en vivo; el resto de fuentes
(entes de control, centros de pensamiento no-RSS, X/Twitter) están
estructuradas con el contrato de datos y el flujo documentado, pero
requieren credenciales (Supabase, Anthropic, X API o Tavily) — ver
[services/scraper/README.md](services/scraper/README.md).

**Sobre los nombres de personas reales:** el único dato real en toda la app
son los 13 senadores liberales 2026-2030 (`lib/verified-data/`), verificados
cruzando 3 fuentes de prensa independientes, y mostrados SIN ningún campo
analítico inventado (nada de bio, índice de alineación o declaraciones
fabricadas atribuidas a ellos — eso sería desinformación, no placeholder).
Todo lo demás — congresistas de Cámara, funcionarios territoriales, cifras,
comunicados — son placeholders ficticios para desarrollo.

## Arquitectura

```
/apps/web             Next.js 15 (App Router, React 19) — frontend del dashboard
/services/scraper      FastAPI (Python) — ingestión programada de noticias,
                        entes de control, centros de pensamiento y X/Twitter
/supabase/migrations   Esquema SQL (Postgres + pgvector) con RLS por rol
```

- **Frontend:** Next.js 15 + Tailwind CSS v4 + Recharts + react-leaflet. Tema
  claro/oscuro con branding del Partido Liberal (rojo `#D32F2F`, blanco, gris slate).
- **Base de datos:** Supabase (Postgres + Realtime + pgvector para RAG).
  Ver [supabase/migrations/0001_init_schema.sql](supabase/migrations/0001_init_schema.sql).
- **Ingestión:** servicio Python con scheduler cada 5–15 min, deduplicación
  por hash + similitud vectorial, y clasificación con Claude (sentimiento,
  NER, resúmenes ejecutivos, impacto).
- **Roles de usuario** (Supabase Auth): `super_admin` (DNL), `analyst`
  (analista/asesor), `reader` (consulta).

## Módulos

1. **Centro de Control de Coyuntura** — live feed multifuente, radar de X, analítica de sentimiento/temas.
2. **Bancada Liberal Congreso 2026–2030** — 13 senadores + representantes, ficha individual con proyectos de ley, votaciones, alertas de declaraciones críticas.
3. **Vigía de Entes de Control** — Procuraduría, Contraloría, Fiscalía, Defensoría, IPL, Fedesarrollo, Dejusticia, ANIF, Banco de la República.
4. **Mapa del Poder Territorial** — gobernaciones, alcaldías, concejales, diputados por departamento/municipio.
5. **Buscador Inteligente (RAG)** — búsqueda semántica sobre proyectos de ley, noticias y alertas.

## Setup rápido

### 1. Base de datos (Supabase)

```bash
# Con la Supabase CLI, desde la raíz del repo:
supabase init      # si aún no existe supabase/config.toml
supabase link --project-ref <tu-project-ref>
supabase db push   # aplica supabase/migrations/0001_init_schema.sql
```

### 2. Frontend

```bash
cd apps/web
npm install
cp .env.example .env.local   # completa NEXT_PUBLIC_SUPABASE_URL / ANON_KEY
npm run dev                  # http://localhost:3000
```

Sin `.env.local` configurado, el frontend funciona igual: las API routes
(`/api/coyuntura`, `/api/parlamentarios`, `/api/mapa`, `/api/entes-control`,
`/api/tweets`) detectan la ausencia de credenciales y sirven los datos mock
de `lib/mock-data/`.

### 3. Servicio de scraping

```bash
cd services/scraper
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # completa SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, etc.
uvicorn main:app --reload --port 8000
```

Detalle de qué está implementado vs. pendiente por fuente en
[services/scraper/README.md](services/scraper/README.md).

## Variables de entorno necesarias para producción

| Variable | Dónde | Para qué |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `apps/web/.env.local` | Frontend (respeta RLS) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | `services/scraper/.env` | Scraper (bypassa RLS para escribir) |
| `ANTHROPIC_API_KEY` | `services/scraper/.env` | Clasificación de sentimiento, NER, resúmenes, impacto |
| `X_BEARER_TOKEN` o `TAVILY_API_KEY` | `services/scraper/.env` | Radar de X/Twitter |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `apps/web/.env.local` | Opcional — solo si se reemplaza el basemap gratuito de OpenStreetMap por Mapbox GL |

## Próximos pasos sugeridos

1. Poblar `parliamentarians` (Cámara — 24 curules liberales, aún sin
   verificar nombre-por-nombre, ver nota en
   `lib/verified-data/senado-liberal-2026-2030.ts`) y `territorial_power`
   con datos oficiales (camara.gov.co/CNE, Registraduría, reporte de la DNL).
2. Activar las fuentes de scraping restantes (entes de control, centros de
   pensamiento no-RSS, X/Twitter) — ver checklist en
   `services/scraper/README.md`. Las 3 fuentes RSS de noticias ya funcionan.
3. Conectar Supabase Auth + políticas RLS ya definidas con la gestión de
   roles real (`super_admin` / `analyst` / `reader`).
4. Elegir y configurar un proveedor de embeddings (p.ej. Voyage AI) para
   activar la búsqueda semántica real del Módulo 5.
5. Crear un proyecto Supabase real y correr `supabase db push` — hoy el
   esquema solo se verificó por lectura, no contra una instancia Postgres viva.
