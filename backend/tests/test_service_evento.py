import pytest
import sqlalchemy
from app.services.evento_service import EventoService
from app.models.evento import Evento
from app.schemas.evento import EventoCreate, EventoUpdate
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

import asyncio

@pytest.mark.asyncio
async def test_evento_service_crud(db_session: AsyncSession):
    service = EventoService(db_session)
    # Create
    data = EventoCreate(
        nome="Teste",
        descricao="desc",
        data_evento=datetime(2025, 1, 1, 19, 0),
        local="Local",
        ativo=True,
    )
    evento = await service.create(data)
    assert evento.id is not None
    # Get by id
    found = await service.get_by_id(evento.id)
    assert found is not None
    # Get all
    all_eventos = await service.get_all()
    assert any(e.id == evento.id for e in all_eventos)
    # Update
    upd = EventoUpdate(nome="Novo nome")
    updated = await service.update(evento.id, upd)
    assert updated.nome == "Novo nome"
    # Delete
    deleted = await service.delete(evento.id)
    assert deleted is True
    not_found = await service.get_by_id(evento.id)
    assert not_found is None
    # Update not found
    assert await service.update(9999, upd) is None
    # Delete not found
    assert await service.delete(9999) is False
