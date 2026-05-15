# sample_logs.py
# Sample CI/CD Logs for Testing
# Use any of these in the frontend to test each agent path

# ─────────────────────────────────────
# 1. DEPENDENCY ERROR
# ─────────────────────────────────────

DEPENDENCY_LOG = """
Step 3/10 : RUN pip install -r requirements.txt
 ---> Running in a3f2b9c1d4e5

Collecting flask==2.0.1
  Downloading Flask-2.0.1-py3-none-any.whl (95 kB)

Collecting Werkzeug>=2.0 (from flask==2.0.1)
  Downloading Werkzeug-3.0.2-py3-none-any.whl (226 kB)

ERROR: pip's dependency resolver does not currently take into account all the packages
that are installed. This behaviour is the source of the following dependency conflicts.

flask 2.0.1 requires Werkzeug<2.1.0,>=2.0.0,
but you have Werkzeug 3.0.2 which is incompatible.

ERROR: Could not install packages due to an OSError.

The command '/bin/sh -c pip install -r requirements.txt'
returned a non-zero code: 1
"""


# ─────────────────────────────────────
# 2. SYNTAX ERROR
# ─────────────────────────────────────

SYNTAX_LOG = """
File "app/routes.py", line 47
    def get_user(user_id)
                         ^

SyntaxError: expected ':'

Error: Process completed with exit code 1.

##[error] Python syntax check failed.
Run failed: ci-lint (python-check) after 3s
"""


# ─────────────────────────────────────
# 3. FAILED TESTS
# ─────────────────────────────────────

TEST_FAILURE_LOG = """
============================= test session starts =============================

platform linux -- Python 3.11.4, pytest-7.4.0, pluggy-1.2.0

collected 24 items

tests/test_auth.py::test_login_valid PASSED
tests/test_auth.py::test_login_invalid PASSED
tests/test_payment.py::test_charge_success PASSED
tests/test_payment.py::test_refund FAILED
tests/test_payment.py::test_partial_refund FAILED

================================== FAILURES ==================================

_________________ test_refund _________________

def test_refund():
    result = payment.process_refund(order_id="ORD-001", amount=50.0)

>   assert result["status"] == "refunded"

E   AssertionError: assert 'pending' == 'refunded'

E   + where 'pending' = {'status': 'pending', 'amount': 50.0}['status']

FAILED tests/test_payment.py::test_refund
FAILED tests/test_payment.py::test_partial_refund

AssertionError: assert 0 == 150.0

2 failed, 22 passed in 4.32s
"""


# ─────────────────────────────────────
# 4. MISSING ENVIRONMENT VARIABLE
# ─────────────────────────────────────

ENV_VAR_LOG = """
> Executing task: start server

Starting application...
Loading configuration from environment...

Traceback (most recent call last):

  File "server.py", line 12, in <module>

    DB_URL = os.environ["DATABASE_URL"]

KeyError: 'DATABASE_URL'

Error: Process completed with exit code 1.

##[error] Server failed to start.
Missing required environment variables.
"""


# ─────────────────────────────────────
# 5. IMPORT / MODULE ERROR
# ─────────────────────────────────────

IMPORT_LOG = """
Run #142 ▸ python main.py

Traceback (most recent call last):

  File "main.py", line 3, in <module>

    from services.email_sender import send_welcome_email

  File "/app/services/email_sender.py", line 7, in <module>

    import sendgrid

ModuleNotFoundError: No module named 'sendgrid'

##[error] Exited with code 1

Job failed: build_and_test
Duration: 0m 4s
"""