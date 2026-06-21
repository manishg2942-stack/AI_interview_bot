from fastapi import status
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from app.core.errors import AppError
from app.repositories.interview_feedback_repository import InterviewFeedbackRepository
from app.repositories.interview_session_repository import InterviewSessionRepository
from app.repositories.student_repository import StudentRepository
from app.repositories.transcript_repository import TranscriptRepository
from app.schemas.interview_feedback import InterviewFeedbackCreate
from app.schemas.livekit import CompleteLiveKitSessionRequest
from app.schemas.transcript import TranscriptMessageCreate
from app.services.gemini_feedback_service import gemini_feedback_service
from app.services.session_service import (
    get_interview_session_for_user,
    mark_livekit_feedback_completed,
    mark_livekit_feedback_failed,
    mark_livekit_session_completed,
)


class InterviewFeedbackDomainService:
    def __init__(self, db: Database) -> None:
        self.feedback = InterviewFeedbackRepository(db)
        self.sessions = InterviewSessionRepository(db)
        self.students = StudentRepository(db)
        self.transcripts = TranscriptRepository(db)

    async def create_feedback(self, payload: InterviewFeedbackCreate) -> dict[str, object]:
        student = self.students.get_by_id(payload.student_id)
        if student is None:
            raise AppError("Student not found", status.HTTP_404_NOT_FOUND)

        interview = self.sessions.get_by_id(payload.interview_id)
        if interview is None:
            raise AppError("Interview session not found", status.HTTP_404_NOT_FOUND)

        if interview["student_id"] != payload.student_id:
            raise AppError("Interview does not belong to this student", status.HTTP_400_BAD_REQUEST)

        if self.feedback.get_by_interview_id(payload.interview_id):
            raise AppError("Feedback already exists for this interview", status.HTTP_409_CONFLICT)

        transcript = self.transcripts.get_by_interview_id(payload.interview_id)
        transcript_messages = transcript["messages"] if transcript else []
        ai_feedback = await gemini_feedback_service.build_feedback_summary(
            interview=interview,
            transcript_messages=transcript_messages,
            scores=self._scores(payload),
        )

        return self.feedback.create(
            payload=payload,
            strengths=ai_feedback["strengths"],
            weaknesses=ai_feedback["weaknesses"],
            recommendations=ai_feedback["recommendations"],
            ai_summary=ai_feedback["ai_summary"],
        )

    def get_feedback_for_interview(self, interview_id: str) -> dict[str, object]:
        feedback = self.feedback.get_by_interview_id(interview_id)
        if feedback is None:
            raise AppError("Feedback not found", status.HTTP_404_NOT_FOUND)
        return feedback

    def get_feedback_for_user_interview(
        self,
        *,
        interview_id: str,
        user_id: str,
    ) -> dict[str, object]:
        feedback = self.feedback.get_by_interview_id(interview_id)
        if feedback is None:
            raise AppError("Feedback not found", status.HTTP_404_NOT_FOUND)

        feedback_user_id = feedback.get("user_id")
        if feedback_user_id and str(feedback_user_id) != user_id:
            raise AppError("Feedback not found", status.HTTP_404_NOT_FOUND)
        return feedback

    def start_livekit_session_completion(
        self,
        *,
        session_id: str,
        user_id: str,
        payload: CompleteLiveKitSessionRequest,
    ) -> dict[str, object]:
        session = get_interview_session_for_user(
            self.sessions.collection.database,
            user_id=user_id,
            session_id=session_id,
        )
        if session is None:
            raise AppError("Interview session not found", status.HTTP_404_NOT_FOUND)

        existing_feedback = self.feedback.get_by_interview_id(session_id)
        if existing_feedback is not None:
            completed_session = mark_livekit_session_completed(
                self.sessions.collection.database,
                user_id=user_id,
                session_id=session_id,
                duration=payload.duration or int(session.get("duration", 0)),
                overall_score=int(existing_feedback["overall_score"]),
                feedback_id=str(existing_feedback["id"]),
                feedback_status="completed",
            )
            if completed_session is None:
                raise AppError("Interview session not found", status.HTTP_404_NOT_FOUND)
            return completed_session

        transcript_messages = self._livekit_transcript_messages(payload)
        self.transcripts.replace_messages(
            interview_id=session_id,
            messages=transcript_messages,
        )
        scores = self._score_livekit_session(session, transcript_messages)
        completed_session = mark_livekit_session_completed(
            self.sessions.collection.database,
            user_id=user_id,
            session_id=session_id,
            duration=payload.duration,
            overall_score=int(scores["overall_score"] or 0),
            feedback_status="generating",
        )
        if completed_session is None:
            raise AppError("Interview session not found", status.HTTP_404_NOT_FOUND)
        return completed_session

    async def generate_livekit_feedback(
        self,
        *,
        session_id: str,
        user_id: str,
    ) -> None:
        session = get_interview_session_for_user(
            self.sessions.collection.database,
            user_id=user_id,
            session_id=session_id,
        )
        if session is None:
            return

        existing_feedback = self.feedback.get_by_interview_id(session_id)
        if existing_feedback is not None:
            mark_livekit_feedback_completed(
                self.sessions.collection.database,
                user_id=user_id,
                session_id=session_id,
                feedback_id=str(existing_feedback["id"]),
                overall_score=int(existing_feedback["overall_score"]),
            )
            return

        transcript = self.transcripts.get_by_interview_id(session_id)
        transcript_documents = transcript["messages"] if transcript else []
        transcript_messages = [
            TranscriptMessageCreate(
                role=message["role"],
                message=message["message"],
                timestamp=message.get("timestamp"),
            )
            for message in transcript_documents
            if message.get("message")
        ]
        scores = self._score_livekit_session(session, transcript_messages)
        feedback_payload = InterviewFeedbackCreate(
            interview_id=session_id,
            student_id=user_id,
            **scores,
        )
        try:
            ai_feedback = await gemini_feedback_service.build_feedback_summary(
                interview=session,
                transcript_messages=transcript_documents,
                scores=self._scores(feedback_payload),
            )
            feedback = self.feedback.create(
                payload=feedback_payload,
                strengths=ai_feedback["strengths"],
                weaknesses=ai_feedback["weaknesses"],
                recommendations=ai_feedback["recommendations"],
                ai_summary=ai_feedback["ai_summary"],
                user_id=user_id,
            )
        except DuplicateKeyError:
            feedback = self.feedback.get_by_interview_id(session_id)
            if feedback is None:
                raise
        except Exception as exc:
            mark_livekit_feedback_failed(
                self.sessions.collection.database,
                user_id=user_id,
                session_id=session_id,
                error="Feedback generation failed",
            )
            raise exc

        mark_livekit_feedback_completed(
            self.sessions.collection.database,
            user_id=user_id,
            session_id=session_id,
            feedback_id=str(feedback["id"]),
            overall_score=int(feedback["overall_score"]),
        )

    def _scores(self, payload: InterviewFeedbackCreate) -> dict[str, int | None]:
        return {
            "overallScore": payload.overall_score,
            "codingScore": payload.coding_score,
            "communicationScore": payload.communication_score,
            "confidenceScore": payload.confidence_score,
            "problemSolvingScore": payload.problem_solving_score,
            "leadershipScore": payload.leadership_score,
            "systemDesignScore": payload.system_design_score,
            "behaviouralScore": payload.behavioural_score,
        }

    def _livekit_transcript_messages(
        self,
        payload: CompleteLiveKitSessionRequest,
    ) -> list[TranscriptMessageCreate]:
        role_map = {
            "user": "student",
            "assistant": "interviewer",
            "student": "student",
            "interviewer": "interviewer",
            "system": "system",
        }
        messages: list[TranscriptMessageCreate] = []
        for message in payload.transcript_messages:
            text = message.text.strip()
            if not text:
                continue
            messages.append(
                TranscriptMessageCreate(
                    role=role_map[message.role],
                    message=text,
                    timestamp=message.timestamp,
                )
            )
        return messages

    def _score_livekit_session(
        self,
        session: dict[str, object],
        transcript_messages: list[TranscriptMessageCreate],
    ) -> dict[str, int | None]:
        student_messages = [message for message in transcript_messages if message.role == "student"]
        word_count = sum(len(message.message.split()) for message in student_messages)
        overall_score = min(
            95,
            max(50, 58 + min(len(student_messages), 10) * 3 + min(word_count // 80, 12)),
        )
        interview_type = str(session.get("interview_type", "")).lower()

        scores: dict[str, int | None] = {
            "overall_score": overall_score,
            "coding_score": None,
            "communication_score": min(100, overall_score + 2),
            "confidence_score": max(0, overall_score - 4),
            "problem_solving_score": None,
            "leadership_score": None,
            "system_design_score": None,
            "behavioural_score": None,
        }
        if interview_type == "dsa":
            scores["coding_score"] = overall_score
            scores["problem_solving_score"] = max(0, overall_score - 2)
        elif interview_type in {"lld", "hld"}:
            scores["system_design_score"] = overall_score
            scores["problem_solving_score"] = max(0, overall_score - 1)
        elif interview_type == "behavioral":
            scores["behavioural_score"] = overall_score
            scores["leadership_score"] = max(0, overall_score - 3)
        return scores
