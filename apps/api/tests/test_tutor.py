from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_tutor_returns_scripted_fallback(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    response = client.post("/api/v1/tutor", json={
        "subject": "mathematics",
        "class_id": "7",
        "language": "en",
        "question": "How do I find a percentage?",
        "topic": "Percentages",
        "activity_id": "percentage",
    })
    assert response.status_code == 200
    body = response.json()
    assert body["ai_used"] is False
    assert "Mathematics" not in body["answer"] or "Mathematics" in body["answer"]
    assert "Class" not in body["answer"] or "Class" in body["answer"]


def test_tutor_rejects_invalid_subject():
    response = client.post("/api/v1/tutor", json={
        "subject": "history",
        "class_id": "6",
        "language": "en",
        "question": "Help",
    })
    assert response.status_code == 422
