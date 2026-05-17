from livekit.agents import AgentSession, JobContext, RoomInputOptions
from livekit.plugins import noise_cancellation

from agents.meeting_agent import MeetingAgent


class AgentService:
    def create_session(self, ctx: JobContext) -> AgentSession:
        return AgentSession(
            stt=ctx.proc.userdata["stt"],
            llm=ctx.proc.userdata["llm"],
            tts=ctx.proc.userdata["tts"],
            vad=ctx.proc.userdata["vad"],
            user_away_timeout=10.0,
        )

    async def start_session(self, ctx: JobContext, session: AgentSession) -> None:
        await session.start(
            agent=MeetingAgent(),
            room=ctx.room,
            room_input_options=RoomInputOptions(
                noise_cancellation=noise_cancellation.BVC(),
                close_on_disconnect=True,
                delete_room_on_close=True,
            ),
        )


agent_service = AgentService()
