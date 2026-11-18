import { useEffect, useRef, useState } from "react";
import "./SubjectModuleFrame.css";

export type SubjectId = "physics" | "chemistry" | "mathematics" | "biology";

type SubjectModuleFrameProps = {
  subject: SubjectId;
  selectedClass: string;
  language: "en" | "hi";
  onProgress: (event: {
    subject: SubjectId;
    classId: string;
    activityId: string;
    type: "activity_opened" | "activity_completed" | "quiz_completed";
    score?: number;
  }) => void;
};

export default function SubjectModuleFrame({
  subject,
  selectedClass,
  language,
  onProgress,
}: SubjectModuleFrameProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const physicsUrl = `${import.meta.env.BASE_URL}subjects/${subject}/index.html`;
  const src = `${physicsUrl}?subject=${subject}&class=${encodeURIComponent(selectedClass)}&lang=${language}&v=1`;

  useEffect(() => {
    const send = () => frameRef.current?.contentWindow?.postMessage({
      protocol: "smartclass.subject",
      version: 1,
      type: "language_changed",
      subject,
      language,
      classId: selectedClass,
    }, window.location.origin);
    send();
  }, [subject, selectedClass, language]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.origin !== window.location.origin) return;
      const message = event.data;
      if (!message || typeof message !== "object") return;
      if (message.protocol !== "smartclass.subject" || message.version !== 1) return;
      if (message.subject !== subject) return;
      if (!["subject_ready", "activity_opened", "activity_completed", "quiz_completed"].includes(message.type)) return;
      if (typeof message.classId !== "string" || !["6", "7", "8"].includes(message.classId)) return;
      if (typeof message.activityId !== "string" || message.activityId.length > 100) return;
      if (message.type === "quiz_completed" &&
          (typeof message.score !== "number" || message.score < 0 || message.score > 100)) return;
      onProgress({
        subject,
        classId: message.classId,
        activityId: message.activityId,
        type: message.type,
        score: message.type === "quiz_completed" ? message.score : undefined,
      });
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [subject, onProgress]);

  return (
    <main className="subject-module-host">
      {loadFailed ? (
        <section className="subject-module-host__error" role="alert">
          <h2>Subject lab could not be loaded</h2>
          <p>Reload the subject lab or choose another class.</p>
          <button type="button" onClick={() => setLoadFailed(false)}>Retry</button>
        </section>
      ) : (
        <iframe
          ref={frameRef}
          key={src}
          className="subject-module-host__frame"
          src={src}
          title={`${subject} virtual lab for Classes 6 to 8`}
          loading="eager"
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          onError={() => setLoadFailed(true)}
          onLoad={() => frameRef.current?.contentWindow?.postMessage({
            protocol: "smartclass.subject",
            version: 1,
            type: "language_changed",
            subject,
            language,
            classId: selectedClass,
          }, window.location.origin)}
        />
      )}
    </main>
  );
}
