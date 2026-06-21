from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


TranscriptRole = Literal["student", "interviewer", "system"]


class TranscriptMessageCreate(BaseModel):
    role: TranscriptRole
    message: str = Field(..., min_length=1, max_length=5000)
    timestamp: datetime | None = None


class TranscriptMessagePublic(BaseModel):
    role: TranscriptRole
    message: str
    timestamp: datetime


class TranscriptCreate(BaseModel):
    interview_id: str = Field(..., min_length=1)
    messages: list[TranscriptMessageCreate] = Field(default_factory=list)


class TranscriptAppend(BaseModel):
    messages: list[TranscriptMessageCreate] = Field(..., min_length=1, max_length=100)


class TranscriptPublic(BaseModel):
    id: str
    interview_id: str
    messages: list[TranscriptMessagePublic] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
