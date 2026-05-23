from datetime import UTC, datetime

from fastapi import HTTPException, status
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from bson.errors import InvalidId

from app.core.security import hash_password, verify_password
from app.schemas.auth import UserCreate, UserLogin


def _document_to_public_user(document: dict[str, object]) -> dict[str, object]:
    return {
        "id": str(document["_id"]),
        "name": document["name"],
        "email": document["email"],
    }


def get_user_by_id(db: Database, user_id: str) -> dict[str, object] | None:
    try:
        object_id = ObjectId(user_id)
    except InvalidId:
        return None

    document = db.users.find_one({"_id": object_id, "is_active": True})
    return _document_to_public_user(document) if document else None


def get_user_by_email(db: Database, email: str) -> dict[str, object] | None:
    return db.users.find_one({"email": email.lower(), "is_active": True})


def create_user(db: Database, payload: UserCreate) -> dict[str, object]:
    if get_user_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    now = datetime.now(UTC)
    try:
        result = db.users.insert_one(
            {
                "name": payload.name.strip(),
                "email": payload.email.lower(),
                "password_hash": hash_password(payload.password),
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
        )
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        ) from None

    user = get_user_by_id(db, str(result.inserted_id))
    if user is None:
        raise HTTPException(status_code=500, detail="Could not create user")
    return user


def authenticate_user(db: Database, payload: UserLogin) -> dict[str, object]:
    user = get_user_by_email(db, payload.email)
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return _document_to_public_user(user)
