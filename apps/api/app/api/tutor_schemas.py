from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class TutorRequest(BaseModel):
    subject: str = Field(pattern=r"^(physics|chemistry|mathematics|biology)$")
    class_id: str = Field(pattern=r"^[678]$")
    language: str = Field(pattern=r"^(en|hi)$")
    question: str = Field(min_length=1, max_length=800)
    topic: Optional[str] = Field(default=None, max_length=160)  # noqa: UP045
    activity_id: Optional[str] = Field(default=None, max_length=160)  # noqa: UP045
    context: Optional[str] = Field(default=None, max_length=1200)  # noqa: UP045
