from prompts.prompt_utils import common_voice_rules, interview_context_block


def build_general_prompt(interview_context: dict) -> str:
    return f"""
{common_voice_rules(interview_context)}
{interview_context_block(interview_context)}

#### GENERAL INTERVIEW BEHAVIOR ####

- Use the selected interview type, company, level, and difficulty as guidance.
- Ask practical software engineering questions.
- Prefer project-based, debugging, API, database, system design, and communication questions.
- Keep the discussion focused and adapt based on the candidate's answers.
- If the selected type is unclear, ask one short clarification question and then continue.
"""
