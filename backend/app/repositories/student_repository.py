from datetime import UTC, datetime

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ASCENDING, ReturnDocument
from pymongo.database import Database

from app.schemas.student import StudentCreate


class StudentRepository:
    def __init__(self, db: Database) -> None:
        self.collection = db.students

    def create(self, payload: StudentCreate) -> dict[str, object]:
        now = datetime.now(UTC)
        document = {
            "name": payload.name.strip(),
            "email": payload.email.lower(),
            "overall_rating": 0,
            "total_interviews": 0,
            "dsa_rating": 0,
            "hr_rating": 0,
            "lld_rating": 0,
            "streak": 0,
            "created_at": now,
        }
        result = self.collection.insert_one(document)
        document["_id"] = result.inserted_id
        return self.to_public(document)

    def get_by_id(self, student_id: str) -> dict[str, object] | None:
        object_id = self._object_id(student_id)
        if object_id is None:
            return None

        document = self.collection.find_one({"_id": object_id})
        return self.to_public(document) if document else None

    def get_by_email(self, email: str) -> dict[str, object] | None:
        document = self.collection.find_one({"email": email.lower()})
        return self.to_public(document) if document else None

    def list(self, limit: int = 50) -> list[dict[str, object]]:
        cursor = self.collection.find().sort("created_at", -1).limit(limit)
        return [self.to_public(document) for document in cursor]

    def update_interview_stats(
        self,
        *,
        student_id: str,
        interview_type: str,
        rating_after: int,
    ) -> dict[str, object] | None:
        object_id = self._object_id(student_id)
        if object_id is None:
            return None

        rating_field = {
            "DSA": "dsa_rating",
            "HR": "hr_rating",
            "LLD": "lld_rating",
        }.get(interview_type, "overall_rating")

        update = {
            "$inc": {"total_interviews": 1, "streak": 1},
            "$set": {rating_field: rating_after, "overall_rating": rating_after},
        }
        document = self.collection.find_one_and_update(
            {"_id": object_id},
            update,
            return_document=ReturnDocument.AFTER,
        )
        return self.to_public(document) if document else None

    def ensure_indexes(self) -> None:
        self.collection.create_index([("email", ASCENDING)], unique=True)

    def to_public(self, document: dict[str, object]) -> dict[str, object]:
        return {
            "id": str(document["_id"]),
            "name": document["name"],
            "email": document["email"],
            "overall_rating": document.get("overall_rating", 0),
            "total_interviews": document.get("total_interviews", 0),
            "dsa_rating": document.get("dsa_rating", 0),
            "hr_rating": document.get("hr_rating", 0),
            "lld_rating": document.get("lld_rating", 0),
            "streak": document.get("streak", 0),
            "created_at": document["created_at"],
        }

    def _object_id(self, value: str) -> ObjectId | None:
        try:
            return ObjectId(value)
        except InvalidId:
            return None
