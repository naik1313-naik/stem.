from __future__ import annotations

import json
import urllib.error
import urllib.request

from app.settings import get_gemini_api_key

FALLBACKS = {
    "physics": "Physics: change one thing at a time, observe what changes, and explain the cause. Use the model’s measurements and the safety notice rather than treating the simulation as a real experiment.",
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


def tutor_answer(payload) -> tuple[str, bool]:
    api_key = get_gemini_api_key()
    if not api_key:
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
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return text.strip(), True
    except (urllib.error.URLError, json.JSONDecodeError, KeyError, IndexError, TimeoutError):
        return scripted_answer(payload.subject, payload.language, payload.topic), False
