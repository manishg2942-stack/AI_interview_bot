from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=254)
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=254)
    password: str


class GoogleAuthRequest(BaseModel):
    id_token: str = Field(..., min_length=20)


class UserProfileUpdate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    picture_url: str | None = None
    auth_provider: str = "password"


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
