import pytest
from app.services.notificacao_service import NotificacaoService
from app.schemas.notificacao import NotificacaoCreate
from app.models.jovem import Jovem
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

@pytest.mark.asyncio
async def test_notificacao_service_crud(db_session: AsyncSession):
    # Cria jovem de teste
    jovem = Jovem(
        nome="Teste",
        email="notificacao@exemplo.com",
        telefone="123456789",
        data_nascimento=date(2000, 1, 1),
        habilitado_financeiro=True,
        ativo=True,
    )
    db_session.add(jovem)
    await db_session.commit()
    await db_session.refresh(jovem)
    service = NotificacaoService(db_session)
    # Create
    data = NotificacaoCreate(
        jovem_id=jovem.id,
        titulo="Teste",
        mensagem="Mensagem",
    )
    notificacao = await service.create(data)
    assert notificacao.id is not None
    # Buscar notificação criada via get_all
    all_notificacoes = await service.get_all()
    assert any(n.id == notificacao.id for n in all_notificacoes)
    # Get all
    all_notificacoes = await service.get_all()
    assert any(n.id == notificacao.id for n in all_notificacoes)
    # Marcar lida
    ok = await service.marcar_lida(notificacao.id)
    assert ok is True
    # Marcar lida not found
    assert await service.marcar_lida(9999) is False
    # Não há método delete, então apenas cobre o fluxo de marcação de lida e busca
