from datetime import UTC, datetime

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ASCENDING, ReturnDocument
from pymongo.database import Database

from app.schemas.interview_session import InterviewSessionCreate, InterviewSessionEnd


class InterviewSessionRepository:
    def __init__(self, db: Database) -> None:
        self.collection = db.interview_sessions

    def create(self, payload: InterviewSessionCreate, rating_before: int) -> dict[str, object]:
        now = datetime.now(UTC)
        document = {
            "student_id": payload.student_id,
            "type": payload.type,
            "company": payload.company.strip(),
            "difficulty": payload.difficulty,
            "duration": payload.duration,
            "status": "in_progress",
            "started_at": now,
            "ended_at": None,
            "room_id": payload.room_id.strip(),
            "transcript_url": None,
            "overall_score": None,
            "rating_before": rating_before,
            "rating_after": None,
            "created_at": now,
        }
        result = self.collection.insert_one(document)
        document["_id"] = result.inserted_id
        return self.to_public(document)

    def get_by_id(self, interview_id: str) -> dict[str, object] | None:
        object_id = self._object_id(interview_id)
        if object_id is None:
            return None

        document = self.collection.find_one({"_id": object_id})
        return self.to_public(document) if document else None

    def list_by_student(self, student_id: str, limit: int = 50) -> list[dict[str, object]]:
        cursor = (
            self.collection.find({"student_id": student_id})
            .sort("created_at", -1)
            .limit(limit)
        )
        return [self.to_public(document) for document in cursor]

    def mark_completed(
        self,
        *,
        interview_id: str,
        payload: InterviewSessionEnd,
    ) -> dict[str, object] | None:
        object_id = self._object_id(interview_id)
        if object_id is None:
            return None

        update = {
            "$set": {
                "status": "completed",
                "ended_at": datetime.now(UTC),
                "duration": payload.duration,
                "transcript_url": payload.transcript_url,
                "overall_score": payload.overall_score,
                "rating_after": payload.rating_after,
            }
        }
        document = self.collection.find_one_and_update(
            {"_id": object_id},
            update,
            return_document=ReturnDocument.AFTER,
        )
        return self.to_public(document) if document else None

    def ensure_indexes(self) -> None:
        self.collection.create_index([("student_id", ASCENDING)])
        self.collection.create_index([("room_id", ASCENDING)])
        self.collection.create_index([("status", ASCENDING)])

    def to_public(self, document: dict[str, object]) -> dict[str, object]:
        return {
            "id": str(document["_id"]),
            "student_id": document["student_id"],
            "type": document["type"],
            "company": document["company"],
            "difficulty": document["difficulty"],
            "duration": document.get("duration", 0),
            "status": document.get("status", "in_progress"),
            "started_at": document.get("started_at"),
            "ended_at": document.get("ended_at"),
            "room_id": document["room_id"],
            "transcript_url": document.get("transcript_url"),
            "overall_score": document.get("overall_score"),
            "rating_before": document.get("rating_before", 0),
            "rating_after": document.get("rating_after"),
            "created_at": document["created_at"],
        }

    def _object_id(self, value: str) -> ObjectId | None:
        try:
            return ObjectId(value)
        except InvalidId:
            return None
