from pydantic import BaseModel, Field

from app.schemas.dsa_question import DsaQuestionPublic


class InterviewSetup(BaseModel):
    type: str = Field(..., min_length=1, max_length=50)
    company: str = Field(..., min_length=1, max_length=100)
    level: str = Field(..., min_length=1, max_length=50)
    difficulty: str = Field(..., min_length=1, max_length=50)


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
    selected_question: DsaQuestionPublic | None = None
