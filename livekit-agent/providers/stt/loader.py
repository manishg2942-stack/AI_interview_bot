import os

from providers.stt.deepgram_provider import DeepgramSTT
from providers.stt.google_provider import GoogleSTT


def load_stt():
    provider = os.getenv("STT_PROVIDER", "google").strip().lower()

    if provider == "google":
        return GoogleSTT().create()

    if provider == "deepgram":
        return DeepgramSTT().create()

    raise RuntimeError(f"Unsupported STT provider: {provider}")
