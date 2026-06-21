from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.dsa_question import DsaQuestionPublic


class InterviewSetup(BaseModel):
    type: str = Field(..., min_length=1, max_length=50)
    company: str = Field(..., min_length=1, max_length=100)
    level: str = Field(..., min_length=1, max_length=50)
    difficulty: str = Field(..., min_length=1, max_length=50)
    design_question: str | None = Field(default=None, max_length=200)
    resume_text: str | None = Field(default=None, max_length=8000)


class TokenRequest(BaseModel):
    room: str = Field(..., min_length=1, max_length=100)
    identity: str | None = Field(default=None, max_length=120)
    name: str | None = Field(default=None, max_length=100)
    interview: InterviewSetup


class TokenResponse(BaseModel):
    url: str | None
    token: str
    room: str
    identity: str
    session_id: str
    selected_question: DsaQuestionPublic | None = None


class LiveKitTranscriptMessage(BaseModel):
    role: Literal["user", "assistant", "student", "interviewer", "system"]
    text: str = Field(..., min_length=1, max_length=5000)
    timestamp: datetime | None = None


class CompleteLiveKitSessionRequest(BaseModel):
    duration: int = Field(default=0, ge=0, description="Duration in seconds")
    transcript_messages: list[LiveKitTranscriptMessage] = Field(default_factory=list, max_length=300)


class LiveKitSessionPublic(BaseModel):
    id: str
    room: str
    interview_type: str
    company: str = ""
    level: str = ""
    difficulty: str = ""
    design_question: str | None = None
    selected_question_id: str | None = None
    overall_score: int | None = None
    status: str
    feedback_status: str = "pending"
    feedback_id: str | None = None
    feedback_error: str | None = None
    duration: int = 0
    started_at: datetime | None = None
    ended_at: datetime | None = None
    created_at: datetime | None = None
