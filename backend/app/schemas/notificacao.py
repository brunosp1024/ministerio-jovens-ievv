from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NotificacaoBase(BaseModel):
    titulo: str
    mensagem: str


class NotificacaoCreate(NotificacaoBase):
    jovem_id: int


class NotificacaoResponse(NotificacaoBase):
    id: int
    jovem_id: int
    jovem_nome: Optional[str] = None
    lida: bool
    created_at: datetime

    class Config:
        from_attributes = True
