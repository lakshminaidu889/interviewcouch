import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api } from "../api";

export default function Dashboard() {
  const nav = useNavigate();
  const [roles, setRoles] = useState([]);
  const [role, setRole] = useState("");
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/roles").then((r) => {
      setRoles(r);
      setRole(r[0]);
    }).catch((e) => setError(e.message));
    api("/api/interviews").then(setItems).catch((e) => setError(e.message));
  }, []);

  const start = async () => {
    try {
      const iv = await api("/api/interviews", { method: "POST", body: { role } });
      nav(`/interview/${iv.id}`);
    } catch (e) {
      setError(e.message);
    }
  };

  const completed = items.filter((i) => i.status === "completed").reverse();
  const chart = completed.map((i) => ({
    date: new Date(i.created_at).toLocaleDateString(),
    score: i.overall_score,
  }));
  const average = completed.length
    ? (completed.reduce((s, i) => s + i.overall_score, 0) / completed.length).toFixed(1)
    : null;

  return (
    <div className="stack-lg">
      <section className="card row wrap">
        <div className="grow">
          <h2>Start a mock interview</h2>
          <p className="muted">Five questions, feedback after each answer.</p>
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          {roles.map((r) => <option key={r}>{r}</option>)}
        </select>
        <button onClick={start} disabled={!role}>Begin interview</button>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="card">
        <div className="row">
          <h2 className="grow">Your progress</h2>
          {average && <span className="muted">Average {average}/10 over {completed.length} interviews</span>}
        </div>
        {chart.length ? (
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={chart} margin={{ top: 16, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9dee7" />
                <XAxis dataKey="date" stroke="#5b6678" />
                <YAxis domain={[0, 10]} stroke="#5b6678" />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="muted">Finish your first interview and your scores will chart here.</p>
        )}
      </section>

      <section className="card">
        <h2>Past interviews</h2>
        {items.length === 0 && <p className="muted">Nothing yet. Pick a role above to begin.</p>}
        <ul className="list">
          {items.map((i) => (
            <li key={i.id} className="row">
              <span className="grow">{i.role}</span>
              <span className="muted">{new Date(i.created_at).toLocaleDateString()}</span>
              <span className="score-pill">{i.status === "completed" ? `${i.overall_score}/10` : "In progress"}</span>
              <Link to={i.status === "completed" ? `/result/${i.id}` : `/interview/${i.id}`}>
                {i.status === "completed" ? "View results" : "Resume"}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
