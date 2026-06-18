from livekit.agents import Agent

from prompts.interview_prompt import get_prompt
from prompts.prompt_utils import select_interviewer_name, text_value


class MeetingAgent(Agent):
    def __init__(self, interview_context: dict | None = None) -> None:
        self.interview_context = dict(interview_context or {})
        self.interviewer_name = self.interview_context.get("interviewer_name") or select_interviewer_name()
        self.interview_context["interviewer_name"] = self.interviewer_name
        super().__init__(
            instructions=get_prompt(self.interview_context),
            turn_detection="vad",
            allow_interruptions=True,
        )

    async def on_enter(self) -> None:
        interview = self.interview_context.get("interview", {})
        interview_type = text_value(interview.get("type"), "practice").upper()
        company = text_value(interview.get("company"), "your selected company")
        level = text_value(interview.get("level"), "your selected level")
        difficulty = text_value(interview.get("difficulty"), "selected")
        design_question = text_value(interview.get("design_question"), "")

        if interview_type in ("LLD", "HLD") and design_question:
            await self.session.say(
                text=(
                    f"Hi, I am {self.interviewer_name}. We will do a {difficulty} "
                    f"{interview_type} practice interview for {company}, {level}. "
                    f"The selected problem is {design_question}. Let's start with the requirements."
                ),
                allow_interruptions=True,
            )
            return

        await self.session.say(
            text=(
                f"Hi, I am {self.interviewer_name}. i will be conducting interview"
                
                "Let's begin with the first question."
            ),
            allow_interruptions=True,
        )
