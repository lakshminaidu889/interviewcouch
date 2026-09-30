import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../api";
import Feedback from "../components/Feedback";

export default function Result() {
  const { id } = useParams();
  const [iv, setIv] = useState(null);
  const [error, setError] = useState("");

  // The written summary is generated in a background task, so poll briefly for it.
  useEffect(() => {
    let tries = 0;
    let timer;
    const load = async () => {
      try {
        const data = await api(`/api/interviews/${id}`);
        setIv(data);
        if (!data.summary && tries++ < 10) timer = setTimeout(load, 2000);
      } catch (e) {
        setError(e.message);
      }
    };
    load();
    return () => clearTimeout(timer);
  }, [id]);

  if (!iv) return <p className="muted">{error || "Loading results…"}</p>;

  const bars = iv.answers.map((a) => ({ name: `Q${a.question_index + 1}`, score: a.score }));

  return (
    <div className="stack-lg">
      <section className="card row wrap">
        <div className="grow">
          <h1>{iv.role}</h1>
          <p className="muted">{new Date(iv.created_at).toLocaleString()}</p>
        </div>
        <span className="score-pill big">{iv.overall_score}/10</span>
      </section>

      <section className="card">
        <h2>Summary</h2>
        <p>{iv.summary || "Writing your summary…"}</p>
      </section>

      <section className="card">
        <h2>Score by question</h2>
        <div style={{ height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={bars} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9dee7" />
              <XAxis dataKey="name" stroke="#5b6678" />
              <YAxis domain={[0, 10]} stroke="#5b6678" />
              <Tooltip />
              <Bar dataKey="score" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {iv.answers.map((a) => (
        <section key={a.question_index} className="card stack">
          <div className="row">
            <h3 className="grow serif">{a.question}</h3>
            <span className="score-pill">{a.score}/10</span>
          </div>
          <p className="your-answer">{a.answer_text}</p>
          <Feedback text={a.feedback} />
        </section>
      ))}

      <div className="row">
        <Link to="/">Back to dashboard</Link>
      </div>
    </div>
  );
}
