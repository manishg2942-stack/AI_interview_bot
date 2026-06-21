from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.question_attempt import QuestionAttemptCreate, QuestionAttemptPublic
from app.services.question_attempt_domain_service import QuestionAttemptDomainService


router = APIRouter()


@router.post("", response_model=QuestionAttemptPublic, status_code=201)
def create_question_attempt(
    payload: QuestionAttemptCreate,
    _: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> dict[str, object]:
    return QuestionAttemptDomainService(db).create_attempt(payload)


@router.get("/interview/{interview_id}", response_model=list[QuestionAttemptPublic])
def list_interview_question_attempts(
    interview_id: str,
    _: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> list[dict[str, object]]:
    return QuestionAttemptDomainService(db).list_attempts_for_interview(interview_id)
