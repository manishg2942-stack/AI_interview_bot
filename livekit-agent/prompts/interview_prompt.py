from prompts.behavioral_prompt import build_behavioral_prompt
from prompts.dsa_prompt import build_dsa_prompt
from prompts.general_prompt import build_general_prompt
from prompts.hld_prompt import build_hld_prompt
from prompts.lld_prompt import build_lld_prompt


PROMPT_BUILDERS = {
    "behavioral": build_behavioral_prompt,
    "dsa": build_dsa_prompt,
    "hld": build_hld_prompt,
    "lld": build_lld_prompt,
    "llld": build_lld_prompt,
    "low-level-design": build_lld_prompt,
    "low_level_design": build_lld_prompt,
    "system-design": build_hld_prompt,
    "system_design": build_hld_prompt,
}


def get_prompt(interview_context: dict | None = None) -> str:
    context = interview_context or {}
    interview = context.get("interview", {})
    interview_type = str(interview.get("type", "")).strip().lower().replace(" ", "-")
    prompt_builder = PROMPT_BUILDERS.get(interview_type, build_general_prompt)
    return prompt_builder(context)
