from datetime import UTC, datetime

from pymongo import ASCENDING, ReturnDocument
from pymongo.database import Database

from app.schemas.transcript import TranscriptCreate, TranscriptMessageCreate


class TranscriptRepository:
    def __init__(self, db: Database) -> None:
        self.collection = db.transcripts

    def create(self, payload: TranscriptCreate) -> dict[str, object]:
        now = datetime.now(UTC)
        document = {
            "interview_id": payload.interview_id,
            "messages": [self._message_to_document(message) for message in payload.messages],
            "created_at": now,
            "updated_at": now,
        }
        result = self.collection.insert_one(document)
        document["_id"] = result.inserted_id
        return self.to_public(document)

    def get_by_interview_id(self, interview_id: str) -> dict[str, object] | None:
        document = self.collection.find_one({"interview_id": interview_id})
        return self.to_public(document) if document else None

    def append_messages(
        self,
        *,
        interview_id: str,
        messages: list[TranscriptMessageCreate],
    ) -> dict[str, object] | None:
        message_documents = [self._message_to_document(message) for message in messages]
        document = self.collection.find_one_and_update(
            {"interview_id": interview_id},
            {
                "$push": {"messages": {"$each": message_documents}},
                "$set": {"updated_at": datetime.now(UTC)},
            },
            return_document=ReturnDocument.AFTER,
        )
        return self.to_public(document) if document else None

    def replace_messages(
        self,
        *,
        interview_id: str,
        messages: list[TranscriptMessageCreate],
    ) -> dict[str, object]:
        now = datetime.now(UTC)
        document = self.collection.find_one_and_update(
            {"interview_id": interview_id},
            {
                "$set": {
                    "messages": [self._message_to_document(message) for message in messages],
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return self.to_public(document)

    def ensure_indexes(self) -> None:
        self.collection.create_index([("interview_id", ASCENDING)], unique=True)

    def to_public(self, document: dict[str, object]) -> dict[str, object]:
        return {
            "id": str(document["_id"]),
            "interview_id": document["interview_id"],
            "messages": document.get("messages", []),
            "created_at": document["created_at"],
            "updated_at": document["updated_at"],
        }

    def _message_to_document(self, message: TranscriptMessageCreate) -> dict[str, object]:
        return {
            "role": message.role,
            "message": message.message.strip(),
            "timestamp": message.timestamp or datetime.now(UTC),
        }
