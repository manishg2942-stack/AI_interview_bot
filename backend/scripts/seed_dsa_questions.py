import json
import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.db.session import get_database, init_db
from app.schemas.dsa_question import DsaQuestionBulkCreate
from app.services.dsa_question_service import _question_to_document


def main() -> None:
    seed_path = BACKEND_ROOT / "seed" / "dsa_questions.json"
    payload = json.loads(seed_path.read_text(encoding="utf-8"))
    questions = DsaQuestionBulkCreate(**payload).questions

    init_db()
    db = get_database()

    upserted = 0
    updated = 0
    for question in questions:
        document = _question_to_document(question)
        result = db.dsa_questions.update_one(
            {"title": question.title},
            {"$set": document},
            upsert=True,
        )
        upserted += 1 if result.upserted_id else 0
        updated += result.modified_count

    print(
        f"Seeded {len(questions)} DSA questions "
        f"({upserted} inserted, {updated} updated)."
    )


if __name__ == "__main__":
    main()
