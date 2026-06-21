from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.interview_session import (
    InterviewSessionCreate,
    InterviewSessionEnd,
    InterviewSessionPublic,
)
from app.services.interview_session_domain_service import InterviewSessionDomainService


router = APIRouter()


@router.post("", response_model=InterviewSessionPublic, status_code=201)
def start_interview_session(
    payload: InterviewSessionCreate,
    _: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> dict[str, object]:
    return InterviewSessionDomainService(db).start_interview(payload)


@router.get("/{interview_id}", response_model=InterviewSessionPublic)
def get_interview_session(
    interview_id: str,
    _: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> dict[str, object]:
    return InterviewSessionDomainService(db).get_interview(interview_id)


@router.post("/{interview_id}/end", response_model=InterviewSessionPublic)
def end_interview_session(
    interview_id: str,
    payload: InterviewSessionEnd,
    _: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> dict[str, object]:
    return InterviewSessionDomainService(db).end_interview(
        interview_id=interview_id,
        payload=payload,
    )
