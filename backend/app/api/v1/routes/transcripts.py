from fastapi import APIRouter, Depends
from pymongo.database import Database

from app.api.deps import get_current_user
from app.db.session import get_db
from app.schemas.transcript import TranscriptAppend, TranscriptCreate, TranscriptPublic
from app.services.transcript_domain_service import TranscriptDomainService


router = APIRouter()


@router.post("", response_model=TranscriptPublic, status_code=201)
def create_transcript(
    payload: TranscriptCreate,
    _: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> dict[str, object]:
    return TranscriptDomainService(db).create_transcript(payload)


@router.get("/interview/{interview_id}", response_model=TranscriptPublic)
def get_interview_transcript(
    interview_id: str,
    _: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> dict[str, object]:
    return TranscriptDomainService(db).get_transcript(interview_id)


@router.post("/interview/{interview_id}/messages", response_model=TranscriptPublic)
def append_transcript_messages(
    interview_id: str,
    payload: TranscriptAppend,
    _: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> dict[str, object]:
    return TranscriptDomainService(db).append_messages(
        interview_id=interview_id,
        payload=payload,
    )
