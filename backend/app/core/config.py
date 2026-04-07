from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/verbo_da_vida"
    DATABASE_URL_SYNC: str = "postgresql://postgres:postgres@localhost:5432/verbo_da_vida"
    SECRET_KEY: str = "dev-secret-key"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 12
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    PROJECT_NAME: str = "Ministério de Jovens - Verbo da Vida"
    API_V1_STR: str = "/api/v1"
    WHATSAPP_ENABLED: bool = False
    WHATSAPP_RECIPIENT_PHONE: str = ""
    WHATSAPP_TIMEOUT_SECONDS: int = 10
    EVOLUTION_API_URL: str = "http://localhost:8080"
    EVOLUTION_API_KEY: str = ""
    EVOLUTION_INSTANCE_NAME: str = "ministerio-jovens-ievv"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()
