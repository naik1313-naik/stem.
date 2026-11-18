import { useEffect, useRef, useState } from "react";
import "./PhysicsModuleFrame.css";
import type { copy } from "../content/translations";

type PhysicsModuleFrameProps = {
  selectedClass: string;
  t: Pick<typeof copy.en, "physicsLoadError" | "physicsLoadErrorBody" | "retry">;
};

/**
 * Hosts the teammate's self-contained Physics Virtual Lab inside SmartClass Buddy.
 * The lab stays isolated in an iframe so its global CSS, DOM IDs and Canvas code
 * cannot collide with the React application.
 */
export default function PhysicsModuleFrame({
  selectedClass,
  t,
}: PhysicsModuleFrameProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const physicsUrl = `${import.meta.env.BASE_URL}physics/index.html?class=${encodeURIComponent(selectedClass)}`;

  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage(
      { type: "SCB_SELECT_PHYSICS_CLASS", classId: selectedClass },
      window.location.origin,
    );
  }, [selectedClass]);

  return (
    <main className="physics-module-host">
      {loadFailed ? (
        <section className="physics-module-host__error" role="alert">
          <h2>{t.physicsLoadError}</h2>
          <p>{t.physicsLoadErrorBody}</p>
          <button type="button" onClick={() => setLoadFailed(false)}>{t.retry}</button>
        </section>
      ) : (
        <iframe
          ref={frameRef}
          className="physics-module-host__frame"
          src={physicsUrl}
          title="Physics Virtual Lab for Classes 6 to 8"
          loading="eager"
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          onLoad={() => frameRef.current?.contentWindow?.postMessage(
            { type: "SCB_SELECT_PHYSICS_CLASS", classId: selectedClass },
            window.location.origin,
          )}
          onError={() => setLoadFailed(true)}
        />
      )}
    </main>
  );
}
