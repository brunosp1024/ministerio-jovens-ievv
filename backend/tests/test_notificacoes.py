import pytest
from httpx import AsyncClient
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock
from app.core.config import settings
from app.models.notificacao import Notificacao
from app.services.notificacao_service import NotificacaoService
from app.services.whatsapp_service import WhatsAppService
from app.schemas.notificacao import NotificacaoCreate

pytestmark = pytest.mark.asyncio

JOVEM_PAYLOAD = {
    "nome": "Pedro Test",
    "email": "pedro@test.com",
    "telefone": "83977777777",
    "data_nascimento": "2001-08-20",
    "habilitado_financeiro": True,
    "ativo": True,
}


async def criar_jovem(client):
    r = await client.post("/api/v1/jovens/", json=JOVEM_PAYLOAD)
    return r.json()["id"]


async def test_listar_notificacoes_vazia(client: AsyncClient):
    response = await client.get("/api/v1/notificacoes/")
    assert response.status_code == 200
    assert response.json() == []


async def test_count_nao_lidas_zero(client: AsyncClient):
    response = await client.get("/api/v1/notificacoes/count-nao-lidas")
    assert response.status_code == 200
    assert response.json()["count"] == 0


async def test_criar_e_listar_notificacao(client: AsyncClient, db_session: AsyncSession):
    jid = await criar_jovem(client)
    service = NotificacaoService(db_session)
    notif = await service.criar_notificacoes_aniversario()
    response = await client.get("/api/v1/notificacoes/")
    assert response.status_code == 200


async def test_marcar_lida(client: AsyncClient, db_session: AsyncSession):
    jid = await criar_jovem(client)
    service = NotificacaoService(db_session)
    data = NotificacaoCreate(jovem_id=jid, titulo="Teste", mensagem="Mensagem de teste")
    notif = await service.create(data)
    response = await client.patch(f"/api/v1/notificacoes/{notif.id}/marcar-lida")
    assert response.status_code == 200


async def test_marcar_lida_nao_encontrada(client: AsyncClient):
    response = await client.patch("/api/v1/notificacoes/9999/marcar-lida")
    assert response.status_code == 404


async def test_marcar_todas_lidas(client: AsyncClient, db_session: AsyncSession):
    jid = await criar_jovem(client)
    service = NotificacaoService(db_session)
    await service.create(NotificacaoCreate(jovem_id=jid, titulo="T1", mensagem="M1"))
    await service.create(NotificacaoCreate(jovem_id=jid, titulo="T2", mensagem="M2"))
    response = await client.patch("/api/v1/notificacoes/marcar-todas-lidas")
    assert response.status_code == 200


async def test_listar_apenas_nao_lidas(client: AsyncClient, db_session: AsyncSession):
    jid = await criar_jovem(client)
    service = NotificacaoService(db_session)
    await service.create(NotificacaoCreate(jovem_id=jid, titulo="T1", mensagem="M1"))
    response = await client.get("/api/v1/notificacoes/?apenas_nao_lidas=true")
    assert response.status_code == 200


async def test_count_nao_lidas_com_notificacao(client: AsyncClient, db_session: AsyncSession):
    jid = await criar_jovem(client)
    service = NotificacaoService(db_session)
    await service.create(NotificacaoCreate(jovem_id=jid, titulo="T1", mensagem="M1"))
    response = await client.get("/api/v1/notificacoes/count-nao-lidas")
    assert response.status_code == 200
    assert response.json()["count"] >= 1


async def test_criar_notificacoes_aniversario(client: AsyncClient):
    hoje = date.today()
    payload = {**JOVEM_PAYLOAD, "data_nascimento": str(hoje), "email": "aniv2@test.com"}
    await client.post("/api/v1/jovens/", json=payload)
    response = await client.get("/api/v1/notificacoes/")
    assert response.status_code == 200


async def test_whatsapp_service_envia_resumo_configurado(monkeypatch: pytest.MonkeyPatch):
    chamada = {}

    class FakeResponse:
        def raise_for_status(self):
            return None

    class FakeAsyncClient:
        def __init__(self, timeout: int):
            chamada["timeout"] = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, json, headers):
            chamada["url"] = url
            chamada["json"] = json
            chamada["headers"] = headers
            return FakeResponse()

    monkeypatch.setattr(settings, "WHATSAPP_ENABLED", True)
    monkeypatch.setattr(settings, "WHATSAPP_RECIPIENT_PHONE", "+55 (83) 99999-8888")
    monkeypatch.setattr(settings, "WHATSAPP_TIMEOUT_SECONDS", 7)
    monkeypatch.setattr(settings, "EVOLUTION_API_URL", "http://localhost:8080")
    monkeypatch.setattr(settings, "AUTHENTICATION_API_KEY", "local-api-key")
    monkeypatch.setattr(settings, "EVOLUTION_INSTANCE_NAME", "verbo-da-vida")
    monkeypatch.setattr("app.services.whatsapp_service.httpx.AsyncClient", FakeAsyncClient)

    service = WhatsAppService()
    notificacoes = [
        Notificacao(
            jovem_id=1,
            titulo="🎂 Aniversário de Pedro",
            mensagem="Pedro está fazendo 25 anos hoje!",
            lida=False,
        )
    ]

    enviado = await service.enviar_resumo_aniversarios(notificacoes)

    assert enviado is True
    assert chamada["timeout"] == 7
    assert chamada["url"] == "http://localhost:8080/message/sendText/verbo-da-vida"
    assert chamada["json"]["number"] == "5583999998888"
    assert "Pedro está fazendo 25 anos hoje!" in chamada["json"]["text"]
    assert chamada["headers"]["apikey"] == "local-api-key"


async def test_task_birthday(db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch):
    from app.tasks import birthday_task
    from app.services.jovem_service import JovemService
    from app.schemas.jovem import JovemCreate

    hoje = date.today()
    service = JovemService(db_session)
    await service.create(JovemCreate(nome="Aniv Task", data_nascimento=hoje, habilitado_financeiro=True, ativo=True))

    envio_mock = AsyncMock(return_value=True)

    class FakeSessionContext:
        async def __aenter__(self):
            return db_session

        async def __aexit__(self, exc_type, exc, tb):
            return False

    class FakeWhatsAppService:
        async def enviar_resumo_aniversarios(self, notificacoes):
            return await envio_mock(notificacoes)

    # Monkeypatch para substituir o async_sessionmaker dentro da função
    original_create_async_engine = birthday_task.create_async_engine
    original_async_sessionmaker = birthday_task.async_sessionmaker
    monkeypatch.setattr(birthday_task, "create_async_engine", lambda *a, **kw: None)
    monkeypatch.setattr(birthday_task, "async_sessionmaker", lambda *a, **kw: lambda: FakeSessionContext())
    monkeypatch.setattr(birthday_task, "WhatsAppService", FakeWhatsAppService)

    result = await birthday_task.verificar_aniversariantes()

    # Restaurar funções originais (boa prática, mas pytest faz isso automaticamente)
    birthday_task.create_async_engine = original_create_async_engine
    birthday_task.async_sessionmaker = original_async_sessionmaker

    assert isinstance(result, list)
    envio_mock.assert_awaited_once()
