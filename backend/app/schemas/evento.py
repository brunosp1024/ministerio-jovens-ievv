from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EventoBase(BaseModel):
    nome: str
    descricao: Optional[str] = None
    data_evento: datetime
    local: Optional[str] = None
    ativo: bool = True


class EventoCreate(EventoBase):
    pass


class EventoUpdate(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None
    data_evento: Optional[datetime] = None
    local: Optional[str] = None
    ativo: Optional[bool] = None


class EventoResponse(EventoBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
