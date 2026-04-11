import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


def setup_scheduler():
    from app.tasks.birthday_task import verificar_aniversariantes

    scheduler.add_job(
        verificar_aniversariantes,
        trigger=CronTrigger(hour=6, minute=0),
        id="verificar_aniversariantes",
        name="Verificar aniversariantes do dia",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler iniciado. Task de aniversário agendada para 06:00 diariamente.")


def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler encerrado.")
