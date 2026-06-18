import os

from providers.tts.google_provider import GoogleTTS


def load_tts():
    provider = os.getenv("TTS_PROVIDER", "google").strip().lower()

    if provider == "google":
        return GoogleTTS().create()

    raise RuntimeError(f"Unsupported TTS provider: {provider}")
