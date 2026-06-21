from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


InterviewType = Literal["DSA", "HR", "LLD"]
InterviewStatus = Literal["scheduled", "in_progress", "completed", "cancelled"]
InterviewDifficulty = Literal["Easy", "Medium", "Hard"]


class InterviewSessionCreate(BaseModel):
    student_id: str = Field(..., min_length=1)
    type: InterviewType
    company: str = Field(..., min_length=1, max_length=100)
    difficulty: InterviewDifficulty
    duration: int = Field(default=0, ge=0, description="Duration in seconds")
    room_id: str = Field(..., min_length=1, max_length=120)


class InterviewSessionEnd(BaseModel):
    duration: int = Field(..., ge=0, description="Duration in seconds")
    transcript_url: str | None = Field(default=None, max_length=1000)
    overall_score: int | None = Field(default=None, ge=0, le=100)
    rating_after: int | None = Field(default=None, ge=0)


class InterviewSessionPublic(BaseModel):
    id: str
    student_id: str
    type: InterviewType
    company: str
    difficulty: InterviewDifficulty
    duration: int = 0
    status: InterviewStatus
    started_at: datetime | None = None
    ended_at: datetime | None = None
    room_id: str
    transcript_url: str | None = None
    overall_score: int | None = None
    rating_before: int = 0
    rating_after: int | None = None
    created_at: datetime
