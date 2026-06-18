import asyncio
import logging
import time

from livekit.agents import (
    AgentSession,
    ConversationItemAddedEvent,
    JobContext,
    UserInputTranscribedEvent,
    UserStateChangedEvent,
)


log = logging.getLogger("agent_events")
INTERVIEW_DURATION_SECONDS = 5 * 60


def add_agent_session_events(ctx: JobContext, session: AgentSession) -> None:
    add_transcript_logging(ctx, session)
   # add_user_inactivity_event(ctx, session)
    add_interview_timeout_event(ctx, session)


def add_transcript_logging(ctx: JobContext, session: AgentSession) -> None:
    last_interim_sent_at = 0.0
    speech_started_at = 0.0
    last_interim_text = ""

    @session.on(event="user_input_transcribed")
    def user_input_transcribed(ev: UserInputTranscribedEvent) -> None:
        nonlocal last_interim_sent_at, speech_started_at, last_interim_text

        text = ev.transcript.strip()
        if not text:
            return

        now = time.monotonic()

        if ev.is_final:
            final_after = now - speech_started_at if speech_started_at else 0.0
            log.info("USER final after %.2fs: %s", final_after, text)
            speech_started_at = 0.0
            last_interim_text = ""
            return

        if not speech_started_at:
            speech_started_at = now
            log.info("USER interim started: %s", text)

        if text != last_interim_text and now - last_interim_sent_at >= 2.0:
            last_interim_sent_at = now
            last_interim_text = text
            log.info("USER interim waiting %.2fs: %s", now - speech_started_at, text)

    @session.on(event="conversation_item_added")
    def conversation_item_added(ev: ConversationItemAddedEvent) -> None:
        item = ev.item

        if getattr(item, "type", None) != "message":
            return

        role = getattr(item, "role", "")
        if role not in ("assistant", "user"):
            return

        text_parts = [
            str(part)
            for part in getattr(item, "content", [])
            if isinstance(part, str) and part.strip()
        ]
        text = " ".join(text_parts).strip()

        if text:
            log.info("%s: %s", role.upper(), text)


def add_user_inactivity_event(ctx: JobContext, session: AgentSession) -> None:
    user_inactivity_task: asyncio.Task | None = None

    async def check_inactivity():
        try:
            await asyncio.sleep(4)

            for message in [
                "Sorry, I didn't get you.",
                "Hello, are you there? Can you hear me?",
                "I'm still here waiting for your response.",
            ]:
                await session.say(message, allow_interruptions=True)
                await asyncio.sleep(4)

            await session.say(
                "Since we didn't hear from you, we will end the call now. Have a great day.",
                allow_interruptions=False,
            )
            await asyncio.sleep(4)
            ctx.delete_room()

        except asyncio.CancelledError:
            log.info("user inactivity task cancelled")

    @session.on(event="user_state_changed")
    def user_state_changed(ev: UserStateChangedEvent) -> None:
        nonlocal user_inactivity_task

        log.info("user state changed: %s", ev.new_state)

        if ev.new_state == "away":
            if user_inactivity_task is None or user_inactivity_task.done():
                user_inactivity_task = asyncio.create_task(check_inactivity())
            return

        if user_inactivity_task is not None:
            user_inactivity_task.cancel()
            user_inactivity_task = None


def add_interview_timeout_event(ctx: JobContext, session: AgentSession) -> None:
    async def end_after_timeout() -> None:
        await asyncio.sleep(INTERVIEW_DURATION_SECONDS)
        await session.say(
            "Thank you for your time. We have reached the end of this interview. "
            "You can review your notes and practice again whenever you are ready.",
            allow_interruptions=False,
        )
        await asyncio.sleep(3)
        ctx.delete_room()

    asyncio.create_task(end_after_timeout())
