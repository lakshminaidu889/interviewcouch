# AI Interview Coach

React + FastAPI mock-interview app. Pick a role, answer by text or voice, get
feedback streamed live over a WebSocket, and track your scores over time.

## Run with Docker (PostgreSQL)

```bash
export GROQ_API_KEY=your_key_here   # optional: without it, demo feedback is used
docker compose up --build
```

Frontend: http://localhost:5173  API docs: http://localhost:8000/docs

## Run without Docker (SQLite)

```bash
# terminal 1
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env               # add GROQ_API_KEY here
uvicorn app.main:app --reload

# terminal 2
cd frontend
npm install
npm run dev
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | /api/auth/register | create account |
| POST | /api/auth/login | get JWT |
| GET | /api/auth/me | current user |
| GET | /api/roles | available roles |
| POST | /api/interviews | start interview `{role}` |
| GET | /api/interviews | list your interviews |
| GET | /api/interviews/{id} | interview with answers |
| POST | /api/interviews/{id}/complete | score it, queue summary task |
| WS | /ws/interviews/{id}?token=JWT | stream feedback |

WebSocket messages:
client sends `{"type":"answer","question_index":0,"answer":"..."}`;
server sends `{"type":"token","text":"..."}` repeatedly, then
`{"type":"done","question_index":0,"feedback":"...","score":7.5}`.

## Next steps

Alembic migrations, refresh tokens, resume upload to tailor questions,
shareable result links, pytest + GitHub Actions.
