"""Punto de entrada del servicio de scraping — Radar Liberal DNL.

Ejecutar en desarrollo:
    uvicorn main:app --reload --port 8000

El scheduler arranca junto con la app (lifespan) y corre los tres ciclos de
ingestión (noticias, entes de control/centros de pensamiento, X) cada
SCRAPE_INTERVAL_MINUTES. Los endpoints HTTP permiten disparar un ciclo
manualmente y consultar salud del servicio.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.scheduler import run_control_cycle, run_news_cycle, run_x_cycle, start_scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    start_scheduler()
    yield


app = FastAPI(title="Radar Liberal DNL — Scraper Service", lifespan=lifespan)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/trigger/news")
async def trigger_news() -> dict:
    await run_news_cycle()
    return {"triggered": "news"}


@app.post("/trigger/control")
async def trigger_control() -> dict:
    await run_control_cycle()
    return {"triggered": "control"}


@app.post("/trigger/x")
async def trigger_x() -> dict:
    await run_x_cycle()
    return {"triggered": "x"}
