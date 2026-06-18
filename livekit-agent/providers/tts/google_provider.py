import os

from livekit.plugins import google

from config.google_credentials import google_credentials_kwargs


class GoogleTTS:
    def create(self):
        model = os.getenv("TTS_MODEL") or os.getenv("GOOGLE_TTS_MODEL", "chirp_3")
        language = os.getenv("TTS_LANGUAGE") or os.getenv("GOOGLE_TTS_LANGUAGE", "en-IN")
        voice = os.getenv("TTS_VOICE") or os.getenv(
            "GOOGLE_TTS_VOICE",
            "en-IN-Chirp3-HD-Zephyr",
        )
        gender = os.getenv("TTS_GENDER") or os.getenv("GOOGLE_TTS_GENDER", "female")

        return google.TTS(
            language=language,
            gender=gender,
            voice_name=voice,
            model_name=model,
            use_streaming=True,
            **google_credentials_kwargs(),
        )
