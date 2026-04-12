import logging
import re
from typing import Sequence

import httpx

from app.core.config import settings
from app.models.notificacao import Notificacao

logger = logging.getLogger(__name__)


class WhatsAppService:
    def __init__(self):
        self.enabled = settings.WHATSAPP_ENABLED
        self.api_url = settings.EVOLUTION_API_URL.rstrip("/")
        self.api_key = settings.AUTHENTICATION_API_KEY
        self.instance_name = settings.EVOLUTION_INSTANCE_NAME
        self.recipient_phone = self._normalizar_telefone(settings.WHATSAPP_RECIPIENT_PHONE)
        self.timeout_seconds = settings.WHATSAPP_TIMEOUT_SECONDS

    @property
    def configurado(self) -> bool:
        return all([
            self.enabled,
            self.api_url,
            self.api_key,
            self.instance_name,
            self.recipient_phone,
        ])

    async def enviar_resumo_aniversarios(self, notificacoes: Sequence[Notificacao]) -> bool:
        if not notificacoes:
            return False

        if not self.enabled:
            logger.info("Envio por WhatsApp desabilitado. Resumo de aniversários não enviado.")
            return False

        if not self.configurado:
            logger.warning(
                "Configuração da Evolution API incompleta. Defina EVOLUTION_API_URL, "
                "AUTHENTICATION_API_KEY, EVOLUTION_INSTANCE_NAME e WHATSAPP_RECIPIENT_PHONE para habilitar o envio."
            )
            return False

        mensagem = self._montar_mensagem_aniversarios(notificacoes)
        endpoint = f"{self.api_url}/message/sendText/{self.instance_name}"
        payload = {
            "number": self.recipient_phone,
            "text": mensagem,
        }
        headers = {
            "apikey": self.api_key,
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()

        logger.info(
            "Resumo de aniversários enviado por WhatsApp via Evolution API para o número configurado."
        )
        return True

    def _montar_mensagem_aniversarios(self, notificacoes: Sequence[Notificacao]) -> str:
        cabecalho = "Aniversariantes de hoje"
        linhas = [cabecalho, ""]
        for notificacao in notificacoes:
            linhas.append(f"- {notificacao.titulo}: {notificacao.mensagem}")
        return "\n".join(linhas)

    def _normalizar_telefone(self, telefone: str) -> str:
        return re.sub(r"\D", "", telefone or "")