
import pytest
from app.services.financeiro_service import FinanceiroService
from app.schemas.financeiro import VendaSemanalCreate, VendaSemanalUpdate, ItemVendaCreate
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

@pytest.mark.asyncio
async def test_financeiro_service_venda_crud(db_session: AsyncSession):
    service = FinanceiroService(db_session)
    # Create venda
    venda_data = VendaSemanalCreate(
        semana_inicio=date(2025, 6, 2),
        semana_fim=date(2025, 6, 8),
        total_investido="50.00",
        total_arrecadado="120.00",
        itens=[ItemVendaCreate(produto="Hamburguer", quantidade=20, preco_unitario="6.00", total="120.00")],
    )
    venda = await service.create_venda(venda_data)
    assert venda.id is not None
    # Get by id
    found = await service.get_venda_by_id(venda.id)
    assert found is not None
    # Get all
    all_vendas = await service.get_vendas()
    assert any(v.id == venda.id for v in all_vendas)
    # Update (não atualiza itens, apenas campos simples)
    upd = VendaSemanalUpdate(
        total_investido="60.00",
        total_arrecadado="130.00",
        observacoes="Teste update"
    )
    updated = await service.update_venda(venda.id, upd)
    assert str(updated.total_investido) == "60.00"
    # Delete
    deleted = await service.delete_venda(venda.id)
    assert deleted is True
    not_found = await service.get_venda_by_id(venda.id)
    assert not_found is None
    # Update not found
    assert await service.update_venda(9999, upd) is None
    # Delete not found
    assert await service.delete_venda(9999) is False
