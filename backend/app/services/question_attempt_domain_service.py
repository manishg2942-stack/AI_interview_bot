from fastapi import status
from pymongo.database import Database

from app.core.errors import AppError
from app.repositories.interview_session_repository import InterviewSessionRepository
from app.repositories.question_attempt_repository import QuestionAttemptRepository
from app.repositories.student_repository import StudentRepository
from app.schemas.question_attempt import QuestionAttemptCreate


class QuestionAttemptDomainService:
    def __init__(self, db: Database) -> None:
        self.attempts = QuestionAttemptRepository(db)
        self.sessions = InterviewSessionRepository(db)
        self.students = StudentRepository(db)

    def create_attempt(self, payload: QuestionAttemptCreate) -> dict[str, object]:
        student = self.students.get_by_id(payload.student_id)
        if student is None:
            raise AppError("Student not found", status.HTTP_404_NOT_FOUND)

        interview = self.sessions.get_by_id(payload.interview_id)
        if interview is None:
            raise AppError("Interview session not found", status.HTTP_404_NOT_FOUND)

        if interview["student_id"] != payload.student_id:
            raise AppError("Interview does not belong to this student", status.HTTP_400_BAD_REQUEST)

        return self.attempts.create(payload)

    def list_attempts_for_interview(self, interview_id: str) -> list[dict[str, object]]:
        if self.sessions.get_by_id(interview_id) is None:
            raise AppError("Interview session not found", status.HTTP_404_NOT_FOUND)
        return self.attempts.list_by_interview(interview_id)

    def list_attempts_for_student(
        self,
        *,
        student_id: str,
        limit: int = 50,
    ) -> list[dict[str, object]]:
        if self.students.get_by_id(student_id) is None:
            raise AppError("Student not found", status.HTTP_404_NOT_FOUND)
        return self.attempts.list_by_student(student_id, limit=limit)
