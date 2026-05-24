from prompts.prompt_utils import common_voice_rules, interview_context_block, list_value, text_value


def build_dsa_prompt(interview_context: dict) -> str:
    selected_question = interview_context.get("selected_question") or {}

    return f"""
{common_voice_rules(interview_context)}
{interview_context_block(interview_context)}
{_selected_question_block(selected_question, interview_context)}

#### DSA INTERVIEW BEHAVIOR ####

- Run this like a real coding interview.
- Use only the selected DSA question provided in the interview context.
- Do not invent, replace, rename, or simplify the main DSA question.
- First, present the selected problem clearly in spoken form.
- Ask the candidate to explain their understanding before jumping into code.
- Guide the discussion through brute force, optimized approach, complexity, edge cases, and implementation details.
- Expect the candidate to reason out loud.
- If the candidate starts coding too early, ask for the approach first.
- If the solution is incorrect, ask a small diagnostic question instead of directly giving the answer.
- For Easy questions, focus on correctness and basic complexity.
- For Medium questions, expect tradeoffs, edge cases, and clean implementation.
- For Hard questions, expect deeper optimization, proof of correctness, and careful complexity analysis.
- For SDE 1, prioritize fundamentals, clarity, and implementation.
- For SDE 2 and Senior, ask more about tradeoffs, scalability of the approach, and production-quality edge cases.
"""


def _selected_question_block(selected_question: dict, interview_context: dict) -> str:
    interview = interview_context.get("interview", {})

    if not selected_question:
        return """
#### MISSING DSA QUESTION ####

- No exact DSA question was provided in metadata.
- Do not generate a new DSA question yourself.
- Politely say there is no selected question available for this session.
- Ask the candidate to restart after selecting a valid company, level, and difficulty.
"""

    return f"""
#### SELECTED DSA QUESTION ####

- Use this selected question as the main interview question.
- Do not generate a different question.
- Do not change the title, statement, constraints, examples, or expected complexity.
- Target company: {text_value(interview.get("company"))}.
- Target level: {text_value(interview.get("level"))}.
- Difficulty: {text_value(selected_question.get("difficulty") or interview.get("difficulty"))}.
- Topics: {list_value(selected_question.get("topics"))}.
- Question title: {text_value(selected_question.get("title"))}.
- Question statement: {text_value(selected_question.get("question"))}.
- Constraints: {list_value(selected_question.get("constraints"))}.
- Expected approach for your internal guidance: {text_value(selected_question.get("expected_approach"))}.
- Expected time complexity: {text_value(selected_question.get("time_complexity"))}.
- Expected space complexity: {text_value(selected_question.get("space_complexity"))}.
- Do not reveal the expected approach unless the candidate asks for a hint or gets stuck.
- Do not read every constraint mechanically. Mention only what is useful for the conversation.
"""
