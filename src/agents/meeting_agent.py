from livekit.agents import Agent

from prompts.interview_prompt import get_prompt


class MeetingAgent(Agent):
    def __init__(self, interview_context: dict | None = None) -> None:
        self.interview_context = interview_context or {}
        super().__init__(
            instructions=get_prompt(self.interview_context),
            turn_detection="vad",
            allow_interruptions=True,
        )

    async def on_enter(self) -> None:
        interview = self.interview_context.get("interview", {})
        selected_question = self.interview_context.get("selected_question")

        if selected_question and interview.get("type") == "dsa":
            company = interview.get("company", "your selected company")
            difficulty = interview.get("difficulty", "selected")
            await self.session.say(
                text=f"Hi, I am Aisha. We will practice a {difficulty} DSA interview for {company}. Is this a good time to start?",
                allow_interruptions=True,
            )
            return

        await self.session.say(
            text="Hi, I am Aisha. What would you like to practice today?",
            allow_interruptions=True,
        )
