from datetime import datetime

from pydantic import BaseModel, Field


class FeedbackScores(BaseModel):
    overall_score: int = Field(..., ge=0, le=100)
    coding_score: int | None = Field(default=None, ge=0, le=100)
    communication_score: int | None = Field(default=None, ge=0, le=100)
    confidence_score: int | None = Field(default=None, ge=0, le=100)
    problem_solving_score: int | None = Field(default=None, ge=0, le=100)
    leadership_score: int | None = Field(default=None, ge=0, le=100)
    system_design_score: int | None = Field(default=None, ge=0, le=100)
    behavioural_score: int | None = Field(default=None, ge=0, le=100)


class InterviewFeedbackCreate(FeedbackScores):
    interview_id: str = Field(..., min_length=1)
    student_id: str = Field(..., min_length=1)


class InterviewFeedbackPublic(FeedbackScores):
    id: str
    interview_id: str
    student_id: str
    user_id: str | None = None
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    ai_summary: str = ""
    created_at: datetime
