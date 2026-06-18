import logging
import os

from livekit.plugins import silero


log = logging.getLogger("vad_provider")


class SileroVAD:
    def create(self):
        min_silence_duration = float(os.getenv("VAD_MIN_SILENCE_DURATION", "0.2"))
        threshold = float(os.getenv("VAD_THRESHOLD", "0.3"))

        vad = silero.VAD.load(min_silence_duration=min_silence_duration)
        vad.threshold = threshold

        log.info(
            "vad settings: provider=silero min_silence_duration=%s threshold=%s",
            min_silence_duration,
            threshold,
        )
        return vad
