from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.api.deps import get_current_user, get_db
from app.services.jovem_service import JovemService
from app.schemas.jovem import JovemCreate, JovemUpdate, JovemResponse

router = APIRouter(prefix="/jovens", tags=["jovens"])


@router.get("/", response_model=List[JovemResponse])
async def listar_jovens(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    ativo: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    service = JovemService(db)
    return await service.get_all(skip=skip, limit=limit, ativo=ativo)


@router.get("/habilitados-financeiro", response_model=List[JovemResponse])
async def listar_habilitados_financeiro(db: AsyncSession = Depends(get_db)):
    service = JovemService(db)
    return await service.get_habilitados_financeiro()


@router.get("/aniversariantes-hoje", response_model=List[JovemResponse])
async def aniversariantes_hoje(db: AsyncSession = Depends(get_db)):
    service = JovemService(db)
    return await service.get_aniversariantes_hoje()


@router.get("/{jovem_id}", response_model=JovemResponse)
async def buscar_jovem(jovem_id: int, db: AsyncSession = Depends(get_db)):
    service = JovemService(db)
    jovem = await service.get_by_id(jovem_id)
    if not jovem:
        raise HTTPException(status_code=404, detail="Jovem não encontrado")
    return jovem


@router.post("/", response_model=JovemResponse, status_code=201)
async def criar_jovem(
    data: JovemCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if user["role"] == "viewer":
        raise HTTPException(status_code=403, detail="Usuário sem permissão para criar")
    service = JovemService(db)
    return await service.create(data)


@router.put("/{jovem_id}", response_model=JovemResponse)
async def atualizar_jovem(
    jovem_id: int,
    data: JovemUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if user["role"] == "viewer":
        raise HTTPException(status_code=403, detail="Usuário sem permissão para editar")
    service = JovemService(db)
    jovem = await service.update(jovem_id, data)
    if not jovem:
        raise HTTPException(status_code=404, detail="Jovem não encontrado")
    return jovem


@router.delete("/{jovem_id}", status_code=204)
async def deletar_jovem(
    jovem_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if user["role"] == "viewer":
        raise HTTPException(status_code=403, detail="Usuário sem permissão para deletar")
    service = JovemService(db)
    deleted = await service.delete(jovem_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Jovem não encontrado")
