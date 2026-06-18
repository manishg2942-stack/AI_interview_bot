import os

from livekit.plugins import google


class GoogleLLM:
    def create(self):
        model = os.getenv("LLM_MODEL") or os.getenv(
            "GOOGLE_GEMINI_MODEL",
            "gemini-2.5-flash-lite",
        )
        temperature = float(os.getenv("LLM_TEMPERATURE", "0.5"))
        max_output_tokens = int(os.getenv("LLM_MAX_OUTPUT_TOKENS", "60"))

        return google.LLM(
            model=model,
            api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        )
