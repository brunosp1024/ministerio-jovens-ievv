from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthUserResponse(BaseModel):
    username: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse