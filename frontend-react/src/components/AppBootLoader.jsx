import { useEffect, useState } from "react";

const phases = [
  "Initializing system",
  "Loading live network",
  "Preparing routing engine",
  "Rendering workspace",
];

export default function AppBootLoader({ ready = false }) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState(phases[0]);

  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % phases.length;
      setPhase(phases[index]);
    }, 700);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const timeout = setTimeout(() => {
      setVisible(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [ready]);

  if (!visible) return null;

  return (
    <div className={`boot-screen ${ready ? "fade-out" : ""}`}>
      <div className="boot-screen-inner">
        <div className="boot-logo-ring">
          <div className="boot-logo-core">SC</div>
        </div>

        <h1>Smart Cairo</h1>
        <p>{phase}</p>

        <div className="boot-loader-bar">
          <div className={`boot-loader-bar-fill ${ready ? "done" : ""}`} />
        </div>
      </div>
    </div>
  );
}