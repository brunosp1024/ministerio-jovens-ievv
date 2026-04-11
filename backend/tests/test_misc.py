import pytest
from app.db import base, session
from app.core import config, scheduler, security
from app.api import deps

# Testa importação de base e models
# (apenas garantir que não lança erro)
def test_import_base():
    from app.db import base as _base
    assert hasattr(_base, "Base")

def test_base_class_is_declarative():
    assert hasattr(session.Base, "metadata")

# Testa parse_allowed_origins
@pytest.mark.parametrize("value,expected", [
    (None, []),
    ("", []),
    ([], []),
    ("http://a.com", ["http://a.com"]),
    ("[\"http://a.com\", \"http://b.com\"]", ["http://a.com", "http://b.com"]),
    (["http://a.com", "http://b.com"], ["http://a.com", "http://b.com"]),
    ("http://a.com, http://b.com", ["http://a.com", "http://b.com"]),
])
def test_parse_allowed_origins(value, expected):
    assert config.Settings.parse_allowed_origins(value) == expected

# Testa decode_access_token para token inválido
@pytest.mark.parametrize("token", [
    "invalid.token",
    "",
    "a.b.c",
])
def test_decode_access_token_invalid(token):
    assert security.decode_access_token(token) is None


# Testa get_db generator (apenas cobertura de yield/close)
import asyncio
@pytest.mark.asyncio
async def test_get_db_generator():
    gen = session.get_db()
    s = await gen.__anext__()
    assert s is not None
    try:
        await gen.__anext__()
    except StopAsyncIteration:
        pass

# Testa exceções de get_current_username
import types
import fastapi
@pytest.mark.asyncio
async def test_get_current_username_exceptions():
    # Sem credenciais
    with pytest.raises(fastapi.HTTPException):
        await deps.get_current_username(None)
    # Token inválido
    class Dummy:
        scheme = "bearer"
        credentials = "invalid.token"
    with pytest.raises(fastapi.HTTPException):
        await deps.get_current_username(Dummy())
