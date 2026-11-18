from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request

from app.settings import get_gemini_api_key

logger = logging.getLogger(__name__)

FALLBACKS = {
    "physics": "Physics: change one thing at a time, observe what changes, and explain the cause. Use the model's measurements and the safety notice rather than treating the simulation as a real experiment.",
    "chemistry": "Chemistry: make a prediction, change one virtual setting, and compare the observation with the prediction. Never taste or mix real chemicals; this lab uses safe conceptual models.",
    "mathematics": "Mathematics: use the live model, substitute the shown values, and check whether the result follows the rule. Estimate first, calculate next, then explain your answer.",
    "biology": "Biology: observe the selected structure or process, connect form to function, and explain how the parts interact. Use respectful, age-appropriate biological language.",
}


def scripted_answer(subject: str, language: str, topic: str | None) -> str:
    base = FALLBACKS.get(subject, FALLBACKS["physics"])
    if language == "hi":
        hindi = {
            "physics": "भौतिक विज्ञान में एक बार में केवल एक चीज़ बदलें, परिणाम देखें और कारण समझाएँ। मॉडल को वास्तविक प्रयोग न मानें।",
            "chemistry": "रसायन विज्ञान में पहले अनुमान लगाएँ, फिर वर्चुअल सेटिंग बदलें और परिणाम की तुलना करें। वास्तविक रसायन न छुएँ या न मिलाएँ।",
            "mathematics": "गणित में पहले अनुमान लगाएँ, दिखाए गए मान डालें और नियम से उत्तर जाँचें।",
            "biology": "जीव विज्ञान में संरचना और उसके कार्य के संबंध को देखें। जीवों और प्रक्रियाओं के बारे में सम्मानजनक और सुरक्षित ढंग से समझाएँ।",
        }
        base = hindi.get(subject, base)
    if topic:
        base = f"{topic}: {base}"
    return base


class TutorError(Exception):
    """Custom exception for tutor errors with status tracking."""
    def __init__(self, message: str, error_type: str, fallback_used: bool = True):
        super().__init__(message)
        self.error_type = error_type
        self.fallback_used = fallback_used


def tutor_answer(payload) -> tuple[str, bool]:
    api_key = get_gemini_api_key()
    if not api_key:
        logger.warning("GEMINI_API_KEY not configured, using scripted fallback")
        return scripted_answer(payload.subject, payload.language, payload.topic), False

    subject_name = payload.subject.title()
    prompt = (
        f"You are Spark, a school-level {subject_name} tutor for Class {payload.class_id}. "
        f"Answer in {'Hindi' if payload.language == 'hi' else 'English'} only. "
        "Explain reasoning briefly, avoid unsafe experiments, and do not change simulation state or quiz answers. "
        f"Topic: {payload.topic or 'general'}\n"
        f"Activity: {payload.activity_id or 'general'}\n"
        f"Context: {payload.context or 'not provided'}\n"
        f"Student question: {payload.question}"
    )
    body = json.dumps({
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 500},
    }).encode("utf-8")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={api_key}"
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            if response.status != 200:
                raise TutorError(f"Gemini API returned status {response.status}", "api_error")
            data = json.loads(response.read().decode("utf-8"))
        # Validate response structure
        if not data.get("candidates") or not data["candidates"][0].get("content", {}).get("parts"):
            raise TutorError("Invalid response structure from Gemini API", "api_error")
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        # Decode any HTML entities that might have been encoded
        text = text.replace("&", "&").replace("<", "<").replace(">", ">").replace(chr(34)*3, "\"").replace("'", "'").replace("&#xA0;", " ").replace("&#x43;", "C")
        return text.strip(), True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="ignore")
        logger.error(f"Gemini API HTTP error {e.code}: {error_body}")
        if e.code == 400:
            raise TutorError("Invalid request to Gemini API (check API key and model)", "invalid_request")
        elif e.code == 401:
            raise TutorError("Invalid Gemini API key", "invalid_api_key")
        elif e.code == 403:
            raise TutorError("Gemini API access forbidden (check API key permissions)", "forbidden")
        elif e.code == 429:
            raise TutorError("Gemini API rate limit exceeded", "rate_limit")
        elif e.code >= 500:
            raise TutorError("Gemini API server error", "server_error")
        else:
            raise TutorError(f"Gemini API error: {e.code}", "api_error")
    except urllib.error.URLError as e:
        logger.error(f"Gemini API network error: {e}")
        raise TutorError("Cannot reach Gemini API (network error)", "network_error")
    except json.JSONDecodeError as e:
        logger.error(f"Gemini API JSON decode error: {e}")
        raise TutorError("Invalid JSON response from Gemini API", "api_error")
    except TimeoutError:
        logger.error("Gemini API request timeout")
        raise TutorError("Gemini API request timed out", "timeout")
    except TutorError:
        raise
    except BaseException as e:  # noqa: BLE001 - catch-all for unexpected errors
        logger.error(f"Unexpected error calling Gemini API: {e}")
        raise TutorError(f"Unexpected error: {e}", "unknown")


def tutor_answer_with_fallback(payload) -> tuple[str, bool, str | None]:
    """
    Call tutor_answer with proper error handling and fallback.
    Returns: (answer, ai_used, error_type)
    error_type is None on success, or the error type string on failure.
    """
    try:
        answer, ai_used = tutor_answer(payload)
        return answer, ai_used, None
    except TutorError as e:
        logger.warning(f"Gemini API failed ({e.error_type}), using scripted fallback: {e}")
        fallback = scripted_answer(payload.subject, payload.language, payload.topic)
        return fallback, False, e.error_type
