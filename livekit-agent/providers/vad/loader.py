import os

from providers.vad.silero_provider import SileroVAD


def load_vad():
    provider = os.getenv("VAD_PROVIDER", "silero").strip().lower()

    if provider == "silero":
        return SileroVAD().create()

    raise RuntimeError(f"Unsupported VAD provider: {provider}")
