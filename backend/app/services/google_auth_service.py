from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import settings


class GoogleAuthService:
    """Verifies Google ID tokens and returns trusted profile claims."""

    async def verify_id_token(self, id_token: str) -> dict[str, str]:
        if not settings.google_client_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="GOOGLE_CLIENT_ID is not configured",
            )

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://oauth2.googleapis.com/tokeninfo",
                    params={"id_token": id_token},
                )
        except httpx.HTTPError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Could not verify Google token right now",
            ) from None

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token",
            )

        claims = response.json()
        self._validate_claims(claims)
        return {
            "google_id": str(claims["sub"]),
            "email": str(claims["email"]).lower(),
            "name": str(claims.get("name") or claims["email"]).strip(),
            "picture_url": str(claims.get("picture") or "").strip(),
        }

    def _validate_claims(self, claims: dict[str, Any]) -> None:
        if claims.get("aud") != settings.google_client_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google token audience does not match this app",
            )

        if claims.get("email_verified") not in ("true", True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google email is not verified",
            )

        if not claims.get("sub") or not claims.get("email"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google token is missing required profile information",
            )


google_auth_service = GoogleAuthService()
