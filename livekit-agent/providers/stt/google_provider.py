import os

from livekit.plugins import google

from config.google_credentials import google_credentials_kwargs


class GoogleSTT:
    def create(self):
        model = os.getenv("STT_MODEL") or os.getenv("GOOGLE_STT_MODEL", "latest_long")
        language = os.getenv("STT_LANGUAGE") or os.getenv("GOOGLE_STT_LANGUAGE", "en-IN")

        return google.STT(
            model=model,
            languages=[language],
            spoken_punctuation=True,
            interim_results=True,
            use_streaming=True,
            **google_credentials_kwargs(),
        )
