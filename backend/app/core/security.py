import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any

from fastapi import HTTPException, status

from app.core.config import settings


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 260_000)
    return f"pbkdf2_sha256${_b64encode(salt)}${_b64encode(digest)}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, salt_b64, digest_b64 = password_hash.split("$", 2)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    salt = _b64decode(salt_b64)
    expected = _b64decode(digest_b64)
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 260_000)
    return hmac.compare_digest(actual, expected)


def create_access_token(subject: str, expires_in_minutes: int | None = None) -> str:
    expires_in = expires_in_minutes or settings.access_token_expire_minutes
    payload = {
        "sub": subject,
        "exp": int(time.time()) + expires_in * 60,
        "iat": int(time.time()),
    }
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_b64 = _b64encode(payload_bytes)
    signature = hmac.new(
        settings.auth_secret.encode("utf-8"),
        payload_b64.encode("ascii"),
        hashlib.sha256,
    ).digest()
    return f"{payload_b64}.{_b64encode(signature)}"


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload_b64, signature_b64 = token.split(".", 1)
        expected_signature = hmac.new(
            settings.auth_secret.encode("utf-8"),
            payload_b64.encode("ascii"),
            hashlib.sha256,
        ).digest()
        provided_signature = _b64decode(signature_b64)
        if not hmac.compare_digest(expected_signature, provided_signature):
            raise ValueError("invalid signature")

        payload = json.loads(_b64decode(payload_b64))
    except (ValueError, json.JSONDecodeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
        ) from None

    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token has expired",
        )

    return payload
