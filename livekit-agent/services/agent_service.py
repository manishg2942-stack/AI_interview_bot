from livekit.agents import AgentSession, JobContext, RoomInputOptions

from agents.meeting_agent import MeetingAgent


class AgentService:
    def create_session(self, ctx: JobContext) -> AgentSession:
        return AgentSession(
            stt=ctx.proc.userdata["stt"],
            llm=ctx.proc.userdata["llm"],
            tts=ctx.proc.userdata["tts"],
            turn_detection=None,
            vad=ctx.proc.userdata["vad"],
            user_away_timeout=10.0,
        )

    async def start_session(
        self,
        ctx: JobContext,
        session: AgentSession,
        interview_context: dict | None = None,
    ) -> None:
        await session.start(
            agent=MeetingAgent(interview_context=interview_context),
            room=ctx.room,
            room_input_options=RoomInputOptions(
                close_on_disconnect=True,
                delete_room_on_close=True,
            ),
        )


agent_service = AgentService()
