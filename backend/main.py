"""
main.py - FastAPI backend
Single LLM call returns full structured JSON.
4 sequential agent calls → 1 call
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import json
import re

from llm import ask_llm

app = FastAPI(title="CI/CD Failure Diagnosis API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Prompt ────────────────────────────────────────────────────────────────────
PROMPT = """You are a CI/CD failure diagnosis system. Analyze the log and return ONLY a JSON object.

FAILURE TYPES (pick exactly one):
dependency_error | syntax_error | test_failure | missing_env_var | import_error | unknown

LOG:
{log}

Respond with ONLY this JSON (no markdown, no explanation, no backticks):
{{
  "failure_type": "<one of the types above>",
  "root_cause": "<2 sentences max: what failed and why>",
  "fixes": ["<fix 1>", "<fix 2>", "<fix 3>"],
  "confidence": <integer 0-100>,
  "verdict": "<HIGH or MEDIUM or LOW>",
  "validation_notes": "<one sentence: is this diagnosis reliable?>"
}}"""

# ── Models ────────────────────────────────────────────────────────────────────
class LogInput(BaseModel):
    log: str

class DiagnosisResult(BaseModel):
    failure_type: str
    root_cause: str
    fixes: list[str]
    confidence: int
    verdict: str
    validation_notes: str
    processing_time_ms: int

# ── Helpers ───────────────────────────────────────────────────────────────────
def parse_llm_json(raw: str) -> dict:
    """Safely extract JSON from LLM response even if it adds extra text."""
    try:
        return json.loads(raw)
    except Exception:
        pass
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass
    return {
        "failure_type": "unknown",
        "root_cause": raw[:300] if raw else "Could not parse response.",
        "fixes": ["Check the raw log manually.", "Re-run the pipeline."],
        "confidence": 40,
        "verdict": "LOW",
        "validation_notes": "Parsing failed — raw response returned."
    }

# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/")
def health_check():
    return {"status": "ok", "message": "CI/CD Diagnosis API v1 running"}


@app.post("/analyze", response_model=DiagnosisResult)
def analyze_log(input: LogInput):
    log = input.log.strip()

    if not log:
        raise HTTPException(status_code=400, detail="Log cannot be empty.")
    if len(log) > 8000:
        log = log[:8000]  

    start = time.time()

    prompt = PROMPT.format(log=log)
    raw = ask_llm(prompt)
    result = parse_llm_json(raw)

    elapsed_ms = int((time.time() - start) * 1000)

    return DiagnosisResult(
        failure_type=result.get("failure_type", "unknown"),
        root_cause=result.get("root_cause", ""),
        fixes=result.get("fixes", []),
        confidence=result.get("confidence", 75),
        verdict=result.get("verdict", "MEDIUM"),
        validation_notes=result.get("validation_notes", ""),
        processing_time_ms=elapsed_ms,
    )