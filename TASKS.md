# Radar Liberal DNL — Tareas pendientes

Lista de trabajo pendiente para el agente programado. Al completar una
tarea: márcala con [x], describe brevemente qué se hizo, haz commit y push
a la rama `feature/radar-liberal-dnl`.

## Pendientes

- [ ] Investigar e integrar GDELT Project (api.gdeltproject.org/api/v2/doc/doc)
      como fuente ampliada de noticias colombianas — respetar el límite de
      1 request/5s (devuelve 429 si se excede). Ver services/scraper/app/sources/news.py
      para el patrón a seguir (fetch, filtro de relevancia, filtro de tema).
- [ ] Subcarpetas dinámicas dentro de "Otros" en Archivo (apps/web/lib/data/archivo.ts,
      apps/web/app/archivo/). Hoy "Otros" concentra ~177 noticias sin subclasificar
      porque el clasificador de services/scraper/app/topic_classifier.py no las
      reconoce. Ampliar TOPIC_KEYWORDS con categorías nuevas basándote en los
      titulares reales que caen en "Otros", para reducir ese balde.
- [ ] Scraper real de entes de control (Procuraduría, Contraloría, Fiscalía,
      Defensoría) — requiere Playwright porque son portales Liferay que cargan
      contenido por JS. Ver services/scraper/app/sources/control_entities.py
      (stub documentado) y services/scraper/README.md.
- [ ] Más medios colombianos con RSS real (probar: variantes de Caracol Radio,
      El Colombiano, El País Cali — los patrones obvios ya se probaron y
      fallaron, ver comentario BROKEN_NEWS_SOURCES en news.py).
- [ ] Revisar y mejorar cobertura del topic_classifier.py — verificar que las
      categorías no se solapen mal (p.ej. Congreso vs Gobierno ADLE) corriendo
      scrape_all_news() y revisando la distribución de temas manualmente.

## Reglas para el agente

- Nunca fabricar datos reales (nombres de personas, cifras, declaraciones) —
  ver el disclaimer en el README raíz sobre datos mock vs verificados.
- Nunca commitear archivos .env ni credenciales.
- Antes de dar una fuente/URL nueva por buena, verificarla con una petición
  HTTP real (no asumir que existe).
- Actualizar este archivo (marcar tareas hechas, agregar las que surjan) en
  cada commit.
