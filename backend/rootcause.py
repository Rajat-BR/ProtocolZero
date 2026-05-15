"""
rootcause.py - Agent 2: Identifies the root cause of the failure.
Uses the classified failure type to provide a more focused analysis.
"""

from llm import ask_llm

ROOT_CAUSE_PROMPT = """
You are a senior DevOps engineer analyzing a CI/CD pipeline failure.

The failure has been classified as: {failure_type}

Analyze the following log and identify the ROOT CAUSE in 2-3 sentences.
Be specific — mention the exact error, the file/line if visible, and WHY it failed.
Do NOT suggest fixes yet. Only explain what caused the failure.

LOG:
{log}
"""


def analyze_root_cause(log: str, failure_type: str) -> str:
    """
    Returns a short human-readable root cause explanation.
    """
    prompt = ROOT_CAUSE_PROMPT.format(log=log, failure_type=failure_type)
    return ask_llm(prompt)
