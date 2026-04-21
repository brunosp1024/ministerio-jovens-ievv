from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import date
from app.api.deps import get_current_username, get_db
from app.services.financeiro_service import FinanceiroService
from app.schemas.financeiro import (
    VendaSemanalCreate, VendaSemanalUpdate, VendaSemanalResponse,
    DistribuirGanhosRequest, GanhoMensalJovem, GanhoManualRequest,
    ResumoFinanceiro, ResumoCaixa as ResumoCaixaResponse,
)
from app.models.financeiro import ResumoCaixa

router = APIRouter(prefix="/financeiro", tags=["financeiro"])


@router.get("/resumo", response_model=ResumoFinanceiro)
async def resumo_financeiro(db: AsyncSession = Depends(get_db)):
    service = FinanceiroService(db)
    return await service.get_resumo()


@router.get("/resumo-caixa", response_model=ResumoCaixaResponse)
async def resumo_caixa(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ResumoCaixa).limit(1))
    resumo = result.scalar_one_or_none()
    if not resumo:
        raise HTTPException(status_code=404, detail="Resumo do caixa não encontrado")
    return resumo


@router.patch("/resumo-caixa", response_model=ResumoCaixaResponse)
async def atualizar_resumo_caixa(
    data: ResumoCaixaResponse,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_username),
):
    service = FinanceiroService(db)
    return await service.atualizar_resumo_caixa_manual(data)


@router.get("/vendas", response_model=List[VendaSemanalResponse])
async def listar_vendas(
    semana_inicio: Optional[date] = None,
    semana_fim: Optional[date] = None,
    mes: Optional[int] = Query(None, ge=1, le=12),
    ano: Optional[int] = Query(None, ge=2000),
    evento_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceiroService(db)
    return await service.get_vendas(
        semana_inicio=semana_inicio,
        semana_fim=semana_fim,
        mes=mes,
        ano=ano,
        evento_id=evento_id,
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


@router.post("/ganho-manual", status_code=201)
async def adicionar_ganho_manual(
    data: GanhoManualRequest,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_username),
):
    service = FinanceiroService(db)
    ganho = await service.adicionar_ganho_manual(data.jovem_id, data.valor)
    return {"message": "Ganho manual registrado.", "id": ganho.id}


@router.get("/ganhos/mensais", response_model=List[GanhoMensalJovem])
async def ganhos_mensais(
    semana_inicio: Optional[date] = Query(None),
    semana_fim: Optional[date] = Query(None),
    evento_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    service = FinanceiroService(db)
    return await service.get_ganhos_mensais(
        semana_inicio=semana_inicio,
        semana_fim=semana_fim,
        evento_id=evento_id
    )


@router.get("/ganhos/venda/{venda_id}")
async def ganhos_por_venda(venda_id: int, db: AsyncSession = Depends(get_db)):
    service = FinanceiroService(db)
    return await service.get_ganhos_por_venda(venda_id)


@router.post("/zerar-ganhos")
async def zerar_ganhos_jovens(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_username),
):
    service = FinanceiroService(db)
    total = await service.zerar_ganhos_jovens()
    return {"message": f"{total} ganhos zerados."}
