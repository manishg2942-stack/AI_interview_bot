from livekit.agents import Agent

from prompts.interview_prompt import get_prompt


class MeetingAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=get_prompt(),
            turn_detection="vad",
            allow_interruptions=True,
        )

    async def on_enter(self) -> None:
        await self.session.say(
            text="Hi, I am Aisha. What would you like to practice today?",
            allow_interruptions=True,
        )
