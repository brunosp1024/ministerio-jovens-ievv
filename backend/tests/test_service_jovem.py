import pytest
from app.services.jovem_service import JovemService
from app.models.jovem import Jovem
from app.schemas.jovem import JovemCreate, JovemUpdate
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

@pytest.mark.asyncio
async def test_jovem_service_crud(db_session: AsyncSession):
    service = JovemService(db_session)
    # Create
    data = JovemCreate(
        nome="Teste",
        email="teste@exemplo.com",
        telefone="123456789",
        data_nascimento=date(2000, 1, 1),
        endereco="Rua X",
        habilitado_financeiro=True,
        ativo=True,
    )
    jovem = await service.create(data)
    assert jovem.id is not None
    # Get by id
    found = await service.get_by_id(jovem.id)
    assert found is not None
    # Get all
    all_jovens = await service.get_all()
    assert any(j.id == jovem.id for j in all_jovens)
    # Update
    upd = JovemUpdate(nome="Novo nome")
    updated = await service.update(jovem.id, upd)
    assert updated.nome == "Novo nome"
    # Delete
    deleted = await service.delete(jovem.id)
    assert deleted is True
    not_found = await service.get_by_id(jovem.id)
    assert not_found is None
    # Update not found
    assert await service.update(9999, upd) is None
    # Delete not found
    assert await service.delete(9999) is False
