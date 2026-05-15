"""
llm.py - ONE reusable LLM wrapper for all agents.
Provider: OpenRouter
Swap model name below and all agents update automatically.
"""

from dotenv import load_dotenv
import os
import requests

# Load environment variables
load_dotenv()

# Read API key from .env
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Free model on OpenRouter
MODEL = "nvidia/nemotron-3-super-120b-a12b:free"


def ask_llm(prompt: str) -> str:
    """
    Universal LLM caller. All agents use this.
    Returns plain text response.
    """

    try:
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
            },
        )

        response.raise_for_status()

        return response.json()["choices"][0]["message"]["content"].strip()

    except Exception as e:
        return f"LLM_ERROR: {str(e)}"