import pytest
from httpx import AsyncClient
from datetime import date


pytestmark = pytest.mark.asyncio

JOVEM_PAYLOAD = {
    "nome": "João Silva",
    "email": "joao@teste.com",
    "telefone": "83999999999",
    "data_nascimento": str(date.today().replace(month=date.today().month, day=date.today().day)),
    "endereco": "Rua A, 123",
    "habilitado_financeiro": True,
    "ativo": True,
}


async def test_criar_jovem(client: AsyncClient):
    response = await client.post("/api/v1/jovens/", json=JOVEM_PAYLOAD)
    assert response.status_code == 201
    data = response.json()
    assert data["nome"] == JOVEM_PAYLOAD["nome"]
    assert data["email"] == JOVEM_PAYLOAD["email"]
    assert "id" in data


async def test_listar_jovens(client: AsyncClient):
    await client.post("/api/v1/jovens/", json=JOVEM_PAYLOAD)
    response = await client.get("/api/v1/jovens/")
    assert response.status_code == 200
    assert len(response.json()) >= 1


async def test_listar_jovens_filtro_ativo(client: AsyncClient):
    await client.post("/api/v1/jovens/", json=JOVEM_PAYLOAD)
    response = await client.get("/api/v1/jovens/?ativo=true")
    assert response.status_code == 200


async def test_buscar_jovem(client: AsyncClient):
    create = await client.post("/api/v1/jovens/", json=JOVEM_PAYLOAD)
    jovem_id = create.json()["id"]
    response = await client.get(f"/api/v1/jovens/{jovem_id}")
    assert response.status_code == 200
    assert response.json()["id"] == jovem_id


async def test_buscar_jovem_nao_encontrado(client: AsyncClient):
    response = await client.get("/api/v1/jovens/9999")
    assert response.status_code == 404


async def test_atualizar_jovem(client: AsyncClient):
    create = await client.post("/api/v1/jovens/", json=JOVEM_PAYLOAD)
    jovem_id = create.json()["id"]
    response = await client.put(f"/api/v1/jovens/{jovem_id}", json={"nome": "João Atualizado"})
    assert response.status_code == 200
    assert response.json()["nome"] == "João Atualizado"


async def test_atualizar_jovem_nao_encontrado(client: AsyncClient):
    response = await client.put("/api/v1/jovens/9999", json={"nome": "Inexistente"})
    assert response.status_code == 404


async def test_deletar_jovem(client: AsyncClient):
    create = await client.post("/api/v1/jovens/", json=JOVEM_PAYLOAD)
    jovem_id = create.json()["id"]
    response = await client.delete(f"/api/v1/jovens/{jovem_id}")
    assert response.status_code == 204


async def test_deletar_jovem_nao_encontrado(client: AsyncClient):
    response = await client.delete("/api/v1/jovens/9999")
    assert response.status_code == 404


async def test_listar_habilitados_financeiro(client: AsyncClient):
    await client.post("/api/v1/jovens/", json=JOVEM_PAYLOAD)
    response = await client.get("/api/v1/jovens/habilitados-financeiro")
    assert response.status_code == 200
    assert all(j["habilitado_financeiro"] for j in response.json())


async def test_aniversariantes_hoje(client: AsyncClient):
    hoje = date.today()
    payload = {**JOVEM_PAYLOAD, "data_nascimento": str(hoje), "email": "aniv@teste.com"}
    await client.post("/api/v1/jovens/", json=payload)
    response = await client.get("/api/v1/jovens/aniversariantes-hoje")
    assert response.status_code == 200
    assert len(response.json()) >= 1
