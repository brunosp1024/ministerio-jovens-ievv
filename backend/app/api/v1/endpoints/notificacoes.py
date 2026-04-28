from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.api.deps import get_current_user, get_db
from app.services.notificacao_service import NotificacaoService
from app.schemas.notificacao import NotificacaoResponse


router = APIRouter(prefix="/notificacoes", tags=["notificações"])

def _forbid_viewer(user):
    if user["role"] == "viewer":
        raise HTTPException(status_code=403, detail="Usuário sem permissão para esta ação")

@router.get("/", response_model=List[NotificacaoResponse])
async def listar_notificacoes(
    apenas_nao_lidas: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    service = NotificacaoService(db)
    notificacoes = await service.get_all(apenas_nao_lidas=apenas_nao_lidas)
    result = []
    for n in notificacoes:
        item = NotificacaoResponse(
            id=n.id,
            jovem_id=n.jovem_id,
            jovem_nome=n.jovem.nome if n.jovem else None,
            titulo=n.titulo,
            mensagem=n.mensagem,
            lida=n.lida,
            created_at=n.created_at,
        )
        result.append(item)
    return result

@router.get("/count-nao-lidas")
async def count_nao_lidas(db: AsyncSession = Depends(get_db)):
    service = NotificacaoService(db)
    count = await service.get_nao_lidas_count()
    return {"count": count}

@router.patch("/{notificacao_id}/marcar-lida")
async def marcar_lida(
    notificacao_id: int,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    _forbid_viewer(user)
    service = NotificacaoService(db)
    ok = await service.marcar_lida(notificacao_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    return {"message": "Notificação marcada como lida"}

@router.patch("/marcar-todas-lidas")
async def marcar_todas_lidas(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    _forbid_viewer(user)
    service = NotificacaoService(db)
    count = await service.marcar_todas_lidas()
    return {"message": f"{count} notificação(ões) marcada(s) como lida(s)"}
