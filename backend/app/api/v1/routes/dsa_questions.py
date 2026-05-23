from fastapi import APIRouter, Depends, Query
from pymongo.database import Database

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.dsa_question import (
    DsaQuestionBulkCreate,
    DsaQuestionBulkResponse,
    DsaQuestionPublic,
)
from app.services.dsa_question_service import create_dsa_questions, list_dsa_questions


router = APIRouter()


@router.post("/bulk", response_model=DsaQuestionBulkResponse, status_code=201)
def bulk_create_dsa_questions(
    payload: DsaQuestionBulkCreate,
    _: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> dict[str, object]:
    return create_dsa_questions(db, payload.questions)


@router.get("", response_model=list[DsaQuestionPublic])
def read_dsa_questions(
    company: str | None = None,
    difficulty: str | None = None,
    level: str | None = None,
    topic: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    _: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> list[dict[str, object]]:
    return list_dsa_questions(
        db,
        company=company,
        difficulty=difficulty,
        level=level,
        topic=topic,
        limit=limit,
    )
