from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_username
from app.core.security import create_access_token, verify_credentials
from app.schemas.auth import AuthUserResponse, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["autenticação"])


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    if not verify_credentials(data.username, data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos",
        )

    return TokenResponse(
        access_token=create_access_token(data.username),
        user=AuthUserResponse(username=data.username),
    )


@router.get("/me", response_model=AuthUserResponse)
async def me(username: str = Depends(get_current_username)):
    return AuthUserResponse(username=username)