from datetime import UTC, datetime

from pymongo import ASCENDING
from pymongo.database import Database

from app.schemas.interview_feedback import InterviewFeedbackCreate


class InterviewFeedbackRepository:
    def __init__(self, db: Database) -> None:
        self.collection = db.interview_feedback

    def create(
        self,
        *,
        payload: InterviewFeedbackCreate,
        strengths: list[str],
        weaknesses: list[str],
        recommendations: list[str],
        ai_summary: str,
        user_id: str | None = None,
    ) -> dict[str, object]:
        now = datetime.now(UTC)
        data = payload.model_dump()
        document = {
            **data,
            "user_id": user_id,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "recommendations": recommendations,
            "ai_summary": ai_summary,
            "created_at": now,
        }
        result = self.collection.insert_one(document)
        document["_id"] = result.inserted_id
        return self.to_public(document)

    def get_by_interview_id(self, interview_id: str) -> dict[str, object] | None:
        document = self.collection.find_one({"interview_id": interview_id})
        return self.to_public(document) if document else None

    def list_by_user(self, user_id: str, limit: int = 50) -> list[dict[str, object]]:
        cursor = (
            self.collection.find({"user_id": user_id})
            .sort("created_at", -1)
            .limit(limit)
        )
        return [self.to_public(document) for document in cursor]

    def ensure_indexes(self) -> None:
        self.collection.create_index([("interview_id", ASCENDING)], unique=True)
        self.collection.create_index([("student_id", ASCENDING)])

    def to_public(self, document: dict[str, object]) -> dict[str, object]:
        return {
            "id": str(document["_id"]),
            "interview_id": document["interview_id"],
            "student_id": document["student_id"],
            "user_id": document.get("user_id"),
            "overall_score": document["overall_score"],
            "coding_score": document.get("coding_score"),
            "communication_score": document.get("communication_score"),
            "confidence_score": document.get("confidence_score"),
            "problem_solving_score": document.get("problem_solving_score"),
            "leadership_score": document.get("leadership_score"),
            "system_design_score": document.get("system_design_score"),
            "behavioural_score": document.get("behavioural_score"),
            "strengths": document.get("strengths", []),
            "weaknesses": document.get("weaknesses", []),
            "recommendations": document.get("recommendations", []),
            "ai_summary": document.get("ai_summary", ""),
            "created_at": document["created_at"],
        }
