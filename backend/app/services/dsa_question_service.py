from datetime import UTC, datetime

from pymongo.database import Database

from app.schemas.dsa_question import DsaQuestionCreate


def _normalize_values(values: list[str]) -> list[str]:
    seen: set[str] = set()
    normalized: list[str] = []

    for value in values:
        cleaned = value.strip()
        key = cleaned.lower()
        if cleaned and key not in seen:
            seen.add(key)
            normalized.append(cleaned)

    return normalized


def _question_to_document(question: DsaQuestionCreate) -> dict[str, object]:
    now = datetime.now(UTC)
    data = question.model_dump()
    data["companies"] = _normalize_values(data["companies"])
    data["topics"] = _normalize_values(data["topics"])
    data["tags"] = _normalize_values(data["tags"])
    data["created_at"] = now
    data["updated_at"] = now
    return data


def _document_to_public_question(document: dict[str, object]) -> dict[str, object]:
    return {
        "id": str(document["_id"]),
        "title": document["title"],
        "question": document["question"],
        "difficulty": document["difficulty"],
        "companies": document.get("companies", []),
        "topics": document.get("topics", []),
        "level": document.get("level", []),
        "constraints": document.get("constraints", []),
        "examples": document.get("examples", []),
        "expected_approach": document.get("expected_approach", ""),
        "time_complexity": document.get("time_complexity", ""),
        "space_complexity": document.get("space_complexity", ""),
        "tags": document.get("tags", []),
        "is_active": document.get("is_active", True),
    }


def create_dsa_questions(
    db: Database,
    questions: list[DsaQuestionCreate],
) -> dict[str, object]:
    documents = [_question_to_document(question) for question in questions]
    result = db.dsa_questions.insert_many(documents, ordered=False)
    return {
        "inserted_count": len(result.inserted_ids),
        "ids": [str(inserted_id) for inserted_id in result.inserted_ids],
    }


def list_dsa_questions(
    db: Database,
    *,
    company: str | None = None,
    difficulty: str | None = None,
    level: str | None = None,
    topic: str | None = None,
    limit: int = 50,
) -> list[dict[str, object]]:
    query: dict[str, object] = {"is_active": True}

    if company:
        query["companies"] = company
    if difficulty:
        query["difficulty"] = difficulty
    if level:
        query["level"] = level
    if topic:
        query["topics"] = topic

    cursor = db.dsa_questions.find(query).sort("created_at", -1).limit(limit)
    return [_document_to_public_question(document) for document in cursor]


def select_dsa_question_for_interview(
    db: Database,
    *,
    company: str,
    difficulty: str,
    level: str,
) -> dict[str, object] | None:
    attempts: list[dict[str, object]] = [
        {
            "is_active": True,
            "companies": company,
            "difficulty": difficulty,
            "level": level,
        },
        {
            "is_active": True,
            "difficulty": difficulty,
            "level": level,
        },
        {
            "is_active": True,
            "companies": company,
            "difficulty": difficulty,
        },
        {
            "is_active": True,
            "difficulty": difficulty,
        },
        {"is_active": True},
    ]

    for query in attempts:
        matches = list(db.dsa_questions.aggregate([{"$match": query}, {"$sample": {"size": 1}}]))
        if matches:
            return _document_to_public_question(matches[0])

    return None
