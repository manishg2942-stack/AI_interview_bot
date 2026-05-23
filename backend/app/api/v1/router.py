from fastapi import APIRouter

from app.api.v1.routes import auth, dsa_questions, livekit


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dsa_questions.router, prefix="/dsa-questions", tags=["dsa-questions"])
api_router.include_router(livekit.router, prefix="/livekit", tags=["livekit"])
