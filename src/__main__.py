import logging
import os

from dotenv import load_dotenv
from livekit.agents import JobContext, JobProcess, WorkerOptions, cli
from livekit.plugins import google, silero

from config.envpath import envpath
from services.agent_service import agent_service
from services.agent_session_events import add_agent_session_events


load_dotenv(envpath, override=True)

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
log = logging.getLogger("main")


def prewarm(proc: JobProcess):
    """Load the models once, before a user joins the room."""

    llm_model = os.getenv("GOOGLE_GEMINI_MODEL", "gemini-2.5-flash-lite")
    stt_model = os.getenv("GOOGLE_STT_MODEL", "latest_short")
    stt_language = os.getenv("GOOGLE_STT_LANGUAGE", "en-IN")
    tts_model = os.getenv("GOOGLE_TTS_MODEL", "chirp_3")
    tts_language = os.getenv("GOOGLE_TTS_LANGUAGE", "en-IN")
    tts_voice = os.getenv("GOOGLE_TTS_VOICE", "en-IN-Chirp3-HD-Zephyr")
    tts_gender = os.getenv("GOOGLE_TTS_GENDER", "female")

    log.info("prewarming: llm=%s, stt=%s, tts=%s", llm_model, stt_model, tts_model)

    vad = silero.VAD.load(min_silence_duration=0.7)
    vad.threshold = 0.4

    proc.userdata["vad"] = vad
    proc.userdata["llm"] = google.LLM(
        model=llm_model,
        api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.6,
        max_output_tokens=100,
    )
    proc.userdata["stt"] = google.STT(
        model=stt_model,
        languages=[stt_language],
        spoken_punctuation=True,
        interim_results=True,
    )
    proc.userdata["tts"] = google.TTS(
        language=tts_language,
        gender=tts_gender,
        voice_name=tts_voice,
        model_name=tts_model,
        use_streaming=True,
    )


async def entrypoint(ctx: JobContext):
    try:
        await ctx.connect()

        session = agent_service.create_session(ctx)
        add_agent_session_events(ctx=ctx, session=session)
        await agent_service.start_session(ctx, session)

    except Exception:
        log.exception("agent failed")
        ctx.delete_room()


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
            agent_name=os.getenv("AGENT_NAME", "local_interview_agent"),
            load_threshold=0.90,
            num_idle_processes=1,
        )
    )
