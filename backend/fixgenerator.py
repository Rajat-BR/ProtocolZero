"""
fixgenerator.py - Agent 3: Generates step-by-step fix suggestions.
Returns a list of actionable fixes based on root cause.
"""

from llm import ask_llm

FIX_PROMPT = """
You are a CI/CD repair specialist. Given the following failure details,
generate a numbered list of CONCRETE, ACTIONABLE fix steps.

Failure Type: {failure_type}
Root Cause: {root_cause}

Log:
{log}

Rules:
- Give 2 to 4 fix steps maximum (keep it focused)
- Each step should be a concrete command or file change
- If a command is needed, show the exact command
- Start each step with a number: 1., 2., 3., ...
- Do NOT explain things the dev already knows — be direct
"""


def generate_fixes(log: str, failure_type: str, root_cause: str) -> list[str]:
    """
    Returns a list of fix suggestion strings.
    """
    prompt = FIX_PROMPT.format(
        log=log, failure_type=failure_type, root_cause=root_cause
    )
    raw = ask_llm(prompt)

    # Parse numbered list into Python list
    lines = raw.strip().split("\n")
    fixes = []
    for line in lines:
        line = line.strip()
        if line and (line[0].isdigit() or line.startswith("-")):
            # Remove leading "1. " or "- "
            clean = line.lstrip("0123456789.-) ").strip()
            if clean:
                fixes.append(clean)

    # Fallback if parsing fails
    if not fixes:
        fixes = [raw.strip()]

    return fixes
