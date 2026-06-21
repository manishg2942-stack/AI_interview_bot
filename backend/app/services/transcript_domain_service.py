from fastapi import status
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from app.core.errors import AppError
from app.repositories.interview_session_repository import InterviewSessionRepository
from app.repositories.transcript_repository import TranscriptRepository
from app.schemas.transcript import TranscriptAppend, TranscriptCreate


class TranscriptDomainService:
    def __init__(self, db: Database) -> None:
        self.sessions = InterviewSessionRepository(db)
        self.transcripts = TranscriptRepository(db)

    def create_transcript(self, payload: TranscriptCreate) -> dict[str, object]:
        if self.sessions.get_by_id(payload.interview_id) is None:
            raise AppError("Interview session not found", status.HTTP_404_NOT_FOUND)

        if self.transcripts.get_by_interview_id(payload.interview_id):
            raise AppError("Transcript already exists for this interview", status.HTTP_409_CONFLICT)

        try:
            return self.transcripts.create(payload)
        except DuplicateKeyError:
            raise AppError("Transcript already exists for this interview", status.HTTP_409_CONFLICT) from None

    def append_messages(
        self,
        *,
        interview_id: str,
        payload: TranscriptAppend,
    ) -> dict[str, object]:
        if self.sessions.get_by_id(interview_id) is None:
            raise AppError("Interview session not found", status.HTTP_404_NOT_FOUND)

        transcript = self.transcripts.append_messages(
            interview_id=interview_id,
            messages=payload.messages,
        )
        if transcript is None:
            transcript = self.transcripts.create(
                TranscriptCreate(interview_id=interview_id, messages=payload.messages)
            )
        return transcript

    def get_transcript(self, interview_id: str) -> dict[str, object]:
        transcript = self.transcripts.get_by_interview_id(interview_id)
        if transcript is None:
            raise AppError("Transcript not found", status.HTTP_404_NOT_FOUND)
        return transcript
