import json
import os
from typing import Any

import httpx


class GeminiFeedbackService:
    """Small Gemini client used only for interview feedback summaries."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GOOGLE_API_KEY", "")
        self.model = os.getenv("GEMINI_FEEDBACK_MODEL", "gemini-2.5-flash-lite")

    async def build_feedback_summary(
        self,
        *,
        interview: dict[str, Any],
        transcript_messages: list[dict[str, Any]],
        scores: dict[str, int | None],
    ) -> dict[str, Any]:
        if not self.api_key:
            return self._fallback_summary(scores)

        prompt = self._build_prompt(
            interview=interview,
            transcript_messages=transcript_messages,
            scores=scores,
        )
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model}:generateContent?key={self.api_key}"
        )

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    url,
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                )
                response.raise_for_status()
        except httpx.HTTPError:
            return self._fallback_summary(scores)

        text = self._extract_text(response.json())
        return self._parse_json_or_fallback(text, scores)

    def _build_prompt(
        self,
        *,
        interview: dict[str, Any],
        transcript_messages: list[dict[str, Any]],
        scores: dict[str, int | None],
    ) -> str:
        transcript_text = "\n".join(
            f"{message.get('role', 'unknown')}: {message.get('message', '')}"
            for message in transcript_messages[-80:]
        )

        return f"""
You are an interview coach. Generate concise, practical feedback for this interview.

Return ONLY valid JSON with these fields:
- strengths: array of 3 short strings
- weaknesses: array of 3 short strings
- recommendations: array of 3 short strings
- aiSummary: one paragraph, 3-5 sentences

Interview:
{json.dumps(interview, default=str)}

Scores:
{json.dumps(scores)}

Transcript:
{transcript_text}
"""

    def _extract_text(self, data: dict[str, Any]) -> str:
        candidates = data.get("candidates", [])
        if not candidates:
            return ""

        parts = candidates[0].get("content", {}).get("parts", [])
        return "\n".join(str(part.get("text", "")) for part in parts).strip()

    def _parse_json_or_fallback(self, text: str, scores: dict[str, int | None]) -> dict[str, Any]:
        cleaned = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            return self._fallback_summary(scores)

        return {
            "strengths": self._string_list(parsed.get("strengths")),
            "weaknesses": self._string_list(parsed.get("weaknesses")),
            "recommendations": self._string_list(parsed.get("recommendations")),
            "ai_summary": str(parsed.get("aiSummary") or parsed.get("ai_summary") or "").strip(),
        }

    def _fallback_summary(self, scores: dict[str, int | None]) -> dict[str, Any]:
        average_score = self._average_score(scores)
        return {
            "strengths": ["Completed the interview session", "Shared answers during the discussion"],
            "weaknesses": ["Detailed AI feedback is unavailable because Gemini is not configured"],
            "recommendations": ["Set GOOGLE_API_KEY to enable richer AI-generated feedback"],
            "ai_summary": (
                f"The interview has been recorded with an overall score of {average_score}. "
                "Configure Gemini to generate a detailed strengths, weaknesses, and recommendations summary."
            ),
        }

    def _average_score(self, scores: dict[str, int | None]) -> int:
        valid_scores = [score for score in scores.values() if score is not None]
        if not valid_scores:
            return 0
        return round(sum(valid_scores) / len(valid_scores))

    def _string_list(self, values: Any) -> list[str]:
        if not isinstance(values, list):
            return []
        return [str(value).strip() for value in values if str(value).strip()]


gemini_feedback_service = GeminiFeedbackService()
