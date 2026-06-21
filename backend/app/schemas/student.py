from datetime import datetime

from pydantic import BaseModel, Field


class StudentCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=254)


class StudentPublic(BaseModel):
    id: str
    name: str
    email: str
    overall_rating: int = 0
    total_interviews: int = 0
    dsa_rating: int = 0
    hr_rating: int = 0
    lld_rating: int = 0
    streak: int = 0
    created_at: datetime
