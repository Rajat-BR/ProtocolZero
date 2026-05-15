"""
classifier.py - Agent 1: Classifies the type of CI/CD failure.
Supported types: dependency_error, syntax_error, test_failure,
                 missing_env_var, import_error, unknown
"""

from llm import ask_llm

SUPPORTED_TYPES = [
    "dependency_error",
    "syntax_error",
    "test_failure",
    "missing_env_var",
    "import_error",
    "unknown",
]

CLASSIFIER_PROMPT = """
You are a CI/CD failure classifier. Analyze the following build/test log
and classify the failure into EXACTLY ONE of these categories:

- dependency_error    (e.g., pip install fails, package not found, version conflict)
- syntax_error        (e.g., SyntaxError, IndentationError, unexpected token)
- test_failure        (e.g., AssertionError, test cases failed, pytest/jest failures)
- missing_env_var     (e.g., KeyError on os.environ, undefined env variable)
- import_error        (e.g., ModuleNotFoundError, ImportError, cannot import name)
- unknown             (if the log doesn't match any category above)

Respond with ONLY the category name, nothing else. No explanation.

LOG:
{log}
"""


def classify_failure(log: str) -> str:
    """
    Returns one of the SUPPORTED_TYPES strings.
    """
    prompt = CLASSIFIER_PROMPT.format(log=log)
    result = ask_llm(prompt).strip().lower()

    # Safety: validate output is one of our known types
    for t in SUPPORTED_TYPES:
        if t in result:
            return t
    return "unknown"
