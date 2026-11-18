from fastapi import APIRouter

from app.api.tutor_schemas import TutorRequest
from app.services.tutor import tutor_answer

router = APIRouter()


@router.post("/tutor")
def answer_tutor(request: TutorRequest) -> dict:
    answer, ai_used = tutor_answer(request)
    return {
        "answer": answer,
        "ai_used": ai_used,
        "subject": request.subject,
        "class_id": request.class_id,
        "language": request.language,
    }
