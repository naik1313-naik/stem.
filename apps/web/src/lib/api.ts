export type TutorResponse = {
  answer: string;
  ai_used: boolean;
  subject: string;
  class_id: string;
  language: "en" | "hi";
};

export async function askTutor(payload: {
  subject: "physics" | "chemistry" | "mathematics" | "biology";
  class_id: string;
  language: "en" | "hi";
  question: string;
  topic?: string;
  activity_id?: string;
  context?: string;
}): Promise<TutorResponse> {
  const base = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
  const response = await fetch(`${base}/api/v1/tutor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Tutor request failed with status ${response.status}`);
  return await response.json() as TutorResponse;
}
