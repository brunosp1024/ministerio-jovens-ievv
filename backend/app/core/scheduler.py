from app.core.config import setup_logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.schedulers.blocking import BlockingScheduler
from app.tasks.birthday_task import verificar_aniversariantes

logging = setup_logging()
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

def setup_scheduler():
    logger.info("Chamando setup_scheduler")

    scheduler_params = {
        'trigger': CronTrigger(hour=6, minute=0),
        'replace_existing': True,
        'max_instances': 1,
        'coalesce': True
    }

    scheduler = BlockingScheduler()
    scheduler.add_job(
        verificar_aniversariantes,
        id="verificar_aniversariantes",
        **scheduler_params
    )
    scheduler.start()
    logger.info("Scheduler iniciado. Task de aniversário agendada para 06:00 diariamente.")

if __name__ == "__main__":
    setup_scheduler()
