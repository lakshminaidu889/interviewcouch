import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import Feedback from "../components/Feedback";
import Timer from "../components/Timer";
import { useSpeech } from "../hooks/useSpeech";

export default function Interview() {
  const { id } = useParams();
  const nav = useNavigate();
  const wsRef = useRef(null);

  const [iv, setIv] = useState(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(null);
  const [answered, setAnswered] = useState({});
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  const speech = useSpeech((phrase) => setAnswer((a) => (a ? `${a} ${phrase}` : phrase)));

  // Load the interview and jump to the first unanswered question.
  useEffect(() => {
    api(`/api/interviews/${id}`)
      .then((data) => {
        if (data.status === "completed") return nav(`/result/${id}`, { replace: true });
        setIv(data);
        setAnswered(Object.fromEntries(data.answers.map((a) => [a.question_index, true])));
        const next = data.questions.findIndex((_, i) => !data.answers.some((a) => a.question_index === i));
        setIdx(next === -1 ? data.questions.length - 1 : next);
      })
      .catch((e) => setError(e.message));
  }, [id, nav]);

  // WebSocket for streaming feedback.
  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const token = localStorage.getItem("token");
    const ws = new WebSocket(`${proto}://${window.location.host}/ws/interviews/${id}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "token") {
        setFeedback((f) => f + msg.text);
      } else if (msg.type === "done") {
        setFeedback(msg.feedback);
        setScore(msg.score);
        setAnswered((a) => ({ ...a, [msg.question_index]: true }));
        setBusy(false);
      } else if (msg.type === "error") {
        setError(msg.message);
        setBusy(false);
      }
    };
    return () => ws.close();
  }, [id]);

  const submit = () => {
    if (speech.listening) speech.stop();
    setError("");
    setFeedback("");
    setScore(null);
    setBusy(true);
    wsRef.current.send(JSON.stringify({ type: "answer", question_index: idx, answer }));
  };

  const next = () => {
    setIdx((i) => i + 1);
    setAnswer("");
    setFeedback("");
    setScore(null);
  };

  const finish = async () => {
    try {
      await api(`/api/interviews/${id}/complete`, { method: "POST" });
      nav(`/result/${id}`);
    } catch (e) {
      setError(e.message);
    }
  };

  if (!iv) return <p className="muted">{error || "Loading interview…"}</p>;

  const isLast = idx === iv.questions.length - 1;
  const hasFeedback = feedback.length > 0;

  return (
    <div className="stack-lg">
      <div className="row">
        <span className="muted grow">
          {iv.role} · Question {idx + 1} of {iv.questions.length}
        </span>
        <Timer resetKey={idx} />
        <span className={`dot ${connected ? "on" : ""}`} title={connected ? "Connected" : "Reconnecting…"} />
      </div>

      <h1 className="question">{iv.questions[idx]}</h1>

      <section className="card stack">
        <textarea
          rows={7}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer, or press the microphone and speak it."
          disabled={busy}
        />
        {speech.listening && (
          <p className="transcript">Listening… {speech.interim}</p>
        )}
        <div className="row wrap">
          {speech.supported && (
            <button className="ghost" onClick={speech.listening ? speech.stop : speech.start} disabled={busy}>
              {speech.listening ? "Stop recording" : "Record answer"}
            </button>
          )}
          <span className="grow" />
          <button onClick={submit} disabled={busy || !connected || answer.trim().length < 3}>
            {busy ? "Coach is writing…" : "Get feedback"}
          </button>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      {hasFeedback && (
        <section className="card stack">
          <div className="row">
            <h2 className="grow">Coach feedback</h2>
            {score !== null && <span className="score-pill big">{score}/10</span>}
          </div>
          <Feedback text={feedback} />
        </section>
      )}

      <div className="row">
        <span className="grow" />
        {!isLast && (
          <button onClick={next} disabled={!answered[idx] || busy}>Next question</button>
        )}
        <button
          className={isLast ? "" : "ghost"}
          onClick={finish}
          disabled={busy || Object.keys(answered).length === 0}
        >
          Finish interview
        </button>
      </div>
    </div>
  );
}
