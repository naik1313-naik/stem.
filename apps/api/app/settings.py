from __future__ import annotations

import os
from pathlib import Path
from typing import Optional


def get_groq_api_key() -> Optional[str]:  # noqa: UP045
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        return api_key

    env_path = Path(__file__).resolve().parents[1] / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("GROQ_API_KEY="):
                value = line.split("=", 1)[1].strip().strip("\"'")
                return value or None
    return None