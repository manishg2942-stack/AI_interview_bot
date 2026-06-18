import logging
import os

from dotenv import load_dotenv
from livekit.agents import JobContext, JobProcess, WorkerOptions, cli

from config.envpath import envpath
from providers.llm.loader import load_llm
from providers.stt.loader import load_stt
from providers.tts.loader import load_tts
from providers.vad.loader import load_vad
from services.agent_service import agent_service
from services.agent_session_events import add_agent_session_events
from utils.metadata_parser import interview_context_from_job


load_dotenv(envpath, override=True)

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
log = logging.getLogger("main")


def prewarm(proc: JobProcess):
    """Load the models once, before a user joins the room."""

    log.info(
        "prewarming voice pipeline: stt_provider=%s tts_provider=%s "
        "llm_provider=%s vad_provider=%s",
        os.getenv("STT_PROVIDER", "google"),
        os.getenv("TTS_PROVIDER", "google"),
        os.getenv("LLM_PROVIDER", "google"),
        os.getenv("VAD_PROVIDER", "silero"),
    )

    proc.userdata["stt"] = load_stt()
    proc.userdata["tts"] = load_tts()
    proc.userdata["llm"] = load_llm()
    proc.userdata["vad"] = load_vad()


async def entrypoint(ctx: JobContext):
    try:
        await ctx.connect()

        interview_context = interview_context_from_job(ctx)
        session = agent_service.create_session(ctx)
        add_agent_session_events(ctx=ctx, session=session)
        await agent_service.start_session(ctx, session, interview_context)

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
            num_idle_processes=0,
        )
    )
