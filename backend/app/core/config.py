import os
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_PATH = PROJECT_ROOT / "env" / ".env"

load_dotenv(ENV_PATH, override=True)


class Settings:
    app_name: str = "Aisha Interview Backend"
    mongodb_url: str
    mongodb_db: str
    frontend_origins: list[str]
    frontend_url: str
    auth_secret: str
    access_token_expire_minutes: int

    livekit_url: str | None
    livekit_api_key: str | None
    livekit_api_secret: str | None
    agent_name: str | None

    def __init__(self) -> None:
        self.mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        self.mongodb_db = os.getenv("MONGODB_DB", "aisha_interview")
        self.frontend_url = os.getenv("FRONTEND_URL", "https://ai-interview-bot-gold.vercel.app")

        self.frontend_origins = [
            origin.strip()
            for origin in os.getenv(
                "FRONTEND_ORIGINS",
                f"{self.frontend_url},http://localhost:5173,http://localhost:8000",
            ).split(",")
            if origin.strip()
        ]
        self.auth_secret = os.getenv("AUTH_SECRET") or os.getenv("LIVEKIT_API_SECRET") or "dev-only-change-me"
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

        self.livekit_url = os.getenv("LIVEKIT_URL")
        self.livekit_api_key = os.getenv("LIVEKIT_API_KEY")
        self.livekit_api_secret = os.getenv("LIVEKIT_API_SECRET")
        self.agent_name = os.getenv("AGENT_NAME")


settings = Settings()
