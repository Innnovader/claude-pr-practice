from unittest.mock import patch

import pytest

from app.sources.control_entities import (
    CONTROL_ENTITY_SOURCES,
    _parse_defensoria_date,
    _parse_fiscalia_date,
    _scrape_defensoria,
    _scrape_fiscalia,
)

FISCALIA_HTML = """
<div class="noticias-grid">
  <article class="noticia-card">
    <div class="noticia-card-content">
      <h2 class="noticia-card-title">
        <a href="https://www.fiscalia.gov.co/noticias/ejemplo-comunicado/">Fiscalía imputó cargos por corrupción a exfuncionario</a>
      </h2>
      <div class="noticia-card-date"><p>Jueves, 30 de julio de 2026 5:35 pm</p></div>
      <div class="noticia-card-excerpt">La Fiscalía General de la Nación imputó cargos...</div>
    </div>
  </article>
</div>
"""

DEFENSORIA_HTML = """
<div class="container">
  <div class="row g-mx-5--sm g-mb-30">
    <div class="col-sm-7 g-px-0--sm">
      <div class="u-info-v1-1">
        <p>Fecha: <a class="g-color-main" href="https://www.defensoria.gov.co/web/guest/-/ejemplo-comunicado">Jul 30, 2026</a></p>
        <h3 class="h3 g-font-weight-600">
          <a class="u-link-v5" href="https://www.defensoria.gov.co/web/guest/-/ejemplo-comunicado">Defensoría alerta sobre riesgos en zona rural</a>
        </h3>
        <p>La Defensoría del Pueblo advirtió sobre...</p>
      </div>
    </div>
  </div>
</div>
"""


def _source(name: str):
    return next(s for s in CONTROL_ENTITY_SOURCES if s.name == name)


def test_parses_fiscalia_long_spanish_date():
    assert _parse_fiscalia_date("Jueves, 30 de julio de 2026 5:35 pm").isoformat() == "2026-07-30T17:35:00+00:00"


def test_parses_defensoria_short_date():
    assert _parse_defensoria_date("Jul 30, 2026").isoformat() == "2026-07-30T00:00:00+00:00"


@pytest.mark.asyncio
async def test_scrape_fiscalia_extracts_title_date_summary():
    with patch("app.sources.control_entities.fetch_html", return_value=FISCALIA_HTML):
        alerts = await _scrape_fiscalia(_source("Fiscalía General de la Nación"))
    assert len(alerts) == 1
    alert = alerts[0]
    assert alert.title == "Fiscalía imputó cargos por corrupción a exfuncionario"
    assert str(alert.source_url) == "https://www.fiscalia.gov.co/noticias/ejemplo-comunicado/"
    assert alert.published_at.isoformat() == "2026-07-30T17:35:00+00:00"
    assert alert.summary and "imputó" in alert.summary


@pytest.mark.asyncio
async def test_scrape_defensoria_extracts_title_date_summary():
    with patch("app.sources.control_entities.fetch_html", return_value=DEFENSORIA_HTML):
        alerts = await _scrape_defensoria(_source("Defensoría del Pueblo"))
    assert len(alerts) == 1
    alert = alerts[0]
    assert alert.title == "Defensoría alerta sobre riesgos en zona rural"
    assert str(alert.source_url) == "https://www.defensoria.gov.co/web/guest/-/ejemplo-comunicado"
    assert alert.published_at.isoformat() == "2026-07-30T00:00:00+00:00"
    assert alert.summary and "advirtió" in alert.summary
