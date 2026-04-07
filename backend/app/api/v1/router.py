from fastapi import APIRouter
from app.api.v1.endpoints import auth, jovens, eventos, financeiro, notificacoes

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(jovens.router)
api_router.include_router(eventos.router)
api_router.include_router(financeiro.router)
api_router.include_router(notificacoes.router)
