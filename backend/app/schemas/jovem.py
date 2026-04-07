from pydantic import BaseModel, EmailStr, field_validator
from datetime import date, datetime
from typing import Optional


class JovemBase(BaseModel):
    nome: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    data_nascimento: date
    endereco: Optional[str] = None
    foto_url: Optional[str] = None
    habilitado_financeiro: bool = True
    ativo: bool = True

    @field_validator("email", "telefone", mode="before")
    @classmethod
    def empty_str_to_none(cls, v: object) -> object:
        if isinstance(v, str) and not v.strip():
            return None
        return v


class JovemCreate(JovemBase):
    pass


class JovemUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    data_nascimento: Optional[date] = None
    endereco: Optional[str] = None
    foto_url: Optional[str] = None
    habilitado_financeiro: Optional[bool] = None
    ativo: Optional[bool] = None

    @field_validator("email", "telefone", mode="before")
    @classmethod
    def empty_str_to_none(cls, v: object) -> object:
        if isinstance(v, str) and not v.strip():
            return None
        return v


class JovemResponse(JovemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JovemResumo(BaseModel):
    id: int
    nome: str
    data_nascimento: date
    habilitado_financeiro: bool

    class Config:
        from_attributes = True
