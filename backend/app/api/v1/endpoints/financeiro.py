from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import date
from app.api.deps import get_current_username, get_db
from app.services.financeiro_service import FinanceiroService
from app.schemas.financeiro import (
    VendaSemanalCreate, VendaSemanalUpdate, VendaSemanalResponse,
    DistribuirGanhosRequest, GanhoJovemResponse, GanhoMensalJovem,
    ResumoFinanceiro,
)

router = APIRouter(prefix="/financeiro", tags=["financeiro"])


@router.get("/resumo", response_model=ResumoFinanceiro)
async def resumo_financeiro(db: AsyncSession = Depends(get_db)):
    service = FinanceiroService(db)
    return await service.get_resumo()


@router.get("/vendas", response_model=List[VendaSemanalResponse])
async def listar_vendas(
    semana_inicio: Optional[date] = None,
    semana_fim: Optional[date] = None,
    mes: Optional[int] = Query(None, ge=1, le=12),
    ano: Optional[int] = Query(None, ge=2000),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceiroService(db)
    return await service.get_vendas(
        semana_inicio=semana_inicio,
        semana_fim=semana_fim,
        mes=mes,
        ano=ano,
    )


@router.get("/vendas/{venda_id}", response_model=VendaSemanalResponse)
async def buscar_venda(venda_id: int, db: AsyncSession = Depends(get_db)):
    service = FinanceiroService(db)
    venda = await service.get_venda_by_id(venda_id)
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    return venda


@router.post("/vendas", response_model=VendaSemanalResponse, status_code=201)
async def criar_venda(
    data: VendaSemanalCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_username),
):
    service = FinanceiroService(db)
    return await service.create_venda(data)


@router.put("/vendas/{venda_id}", response_model=VendaSemanalResponse)
async def atualizar_venda(
    venda_id: int,
    data: VendaSemanalUpdate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_username),
):
    service = FinanceiroService(db)
    venda = await service.update_venda(venda_id, data)
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    return venda


@router.delete("/vendas/{venda_id}", status_code=204)
async def deletar_venda(
    venda_id: int,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_username),
):
    service = FinanceiroService(db)
    deleted = await service.delete_venda(venda_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Venda não encontrada")


@router.post("/distribuir-ganhos", status_code=201)
async def distribuir_ganhos(
    data: DistribuirGanhosRequest,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_username),
):
    service = FinanceiroService(db)
    ganhos = await service.distribuir_ganhos(data)
    return {"message": f"{len(ganhos)} distribuição(ões) registrada(s)", "total": len(ganhos)}


@router.get("/ganhos/mensais", response_model=List[GanhoMensalJovem])
async def ganhos_mensais(
    mes: int = Query(..., ge=1, le=12),
    ano: int = Query(..., ge=2000),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceiroService(db)
    return await service.get_ganhos_mensais(mes=mes, ano=ano)


@router.get("/ganhos/venda/{venda_id}")
async def ganhos_por_venda(venda_id: int, db: AsyncSession = Depends(get_db)):
    service = FinanceiroService(db)
    return await service.get_ganhos_por_venda(venda_id)
