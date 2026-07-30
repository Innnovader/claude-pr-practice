from unittest.mock import patch

import pytest

from app.sources.gdelt import _parse_gdelt_date, scrape_gdelt_news

SAMPLE_ARTICLES = [
    {
        "url": "https://www.example-colombia.co/politica/congreso-aprueba-ley",
        "title": "Congreso aprobó en primer debate la reforma tributaria",
        "seendate": "20260730T173500Z",
        "domain": "example-colombia.co",
        "language": "Spanish",
        "sourcecountry": "Colombia",
    },
    {
        "url": "https://www.example-colombia.co/farandula/cantante-lanza-cancion",
        "title": "El cantante reveló detalles de su próxima gira por Colombia",
        "seendate": "20260730T160000Z",
        "domain": "example-colombia.co",
        "language": "Spanish",
        "sourcecountry": "Colombia",
    },
    {
        "url": "https://www.example-colombia.co/sin-titulo",
        "title": "",
        "seendate": "20260730T150000Z",
        "domain": "example-colombia.co",
    },
]


def test_parses_gdelt_seendate_format():
    assert _parse_gdelt_date("20260730T173500Z").isoformat() == "2026-07-30T17:35:00+00:00"


def test_parses_invalid_date_without_raising():
    from datetime import datetime, timezone

    result = _parse_gdelt_date("not-a-date")
    assert isinstance(result, datetime)
    assert result.tzinfo == timezone.utc


@pytest.mark.asyncio
async def test_scrape_gdelt_news_filters_irrelevant_and_maps_fields():
    with patch("app.sources.gdelt._fetch_gdelt_articles", return_value=SAMPLE_ARTICLES):
        items = await scrape_gdelt_news()
    assert len(items) == 1
    item = items[0]
    assert item.headline == "Congreso aprobó en primer debate la reforma tributaria"
    assert item.source_name == "GDELT · example-colombia.co"
    assert item.published_at.isoformat() == "2026-07-30T17:35:00+00:00"
    assert item.summary is None


@pytest.mark.asyncio
async def test_scrape_gdelt_news_returns_empty_list_on_fetch_failure():
    with patch("app.sources.gdelt._fetch_gdelt_articles", side_effect=RuntimeError("429")):
        items = await scrape_gdelt_news()
    assert items == []
