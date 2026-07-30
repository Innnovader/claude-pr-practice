"""Entrypoint para un solo ciclo de scraping, pensado para invocarse desde
un scheduler externo (GitHub Actions cron) en vez de mantener el proceso
FastAPI+APScheduler corriendo de forma permanente.

Uso:
    python run_scheduled.py
"""

from __future__ import annotations

import asyncio
import logging

from app.scheduler import run_control_cycle, run_news_cycle

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


async def main() -> None:
    await run_news_cycle()
    await run_control_cycle()


if __name__ == "__main__":
    asyncio.run(main())
