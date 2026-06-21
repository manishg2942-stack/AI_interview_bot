from datetime import UTC, datetime

from pymongo import ASCENDING
from pymongo.database import Database

from app.schemas.question_attempt import QuestionAttemptCreate


class QuestionAttemptRepository:
    def __init__(self, db: Database) -> None:
        self.collection = db.question_attempts

    def create(self, payload: QuestionAttemptCreate) -> dict[str, object]:
        now = datetime.now(UTC)
        document = {
            **payload.model_dump(),
            "created_at": now,
        }
        result = self.collection.insert_one(document)
        document["_id"] = result.inserted_id
        return self.to_public(document)

    def list_by_interview(self, interview_id: str) -> list[dict[str, object]]:
        cursor = self.collection.find({"interview_id": interview_id}).sort("created_at", -1)
        return [self.to_public(document) for document in cursor]

    def list_by_student(self, student_id: str, limit: int = 50) -> list[dict[str, object]]:
        cursor = (
            self.collection.find({"student_id": student_id})
            .sort("created_at", -1)
            .limit(limit)
        )
        return [self.to_public(document) for document in cursor]

    def ensure_indexes(self) -> None:
        self.collection.create_index([("student_id", ASCENDING)])
        self.collection.create_index([("interview_id", ASCENDING)])
        self.collection.create_index([("question_id", ASCENDING)])

    def to_public(self, document: dict[str, object]) -> dict[str, object]:
        return {
            "id": str(document["_id"]),
            "student_id": document["student_id"],
            "interview_id": document["interview_id"],
            "question_id": document["question_id"],
            "language": document["language"],
            "code": document["code"],
            "passed": document.get("passed", 0),
            "hidden_passed": document.get("hidden_passed", 0),
            "runtime": document.get("runtime"),
            "memory": document.get("memory"),
            "time_taken": document.get("time_taken", 0),
            "created_at": document["created_at"],
        }
