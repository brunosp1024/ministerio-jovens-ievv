import pytest
import sqlalchemy
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool
from app.main import app
from app.api.deps import get_db
from app.core.config import settings
from app.core.security import create_access_token
from app.db.session import Base
from app.models.jovem import Jovem
from datetime import date

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine_test = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
AsyncTestSessionLocal = async_sessionmaker(engine_test, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with AsyncTestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_db():
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def public_client():

    # Cria usuário admin se não existir
    async with AsyncTestSessionLocal() as session:
        result = await session.execute(sqlalchemy.select(Jovem).where(Jovem.nome == "admin"))
        admin = result.scalar_one_or_none()
        if not admin:
            admin = Jovem(
                nome="admin",
                perfil="lideranca",
                telefone="0000000000",
                data_nascimento=date(1990, 1, 1),
                habilitado_financeiro=True,
                ativo=True,
            )
            session.add(admin)
            await session.commit()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def client(public_client: AsyncClient):
    public_client.headers.update(
        {"Authorization": f"Bearer {create_access_token(settings.ADMIN_USERNAME)}"}
    )
    yield public_client


@pytest_asyncio.fixture
async def db_session():
    async with AsyncTestSessionLocal() as session:
        yield session
