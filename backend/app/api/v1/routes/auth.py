from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.api.deps import get_current_user
from app.core.security import create_access_token
from app.db.session import get_db
from app.schemas.auth import (
    AuthResponse,
    GoogleAuthRequest,
    UserCreate,
    UserLogin,
    UserProfileUpdate,
    UserPublic,
)
from app.services.user_service import (
    authenticate_google_user,
    authenticate_user,
    create_user,
    update_user_profile,
)


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


@router.post("/google", response_model=AuthResponse)
async def google_login(payload: GoogleAuthRequest, db: Database = Depends(get_db)) -> AuthResponse:
    user = await authenticate_google_user(db, payload.id_token)
    return AuthResponse(
        access_token=create_access_token(user["id"]),
        user=user,
    )


@router.get("/me", response_model=UserPublic)
def get_my_profile(current_user: dict[str, object] = Depends(get_current_user)) -> dict[str, object]:
    return current_user


@router.patch("/me", response_model=UserPublic)
def update_my_profile(
    payload: UserProfileUpdate,
    current_user: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> dict[str, object]:
    return update_user_profile(
        db,
        user_id=str(current_user["id"]),
        payload=payload,
    )
