from datetime import UTC, datetime

from pymongo.database import Database

from app.schemas.livekit import InterviewSetup


def save_interview_session(
    db: Database,
    *,
    user_id: str,
    room: str,
    interview: InterviewSetup,
    selected_question_id: str | None = None,
) -> None:
    db.interview_sessions.insert_one(
        {
            "user_id": user_id,
            "room": room,
            "interview_type": interview.type,
            "company": interview.company,
            "level": interview.level,
            "difficulty": interview.difficulty,
            "design_question": interview.design_question,
            "has_resume_text": bool(interview.resume_text),
            "selected_question_id": selected_question_id,
            "created_at": datetime.now(UTC),
        }
    )
