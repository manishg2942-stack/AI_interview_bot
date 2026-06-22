from fastapi import APIRouter

from app.api.v1.routes import (
    auth,
    dsa_questions,
    interview_feedback,
    interview_sessions,
    livekit,
    question_attempts,
    students,
    transcripts,
    webhooks,
)


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dsa_questions.router, prefix="/dsa-questions", tags=["dsa-questions"])
api_router.include_router(livekit.router, prefix="/livekit", tags=["livekit"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(
    interview_sessions.router,
    prefix="/interview-sessions",
    tags=["interview-sessions"],
)
api_router.include_router(transcripts.router, prefix="/transcripts", tags=["transcripts"])
api_router.include_router(
    interview_feedback.router,
    prefix="/interview-feedback",
    tags=["interview-feedback"],
)
api_router.include_router(
    question_attempts.router,
    prefix="/question-attempts",
    tags=["question-attempts"],
)
api_router.include_router(webhooks.router, tags=["webhooks"])
