from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from ..database import SessionLocal
from ..llm import split_score, stream_feedback
from ..models import Answer, Interview
from ..security import decode_token

router = APIRouter()


@router.websocket("/ws/interviews/{interview_id}")
async def interview_socket(ws: WebSocket, interview_id: int, token: str = Query(...)):
    """Client sends {"type":"answer","question_index":0,"answer":"..."}.
    Server streams {"type":"token","text":"..."} chunks, then
    {"type":"done","question_index":0,"feedback":"...","score":7.5}."""
    sub = decode_token(token)
    db = SessionLocal()
    try:
        interview = db.get(Interview, interview_id) if sub else None
        if not interview or interview.user_id != int(sub) or interview.status == "completed":
            await ws.close(code=4401)
            return
        await ws.accept()

        while True:
            data = await ws.receive_json()
            if data.get("type") != "answer":
                continue

            idx = data.get("question_index")
            text = (data.get("answer") or "").strip()
            if not isinstance(idx, int) or not 0 <= idx < len(interview.questions) or len(text) < 3:
                await ws.send_json({"type": "error", "message": "Write an answer first."})
                continue

            question = interview.questions[idx]
            buffer: list[str] = []
            try:
                async for piece in stream_feedback(interview.role, question, text):
                    buffer.append(piece)
                    await ws.send_json({"type": "token", "text": piece})
            except WebSocketDisconnect:
                raise
            except Exception:
                await ws.send_json({"type": "error", "message": "The AI coach is unavailable. Try again."})
                continue

            feedback, score = split_score("".join(buffer))

            answer = db.scalar(
                select(Answer).where(
                    Answer.interview_id == interview.id, Answer.question_index == idx
                )
            )
            if not answer:
                answer = Answer(interview_id=interview.id, question_index=idx, question=question)
                db.add(answer)
            answer.answer_text = text
            answer.feedback = feedback
            answer.score = score
            db.commit()

            await ws.send_json(
                {"type": "done", "question_index": idx, "feedback": feedback, "score": score}
            )
    except WebSocketDisconnect:
        pass
    finally:
        db.close()
