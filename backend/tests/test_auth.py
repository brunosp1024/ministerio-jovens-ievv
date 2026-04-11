
import pytest
from httpx import AsyncClient
from app.core import config


@pytest.mark.asyncio
async def test_login_sucesso(public_client: AsyncClient):
    # Força os valores esperados no settings
    config.settings.ADMIN_USERNAME = "admin"
    config.settings.ADMIN_PASSWORD = "admin123"
    response = await public_client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["username"] == "admin"


async def test_login_invalido(public_client: AsyncClient):
    response = await public_client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "senha-errada"},
    )

    assert response.status_code == 401


async def test_leitura_publica_permitida(public_client: AsyncClient):
    response = await public_client.get("/api/v1/jovens/")

    assert response.status_code == 200


async def test_escrita_exige_autenticacao(public_client: AsyncClient):
    response = await public_client.post(
        "/api/v1/jovens/",
        json={
            "nome": "Visitante",
            "email": "visitante@example.com",
            "data_nascimento": "2000-01-01",
            "habilitado_financeiro": True,
            "ativo": True,
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Autenticação obrigatória"