from datetime import UTC, datetime

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ReturnDocument
from pymongo.database import Database

from app.schemas.livekit import InterviewSetup


def _session_to_public(document: dict[str, object]) -> dict[str, object]:
    interview_type = document.get("interview_type") or document.get("type") or "practice"
    room = document.get("room") or document.get("room_id") or ""
    started_at = document.get("started_at") or document.get("created_at")
    status = document.get("status")
    if not status:
        status = "completed" if document.get("created_at") else "unknown"
    feedback_status = document.get("feedback_status")
    if not feedback_status:
        feedback_status = "completed" if document.get("feedback_id") else "pending"

    return {
        "id": str(document["_id"]),
        "room": room,
        "interview_type": interview_type,
        "company": document.get("company", ""),
        "level": document.get("level", ""),
        "difficulty": document.get("difficulty", ""),
        "design_question": document.get("design_question"),
        "selected_question_id": document.get("selected_question_id"),
        "overall_score": document.get("overall_score"),
        "status": status,
        "feedback_status": feedback_status,
        "duration": document.get("duration", 0),
        "feedback_id": document.get("feedback_id"),
        "feedback_error": document.get("feedback_error"),
        "started_at": started_at,
        "ended_at": document.get("ended_at"),
        "created_at": document.get("created_at"),
    }


def save_interview_session(
    db: Database,
    *,
    user_id: str,
    room: str,
    interview: InterviewSetup,
    selected_question_id: str | None = None,
) -> dict[str, object]:
    now = datetime.now(UTC)
    document = {
        "user_id": user_id,
        "room": room,
        "interview_type": interview.type,
        "company": interview.company,
        "level": interview.level,
        "difficulty": interview.difficulty,
        "design_question": interview.design_question,
        "has_resume_text": bool(interview.resume_text),
        "selected_question_id": selected_question_id,
        "status": "in_progress",
        "feedback_status": "pending",
        "duration": 0,
        "overall_score": None,
        "feedback_id": None,
        "feedback_error": None,
        "started_at": now,
        "ended_at": None,
        "created_at": now,
    }
    result = db.interview_sessions.insert_one(document)
    document["_id"] = result.inserted_id
    return _session_to_public(document)


def list_interview_sessions_for_user(
    db: Database,
    *,
    user_id: str,
    limit: int = 50,
) -> list[dict[str, object]]:
    cursor = (
        db.interview_sessions.find({"user_id": user_id})
        .sort("created_at", -1)
        .limit(limit)
    )
    return [_session_to_public(document) for document in cursor]


def get_interview_session_for_user(
    db: Database,
    *,
    user_id: str,
    session_id: str,
) -> dict[str, object] | None:
    object_id = _object_id(session_id)
    if object_id is None:
        return None

    document = db.interview_sessions.find_one({"_id": object_id, "user_id": user_id})
    return _session_to_public(document) if document else None


def mark_livekit_session_completed(
    db: Database,
    *,
    user_id: str,
    session_id: str,
    duration: int,
    overall_score: int,
    feedback_id: str | None = None,
    feedback_status: str = "generating",
) -> dict[str, object] | None:
    object_id = _object_id(session_id)
    if object_id is None:
        return None

    update = {
        "$set": {
            "status": "completed",
            "duration": duration,
            "overall_score": overall_score,
            "feedback_id": feedback_id,
            "feedback_status": feedback_status,
            "feedback_error": None,
            "ended_at": datetime.now(UTC),
        }
    }
    document = db.interview_sessions.find_one_and_update(
        {"_id": object_id, "user_id": user_id},
        update,
        return_document=ReturnDocument.AFTER,
    )
    return _session_to_public(document) if document else None


def mark_livekit_feedback_completed(
    db: Database,
    *,
    user_id: str,
    session_id: str,
    feedback_id: str,
    overall_score: int,
) -> dict[str, object] | None:
    object_id = _object_id(session_id)
    if object_id is None:
        return None

    document = db.interview_sessions.find_one_and_update(
        {"_id": object_id, "user_id": user_id},
        {
            "$set": {
                "status": "completed",
                "feedback_status": "completed",
                "feedback_id": feedback_id,
                "feedback_error": None,
                "overall_score": overall_score,
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    return _session_to_public(document) if document else None


def mark_livekit_feedback_failed(
    db: Database,
    *,
    user_id: str,
    session_id: str,
    error: str,
) -> dict[str, object] | None:
    object_id = _object_id(session_id)
    if object_id is None:
        return None

    document = db.interview_sessions.find_one_and_update(
        {"_id": object_id, "user_id": user_id},
        {
            "$set": {
                "status": "completed",
                "feedback_status": "failed",
                "feedback_error": error[:500],
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    return _session_to_public(document) if document else None


def _object_id(value: str) -> ObjectId | None:
    try:
        return ObjectId(value)
    except InvalidId:
        return None
def mark_session_abandoned_by_room(db: Database, *, room: str) -> dict[str, object] | None:
    document = db.interview_sessions.find_one_and_update(
        {"room": room, "status": "in_progress"},
        {"$set": {"status": "abandoned", "ended_at": datetime.now(UTC)}},
        return_document=ReturnDocument.AFTER,
    )
    return _session_to_public(document) if document else None

def get_live_interview_counts(db: Database) -> dict[str, object]:
    pipeline = [
        {"$match": {"status": "in_progress"}},
        {"$group": {"_id": "$interview_type", "count": {"$sum": 1}}},
    ]
    rows = list(db.interview_sessions.aggregate(pipeline))

    result = {row["_id"]: row["count"] for row in rows}
    for t in ["dsa", "hr", "lld"]:
        result.setdefault(t, 0)
    result["total"] = sum(v for k, v in result.items() if k != "total")
    return result