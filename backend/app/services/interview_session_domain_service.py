from fastapi import status
from pymongo.database import Database

from app.core.errors import AppError
from app.repositories.interview_session_repository import InterviewSessionRepository
from app.repositories.student_repository import StudentRepository
from app.schemas.interview_session import InterviewSessionCreate, InterviewSessionEnd


class InterviewSessionDomainService:
    def __init__(self, db: Database) -> None:
        self.students = StudentRepository(db)
        self.sessions = InterviewSessionRepository(db)

    def start_interview(self, payload: InterviewSessionCreate) -> dict[str, object]:
        student = self.students.get_by_id(payload.student_id)
        if student is None:
            raise AppError("Student not found", status.HTTP_404_NOT_FOUND)

        rating_before = self._rating_for_type(student, payload.type)
        return self.sessions.create(payload, rating_before=rating_before)

    def end_interview(
        self,
        *,
        interview_id: str,
        payload: InterviewSessionEnd,
    ) -> dict[str, object]:
        existing = self.sessions.get_by_id(interview_id)
        if existing is None:
            raise AppError("Interview session not found", status.HTTP_404_NOT_FOUND)

        if existing["status"] == "completed":
            raise AppError("Interview session is already completed", status.HTTP_409_CONFLICT)

        rating_after = payload.rating_after
        if rating_after is None and payload.overall_score is not None:
            rating_after = self._rating_after_score(
                rating_before=int(existing.get("rating_before", 0)),
                overall_score=payload.overall_score,
            )
            payload = payload.model_copy(update={"rating_after": rating_after})

        session = self.sessions.mark_completed(interview_id=interview_id, payload=payload)
        if session is None:
            raise AppError("Interview session not found", status.HTTP_404_NOT_FOUND)

        if rating_after is not None:
            self.students.update_interview_stats(
                student_id=str(session["student_id"]),
                interview_type=str(session["type"]),
                rating_after=rating_after,
            )

        return session

    def get_interview(self, interview_id: str) -> dict[str, object]:
        session = self.sessions.get_by_id(interview_id)
        if session is None:
            raise AppError("Interview session not found", status.HTTP_404_NOT_FOUND)
        return session

    def list_student_interviews(
        self,
        *,
        student_id: str,
        limit: int = 50,
    ) -> list[dict[str, object]]:
        if self.students.get_by_id(student_id) is None:
            raise AppError("Student not found", status.HTTP_404_NOT_FOUND)
        return self.sessions.list_by_student(student_id, limit=limit)

    def _rating_for_type(self, student: dict[str, object], interview_type: str) -> int:
        if interview_type == "DSA":
            return int(student.get("dsa_rating", 0))
        if interview_type == "HR":
            return int(student.get("hr_rating", 0))
        if interview_type == "LLD":
            return int(student.get("lld_rating", 0))
        return int(student.get("overall_rating", 0))

    def _rating_after_score(self, *, rating_before: int, overall_score: int) -> int:
        delta = round((overall_score - 50) / 5)
        return max(0, rating_before + delta)
