from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.core.security import create_access_token, verify_credentials
from app.schemas.auth import AuthUserResponse, LoginRequest, TokenResponse


router = APIRouter(prefix="/auth", tags=["autenticação"])

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    role = verify_credentials(data.username, data.password)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos",
        )
    return TokenResponse(
        access_token=create_access_token(data.username),
        user=AuthUserResponse(username=data.username, role=role),
    )

@router.get("/me", response_model=AuthUserResponse)
async def me(user: dict = Depends(get_current_user)):
    return AuthUserResponse(username=user["username"], role=user["role"])