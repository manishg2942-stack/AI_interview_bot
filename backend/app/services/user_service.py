from datetime import UTC, datetime

from fastapi import HTTPException, status
from pymongo import ReturnDocument
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError
from bson import ObjectId
from bson.errors import InvalidId

from app.core.security import hash_password, verify_password
from app.schemas.auth import UserCreate, UserLogin, UserProfileUpdate
from app.services.google_auth_service import google_auth_service


def _document_to_public_user(document: dict[str, object]) -> dict[str, object]:
    return {
        "id": str(document["_id"]),
        "name": document["name"],
        "email": document["email"],
        "picture_url": document.get("picture_url"),
        "auth_provider": document.get("auth_provider", "password"),
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
                "auth_provider": "password",
                "google_id": None,
                "picture_url": None,
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
    password_hash = user.get("password_hash") if user else None
    if user is None or not password_hash or not verify_password(payload.password, str(password_hash)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return _document_to_public_user(user)


async def authenticate_google_user(db: Database, id_token: str) -> dict[str, object]:
    profile = await google_auth_service.verify_id_token(id_token)
    now = datetime.now(UTC)

    existing_user = get_user_by_email(db, profile["email"])
    if existing_user:
        document = db.users.find_one_and_update(
            {"email": profile["email"], "is_active": True},
            {
                "$set": {
                    "google_id": profile["google_id"],
                    "picture_url": profile["picture_url"] or existing_user.get("picture_url"),
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            return_document=ReturnDocument.AFTER,
        )
        return _document_to_public_user(document)

    try:
        result = db.users.insert_one(
            {
                "name": profile["name"],
                "email": profile["email"],
                "password_hash": None,
                "auth_provider": "google",
                "google_id": profile["google_id"],
                "picture_url": profile["picture_url"] or None,
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }
        )
    except DuplicateKeyError:
        user = get_user_by_email(db, profile["email"])
        if user is None:
            raise HTTPException(status_code=500, detail="Could not sign in with Google") from None
        return _document_to_public_user(user)

    user = get_user_by_id(db, str(result.inserted_id))
    if user is None:
        raise HTTPException(status_code=500, detail="Could not create Google user")
    return user


def update_user_profile(
    db: Database,
    *,
    user_id: str,
    payload: UserProfileUpdate,
) -> dict[str, object]:
    try:
        object_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found") from None

    document = db.users.find_one_and_update(
        {"_id": object_id, "is_active": True},
        {
            "$set": {
                "name": payload.name.strip(),
                "updated_at": datetime.now(UTC),
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _document_to_public_user(document)
