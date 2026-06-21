from fastapi import status
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from app.core.errors import AppError
from app.repositories.student_repository import StudentRepository
from app.schemas.student import StudentCreate


class StudentProfileService:
    def __init__(self, db: Database) -> None:
        self.students = StudentRepository(db)

    def create_student(self, payload: StudentCreate) -> dict[str, object]:
        if self.students.get_by_email(payload.email):
            raise AppError("Student with this email already exists", status.HTTP_409_CONFLICT)

        try:
            return self.students.create(payload)
        except DuplicateKeyError:
            raise AppError("Student with this email already exists", status.HTTP_409_CONFLICT) from None

    def get_student(self, student_id: str) -> dict[str, object]:
        student = self.students.get_by_id(student_id)
        if student is None:
            raise AppError("Student not found", status.HTTP_404_NOT_FOUND)
        return student

    def list_students(self, limit: int = 50) -> list[dict[str, object]]:
        return self.students.list(limit=limit)
