import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

JOVEM_PAYLOAD = {
    "nome": "Maria Test",
    "email": "maria@test.com",
    "telefone": "83988888888",
    "data_nascimento": "2000-03-15",
    "habilitado_financeiro": True,
    "ativo": True,
}


async def criar_jovem(client, email="maria@test.com"):
    r = await client.post("/api/v1/jovens/", json={**JOVEM_PAYLOAD, "email": email})
    return r.json()["id"]


async def criar_venda(client, semana_inicio="2025-06-02", semana_fim="2025-06-08"):
    payload = {
        "semana_inicio": semana_inicio,
        "semana_fim": semana_fim,
        "total_investido": "50.00",
        "total_arrecadado": "120.00",
        "valor_dinheiro": "70.00",
        "valor_pix": "50.00",
        "itens": [
            {"produto": "Hamburguer", "quantidade": 20, "preco_unitario": "6.00", "total": "120.00"}
        ],
    }
    r = await client.post("/api/v1/financeiro/vendas", json=payload)
    return r.json()


async def test_criar_venda(client: AsyncClient):
    r = await criar_venda(client)
    assert r["id"] is not None
    assert float(r["total_arrecadado"]) == 120.00
    assert float(r["lucro_liquido"]) == 70.00
    assert len(r["itens"]) == 1


async def test_listar_vendas(client: AsyncClient):
    from datetime import date
    ano_corrente = date.today().year
    await criar_venda(client, semana_inicio=f"{ano_corrente}-06-02", semana_fim=f"{ano_corrente}-06-08")
    # Testa sem filtro (deve trazer vendas do ano corrente)
    response = await client.get("/api/v1/financeiro/vendas")
    assert response.status_code == 200
    assert len(response.json()) >= 1
    # Testa filtro de ano diferente (não deve trazer vendas)
    response = await client.get(f"/api/v1/financeiro/vendas?ano={ano_corrente-1}")
    assert response.status_code == 200
    assert len(response.json()) == 0


async def test_listar_vendas_filtro_mes(client: AsyncClient):
    await criar_venda(client)
    response = await client.get("/api/v1/financeiro/vendas?mes=6&ano=2025")
    assert response.status_code == 200


async def test_listar_vendas_filtro_semana(client: AsyncClient):
    await criar_venda(client)
    response = await client.get("/api/v1/financeiro/vendas?semana_inicio=2025-06-01&semana_fim=2025-06-30")
    assert response.status_code == 200


async def test_buscar_venda(client: AsyncClient):
    venda = await criar_venda(client)
    response = await client.get(f"/api/v1/financeiro/vendas/{venda['id']}")
    assert response.status_code == 200


async def test_buscar_venda_nao_encontrada(client: AsyncClient):
    response = await client.get("/api/v1/financeiro/vendas/9999")
    assert response.status_code == 404


async def test_atualizar_venda(client: AsyncClient):
    venda = await criar_venda(client)
    response = await client.put(
        f"/api/v1/financeiro/vendas/{venda['id']}",
        json={"total_arrecadado": "150.00"},
    )
    assert response.status_code == 200
    assert float(response.json()["total_arrecadado"]) == 150.00


async def test_atualizar_venda_nao_encontrada(client: AsyncClient):
    response = await client.put("/api/v1/financeiro/vendas/9999", json={"total_arrecadado": "10.00"})
    assert response.status_code == 404


async def test_deletar_venda(client: AsyncClient):
    venda = await criar_venda(client)
    response = await client.delete(f"/api/v1/financeiro/vendas/{venda['id']}")
    assert response.status_code == 204


async def test_deletar_venda_nao_encontrada(client: AsyncClient):
    response = await client.delete("/api/v1/financeiro/vendas/9999")
    assert response.status_code == 404


async def test_distribuir_ganhos(client: AsyncClient):
    jid = await criar_jovem(client)
    venda = await criar_venda(client)
    payload = {
        "venda_id": venda["id"],
        "distribuicoes": [{"jovem_id": jid, "valor": "35.00"}],
    }
    response = await client.post("/api/v1/financeiro/distribuir-ganhos", json=payload)
    assert response.status_code == 201
    assert response.json()["total"] == 1


async def test_distribuir_ganhos_redistribuicao(client: AsyncClient):
    jid = await criar_jovem(client)
    venda = await criar_venda(client)
    payload = {"venda_id": venda["id"], "distribuicoes": [{"jovem_id": jid, "valor": "35.00"}]}
    await client.post("/api/v1/financeiro/distribuir-ganhos", json=payload)
    response = await client.post("/api/v1/financeiro/distribuir-ganhos", json=payload)
    assert response.status_code == 201


async def test_ganhos_mensais(client: AsyncClient):
    jid = await criar_jovem(client)
    venda = await criar_venda(client)
    payload = {"venda_id": venda["id"], "distribuicoes": [{"jovem_id": jid, "valor": "35.00"}]}
    await client.post("/api/v1/financeiro/distribuir-ganhos", json=payload)
    response = await client.get("/api/v1/financeiro/ganhos/mensais?mes=6&ano=2025")
    assert response.status_code == 200
    assert any(g["jovem_id"] == jid for g in response.json())


async def test_ganhos_por_venda(client: AsyncClient):
    jid = await criar_jovem(client)
    venda = await criar_venda(client)
    payload = {"venda_id": venda["id"], "distribuicoes": [{"jovem_id": jid, "valor": "35.00"}]}
    await client.post("/api/v1/financeiro/distribuir-ganhos", json=payload)
    response = await client.get(f"/api/v1/financeiro/ganhos/venda/{venda['id']}")
    assert response.status_code == 200
    assert len(response.json()) == 1


async def test_resumo_financeiro(client: AsyncClient):
    await criar_venda(client)
    response = await client.get("/api/v1/financeiro/resumo")
    assert response.status_code == 200
    data = response.json()
    assert float(data["total_arrecadado"]) == 120.00
    assert float(data["total_investido"]) == 50.00
    assert float(data["lucro_liquido"]) == 70.00
    assert float(data["total_dinheiro"]) == 70.00
    assert float(data["total_pix"]) == 50.00
