from fastapi import APIRouter

from app.api.tutor_schemas import TutorRequest
from app.services.tutor import tutor_answer_with_fallback

router = APIRouter()


@router.post("/tutor")
def answer_tutor(request: TutorRequest) -> dict:
    answer, ai_used, error_type = tutor_answer_with_fallback(request)
    return {
        "answer": answer,
        "ai_used": ai_used,
        "error_type": error_type,
        "subject": request.subject,
        "class_id": request.class_id,
        "language": request.language,
    }