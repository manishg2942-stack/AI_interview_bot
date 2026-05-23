from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.core.security import create_access_token
from app.db.session import get_db
from app.schemas.auth import AuthResponse, UserCreate, UserLogin
from app.services.user_service import authenticate_user, create_user


router = APIRouter()


@router.post("/signup", response_model=AuthResponse, status_code=201)
def signup(payload: UserCreate, db: Database = Depends(get_db)) -> AuthResponse:
    user = create_user(db, payload)
    return AuthResponse(
        access_token=create_access_token(user["id"]),
        user=user,
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Database = Depends(get_db)) -> AuthResponse:
    user = authenticate_user(db, payload)
    return AuthResponse(
        access_token=create_access_token(user["id"]),
        user=user,
    )
