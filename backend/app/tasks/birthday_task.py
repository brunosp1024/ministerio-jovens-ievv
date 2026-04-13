from apscheduler.schedulers.blocking import BlockingScheduler
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings, setup_logging
from app.services.notificacao_service import NotificacaoService
from app.services.whatsapp_service import WhatsAppService

logging = setup_logging()
logger = logging.getLogger(__name__)


async def verificar_aniversariantes():
    engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    logger.info("Verificando aniversariantes do dia...")
    async with AsyncSessionLocal() as db:
        service = NotificacaoService(db)
        notificacoes = await service.criar_notificacoes_aniversario()
        if notificacoes:
            logger.info(f"{len(notificacoes)} notificação(ões) de aniversário criada(s).")
            whatsapp_service = WhatsAppService()
            try:
                enviado = await whatsapp_service.enviar_resumo_aniversarios(notificacoes)
                if enviado:
                    logger.info("Resumo de aniversários enviado para o WhatsApp configurado.")
            except Exception:
                logger.exception("Falha ao enviar resumo de aniversários por WhatsApp.")
        else:
            logger.info("Nenhum aniversariante hoje.")
    return notificacoes

if __name__ == "__main__":
    asyncio.run(verificar_aniversariantes())
