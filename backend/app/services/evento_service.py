from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, extract
from datetime import date
from typing import Optional, List
from app.models.evento import Evento
from app.schemas.evento import EventoCreate, EventoUpdate


class EventoService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, skip: int = 0, limit: int = 100, ano: int | None = None) -> List[Evento]:
        if not ano:
            ano = date.today().year
        query = select(Evento).where(extract("year", Evento.data_evento) == ano).order_by(Evento.data_evento.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_by_id(self, evento_id: int) -> Optional[Evento]:
        result = await self.db.execute(select(Evento).where(Evento.id == evento_id))
        return result.scalar_one_or_none()

    async def create(self, data: EventoCreate) -> Evento:
        evento = Evento(**data.model_dump())
        self.db.add(evento)
        await self.db.commit()
        await self.db.refresh(evento)
        return evento

    async def update(self, evento_id: int, data: EventoUpdate) -> Optional[Evento]:
        evento = await self.get_by_id(evento_id)
        if not evento:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(evento, field, value)
        await self.db.commit()
        await self.db.refresh(evento)
        return evento

    async def delete(self, evento_id: int) -> bool:
        evento = await self.get_by_id(evento_id)
        if not evento:
            return False
        await self.db.delete(evento)
        await self.db.commit()
        return True
