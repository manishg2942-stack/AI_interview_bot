import asyncio
import logging

from livekit.agents import (
    AgentSession,
    ConversationItemAddedEvent,
    JobContext,
    UserInputTranscribedEvent,
    UserStateChangedEvent,
)


log = logging.getLogger("agent_events")


def add_agent_session_events(ctx: JobContext, session: AgentSession) -> None:
    add_transcript_logging(session)
    add_user_inactivity_event(ctx, session)


def add_transcript_logging(session: AgentSession) -> None:
    @session.on(event="user_input_transcribed")
    def user_input_transcribed(ev: UserInputTranscribedEvent) -> None:
        if ev.is_final and ev.transcript.strip():
            log.info("USER: %s", ev.transcript.strip())

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
            await asyncio.sleep(15)

            for message in [
                "Sorry, I didn't get you.",
                "Hello, are you there? Can you hear me?",
                "I'm still here waiting for your response.",
            ]:
                await session.say(message, allow_interruptions=True)
                await asyncio.sleep(10)

            await session.say(
                "Since we didn't hear from you, we will end the call now. Have a great day.",
                allow_interruptions=False,
            )
            await asyncio.sleep(2)
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
