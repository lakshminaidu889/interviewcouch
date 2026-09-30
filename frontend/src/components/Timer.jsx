import { useEffect, useState } from "react";

// Counts up from zero and restarts whenever `resetKey` changes.
export default function Timer({ resetKey, limit = 120 }) {
  const [sec, setSec] = useState(0);

  useEffect(() => {
    setSec(0);
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [resetKey]);

  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return <span className={`timer ${sec > limit ? "over" : ""}`}>{mm}:{ss}</span>;
}
