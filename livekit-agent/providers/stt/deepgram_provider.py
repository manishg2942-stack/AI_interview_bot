import os

from livekit.agents import inference


class DeepgramSTT:
    def create(self):
        model = os.getenv("STT_MODEL", "deepgram/flux-general")
        language = os.getenv("STT_LANGUAGE", "en")

        return inference.STT(
            model=model,
            language=language,
            no_delay=True
            
            
        )
