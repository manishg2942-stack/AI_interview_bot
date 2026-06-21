from datetime import datetime

from pydantic import BaseModel, Field


class QuestionAttemptCreate(BaseModel):
    student_id: str = Field(..., min_length=1)
    interview_id: str = Field(..., min_length=1)
    question_id: str = Field(..., min_length=1)
    language: str = Field(..., min_length=1, max_length=50)
    code: str = Field(..., min_length=1)
    passed: int = Field(default=0, ge=0)
    hidden_passed: int = Field(default=0, ge=0)
    runtime: int | None = Field(default=None, ge=0, description="Runtime in milliseconds")
    memory: int | None = Field(default=None, ge=0, description="Memory in KB")
    time_taken: int = Field(default=0, ge=0, description="Time taken in seconds")


class QuestionAttemptPublic(QuestionAttemptCreate):
    id: str
    created_at: datetime
