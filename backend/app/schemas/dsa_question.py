from typing import Literal

from pydantic import BaseModel, Field


Difficulty = Literal["Easy", "Medium", "Hard"]
Level = Literal["Fresher", "SDE 1", "SDE 2", "Senior"]


class DsaExample(BaseModel):
    input: str = Field(..., min_length=1)
    output: str = Field(..., min_length=1)
    explanation: str = ""


class DsaQuestionCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=160)
    question: str = Field(..., min_length=10)
    difficulty: Difficulty
    companies: list[str] = Field(default_factory=list)
    topics: list[str] = Field(default_factory=list)
    level: list[Level] = Field(default_factory=list)
    constraints: list[str] = Field(default_factory=list)
    examples: list[DsaExample] = Field(default_factory=list)
    expected_approach: str = ""
    time_complexity: str = ""
    space_complexity: str = ""
    tags: list[str] = Field(default_factory=list)
    is_active: bool = True


class DsaQuestionBulkCreate(BaseModel):
    questions: list[DsaQuestionCreate] = Field(..., min_length=1, max_length=500)


class DsaQuestionPublic(DsaQuestionCreate):
    id: str


class DsaQuestionBulkResponse(BaseModel):
    inserted_count: int
    ids: list[str]
