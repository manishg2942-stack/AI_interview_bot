from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import AppError, app_error_handler, validation_error_handler
from app.db.session import init_db


def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        version="1.0.0",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.frontend_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_exception_handler(AppError, app_error_handler)
    application.add_exception_handler(RequestValidationError, validation_error_handler)

    @application.on_event("startup")
    def on_startup() -> None:
        init_db()

    @application.get("/health")
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    application.include_router(api_router, prefix="/api")
    return application


app = create_app()
