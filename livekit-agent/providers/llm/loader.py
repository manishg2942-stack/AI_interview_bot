import os

from providers.llm.google_provider import GoogleLLM


def load_llm():
    provider = os.getenv("LLM_PROVIDER", "google").strip().lower()

    if provider == "google":
        return GoogleLLM().create()

    raise RuntimeError(f"Unsupported LLM provider: {provider}")
