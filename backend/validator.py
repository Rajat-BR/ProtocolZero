"""
validator.py - Agent 4: Validates the diagnosis and assigns a confidence score.
Acts as a "second opinion" on the analysis pipeline output.
"""

from llm import ask_llm

VALIDATION_PROMPT = """
You are a CI/CD diagnosis reviewer. Your job is to validate whether
the diagnosis and fixes below are correct and useful.

Original Log:
{log}

Diagnosis:
- Failure Type: {failure_type}
- Root Cause: {root_cause}
- Suggested Fixes: {fixes}

Respond in this EXACT format (no extra text):
CONFIDENCE: <number between 0 and 100>
VERDICT: <one of: HIGH / MEDIUM / LOW>
NOTES: <one sentence summary of whether diagnosis looks correct>
"""


def validate_diagnosis(
    log: str, failure_type: str, root_cause: str, fixes: list[str]
) -> dict:
    """
    Returns a dict with confidence score, verdict, and notes.
    """
    fixes_text = "\n".join(f"- {f}" for f in fixes)
    prompt = VALIDATION_PROMPT.format(
        log=log,
        failure_type=failure_type,
        root_cause=root_cause,
        fixes=fixes_text,
    )

    raw = ask_llm(prompt)

    # Parse structured response
    result = {
        "confidence": 75,  # defaults
        "verdict": "MEDIUM",
        "notes": "Validation completed.",
    }

    for line in raw.strip().split("\n"):
        if line.startswith("CONFIDENCE:"):
            try:
                result["confidence"] = int(line.split(":")[1].strip())
            except ValueError:
                pass
        elif line.startswith("VERDICT:"):
            result["verdict"] = line.split(":")[1].strip()
        elif line.startswith("NOTES:"):
            result["notes"] = line.split(":", 1)[1].strip()

    return result
