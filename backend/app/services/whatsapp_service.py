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
        self.recipient_phone = settings.WHATSAPP_RECIPIENT_PHONE
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

    async def get_profile_picture_url(self, phone: str) -> str | None:
        """Busca a URL da foto de perfil do WhatsApp via Evolution API."""
        if not self.enabled or not phone:
            return None
    
        url = f"{self.api_url}/chat/fetchProfilePictureUrl/{self.instance_name}"
        headers = {"Content-Type": "application/json", "apikey": self.api_key}
        payload = {"number": f"+{phone}" if not phone.startswith("+") else phone}

        try:
            resp = httpx.post(url, headers=headers, json=payload)
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    profile_url = data.get("profilePictureUrl")
                    if profile_url and profile_url.startswith("http"):
                        return profile_url
        except Exception as e:
            logger.warning(f"Erro ao buscar foto de perfil do WhatsApp: {e}")
        return None
