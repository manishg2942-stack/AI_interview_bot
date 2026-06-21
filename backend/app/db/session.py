from collections.abc import Iterator

from pymongo import ASCENDING, MongoClient
from pymongo.database import Database

from app.core.config import settings


client: MongoClient | None = None


def get_client() -> MongoClient:
    global client

    if client is None:
        client = MongoClient(settings.mongodb_url)
    return client


def get_database() -> Database:
    return get_client()[settings.mongodb_db]


def get_db() -> Iterator[Database]:
    yield get_database()


def init_db() -> None:
    db = get_database()
    db.users.create_index([("email", ASCENDING)], unique=True)
    db.users.create_index([("google_id", ASCENDING)])
    db.interview_sessions.create_index([("user_id", ASCENDING)])
    db.interview_sessions.create_index([("user_id", ASCENDING), ("status", ASCENDING)])
    db.interview_sessions.create_index([("student_id", ASCENDING)])
    db.interview_sessions.create_index([("room", ASCENDING)])
    db.interview_sessions.create_index([("room_id", ASCENDING)])
    db.interview_sessions.create_index([("status", ASCENDING)])
    db.interview_sessions.create_index([("feedback_status", ASCENDING)])
    db.dsa_questions.create_index([("difficulty", ASCENDING)])
    db.dsa_questions.create_index([("companies", ASCENDING)])
    db.dsa_questions.create_index([("level", ASCENDING)])
    db.dsa_questions.create_index([("topics", ASCENDING)])
    db.students.create_index([("email", ASCENDING)], unique=True)
    db.interview_feedback.create_index([("interview_id", ASCENDING)], unique=True)
    db.interview_feedback.create_index([("student_id", ASCENDING)])
    db.interview_feedback.create_index([("user_id", ASCENDING)])
    db.transcripts.create_index([("interview_id", ASCENDING)], unique=True)
    db.question_attempts.create_index([("student_id", ASCENDING)])
    db.question_attempts.create_index([("interview_id", ASCENDING)])
    db.question_attempts.create_index([("question_id", ASCENDING)])
