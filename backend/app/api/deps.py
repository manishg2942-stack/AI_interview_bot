from fastapi import Depends, Header, HTTPException, status
from pymongo.database import Database

from app.core.security import decode_access_token
from app.db.session import get_db
from app.services.user_service import get_user_by_id


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Database = Depends(get_db),
) -> dict[str, object]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token is required",
        )

    token = authorization.split(" ", 1)[1].strip()
    payload = decode_access_token(token)
    user_id = str(payload.get("sub", ""))
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User no longer exists",
        )
    return user
