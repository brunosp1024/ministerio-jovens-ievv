import logging
from app.db.session import AsyncSessionLocal
from app.services.notificacao_service import NotificacaoService
from app.services.whatsapp_service import WhatsAppService

logger = logging.getLogger(__name__)


async def verificar_aniversariantes():
    """Task executada diariamente às 6h para gerar notificações de aniversário."""
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
