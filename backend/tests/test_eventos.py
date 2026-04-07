import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

EVENTO_PAYLOAD = {
    "nome": "Culto de Jovens",
    "descricao": "Culto especial",
    "data_evento": "2025-06-15T19:00:00",
    "local": "Igreja Sede",
    "ativo": True,
}


async def test_criar_evento(client: AsyncClient):
    response = await client.post("/api/v1/eventos/", json=EVENTO_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert data["nome"] == EVENTO_PAYLOAD["nome"]
    assert "id" in data


async def test_listar_eventos(client: AsyncClient):
    await client.post("/api/v1/eventos/", json=EVENTO_PAYLOAD)
    response = await client.get("/api/v1/eventos/")
    assert response.status_code == 200
    assert len(response.json()) >= 1


async def test_listar_eventos_paginacao(client: AsyncClient):
    for i in range(3):
        p = {**EVENTO_PAYLOAD, "nome": f"Evento {i}"}
        await client.post("/api/v1/eventos/", json=p)
    response = await client.get("/api/v1/eventos/?skip=0&limit=2")
    assert response.status_code == 200
    assert len(response.json()) <= 2


async def test_buscar_evento(client: AsyncClient):
    create = await client.post("/api/v1/eventos/", json=EVENTO_PAYLOAD)
    eid = create.json()["id"]
    response = await client.get(f"/api/v1/eventos/{eid}")
    assert response.status_code == 200
    assert response.json()["id"] == eid


async def test_buscar_evento_nao_encontrado(client: AsyncClient):
    response = await client.get("/api/v1/eventos/9999")
    assert response.status_code == 404


async def test_atualizar_evento(client: AsyncClient):
    create = await client.post("/api/v1/eventos/", json=EVENTO_PAYLOAD)
    eid = create.json()["id"]
    response = await client.put(f"/api/v1/eventos/{eid}", json={"nome": "Evento Atualizado"})
    assert response.status_code == 200
    assert response.json()["nome"] == "Evento Atualizado"


async def test_atualizar_evento_nao_encontrado(client: AsyncClient):
    response = await client.put("/api/v1/eventos/9999", json={"nome": "X"})
    assert response.status_code == 404


async def test_deletar_evento(client: AsyncClient):
    create = await client.post("/api/v1/eventos/", json=EVENTO_PAYLOAD)
    eid = create.json()["id"]
    response = await client.delete(f"/api/v1/eventos/{eid}")
    assert response.status_code == 204


async def test_deletar_evento_nao_encontrado(client: AsyncClient):
    response = await client.delete("/api/v1/eventos/9999")
    assert response.status_code == 404
