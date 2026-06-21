from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.interview_feedback import InterviewFeedbackCreate, InterviewFeedbackPublic
from app.services.interview_feedback_domain_service import InterviewFeedbackDomainService


router = APIRouter()


@router.post("", response_model=InterviewFeedbackPublic, status_code=201)
async def create_interview_feedback(
    payload: InterviewFeedbackCreate,
    _: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> dict[str, object]:
    return await InterviewFeedbackDomainService(db).create_feedback(payload)


@router.get("/interview/{interview_id}", response_model=InterviewFeedbackPublic)
def get_interview_feedback(
    interview_id: str,
    current_user: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> dict[str, object]:
    return InterviewFeedbackDomainService(db).get_feedback_for_user_interview(
        interview_id=interview_id,
        user_id=str(current_user["id"]),
    )
