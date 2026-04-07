from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.api.deps import get_current_username, get_db
from app.services.evento_service import EventoService
from app.schemas.evento import EventoCreate, EventoUpdate, EventoResponse

router = APIRouter(prefix="/eventos", tags=["eventos"])


@router.get("/", response_model=List[EventoResponse])
async def listar_eventos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    service = EventoService(db)
    return await service.get_all(skip=skip, limit=limit)


@router.get("/{evento_id}", response_model=EventoResponse)
async def buscar_evento(evento_id: int, db: AsyncSession = Depends(get_db)):
    service = EventoService(db)
    evento = await service.get_by_id(evento_id)
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return evento


@router.post("/", response_model=EventoResponse, status_code=201)
async def criar_evento(
    data: EventoCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_username),
):
    service = EventoService(db)
    return await service.create(data)


@router.put("/{evento_id}", response_model=EventoResponse)
async def atualizar_evento(
    evento_id: int,
    data: EventoUpdate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_username),
):
    service = EventoService(db)
    evento = await service.update(evento_id, data)
    if not evento:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    return evento


@router.delete("/{evento_id}", status_code=204)
async def deletar_evento(
    evento_id: int,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_username),
):
    service = EventoService(db)
    deleted = await service.delete(evento_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
