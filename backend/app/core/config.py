import json
from pathlib import Path
from typing import List

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/verbo_da_vida"
    DATABASE_URL_SYNC: str = Field(
        default="postgresql://postgres:postgres@db:5432/verbo_da_vida",
        validation_alias=AliasChoices("DATABASE_URL_SYNC", "SQLALCHEMY_DATABASE_URI"),
    )
    SECRET_KEY: str = "dev-secret-key"
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 12
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: List[str] = Field(default_factory=list)
    PROJECT_NAME: str = "Ministério de Jovens - Verbo da Vida"
    API_V1_STR: str = "/api/v1"
    WHATSAPP_ENABLED: bool = False
    WHATSAPP_RECIPIENT_PHONE: str = ""
    WHATSAPP_TIMEOUT_SECONDS: int = 10
    EVOLUTION_API_URL: str = "http://localhost:8080"
    EVOLUTION_API_KEY: str = ""
    EVOLUTION_INSTANCE_NAME: str = "ministerio-jovens-ievv"

    class Config:
        env_file = PROJECT_ROOT / ".env"
        case_sensitive = True
        extra = "ignore"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value):
        if value in (None, "", []):
            return []
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            value = value.strip()
            if value.startswith("["):
                return json.loads(value)
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        raise TypeError("ALLOWED_ORIGINS deve ser uma lista ou string separada por vírgulas")


settings = Settings()
