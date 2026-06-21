from fastapi import APIRouter, Depends, Query
from pymongo.database import Database

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.interview_session import InterviewSessionPublic
from app.schemas.question_attempt import QuestionAttemptPublic
from app.schemas.student import StudentCreate, StudentPublic
from app.services.interview_session_domain_service import InterviewSessionDomainService
from app.services.question_attempt_domain_service import QuestionAttemptDomainService
from app.services.student_profile_service import StudentProfileService


router = APIRouter()


@router.post("", response_model=StudentPublic, status_code=201)
def create_student(
    payload: StudentCreate,
    _: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> dict[str, object]:
    return StudentProfileService(db).create_student(payload)


@router.get("", response_model=list[StudentPublic])
def list_students(
    limit: int = Query(default=50, ge=1, le=100),
    _: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> list[dict[str, object]]:
    return StudentProfileService(db).list_students(limit=limit)


@router.get("/{student_id}", response_model=StudentPublic)
def get_student(
    student_id: str,
    _: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> dict[str, object]:
    return StudentProfileService(db).get_student(student_id)


@router.get("/{student_id}/interviews", response_model=list[InterviewSessionPublic])
def list_student_interviews(
    student_id: str,
    limit: int = Query(default=50, ge=1, le=100),
    _: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> list[dict[str, object]]:
    return InterviewSessionDomainService(db).list_student_interviews(
        student_id=student_id,
        limit=limit,
    )


@router.get("/{student_id}/question-attempts", response_model=list[QuestionAttemptPublic])
def list_student_question_attempts(
    student_id: str,
    limit: int = Query(default=50, ge=1, le=100),
    _: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> list[dict[str, object]]:
    return QuestionAttemptDomainService(db).list_attempts_for_student(
        student_id=student_id,
        limit=limit,
    )
