from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import SessionLocal, get_db
from ..deps import get_current_user
from ..llm import summarize
from ..models import Interview, User, utcnow
from ..questions import QUESTION_BANK, pick_questions
from ..schemas import InterviewCreate, InterviewOut, InterviewSummary

router = APIRouter(prefix="/api", tags=["interviews"])


def _get_owned(db: Session, interview_id: int, user: User) -> Interview:
    interview = db.get(Interview, interview_id)
    if not interview or interview.user_id != user.id:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview


async def generate_summary(interview_id: int) -> None:
    """Background task: ask the LLM for a written summary once scoring is done."""
    db = SessionLocal()
    try:
        interview = db.get(Interview, interview_id)
        qa = [(a.question, a.answer_text, a.score) for a in interview.answers]
        interview.summary = await summarize(interview.role, qa)
        db.commit()
    finally:
        db.close()


@router.get("/roles", response_model=list[str])
def roles():
    return list(QUESTION_BANK.keys())


@router.post("/interviews", response_model=InterviewOut, status_code=201)
def create_interview(
    payload: InterviewCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.role not in QUESTION_BANK:
        raise HTTPException(status_code=400, detail="Unknown role")
    interview = Interview(user_id=user.id, role=payload.role, questions=pick_questions(payload.role))
    db.add(interview)
    db.commit()
    return interview


@router.get("/interviews", response_model=list[InterviewSummary])
def list_interviews(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = select(Interview).where(Interview.user_id == user.id).order_by(Interview.created_at.desc())
    return db.scalars(stmt).all()


@router.get("/interviews/{interview_id}", response_model=InterviewOut)
def get_interview(
    interview_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    return _get_owned(db, interview_id, user)


@router.post("/interviews/{interview_id}/complete", response_model=InterviewOut)
def complete_interview(
    interview_id: int,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    interview = _get_owned(db, interview_id, user)
    if interview.status != "completed":
        scores = [a.score for a in interview.answers if a.score is not None]
        if not scores:
            raise HTTPException(status_code=400, detail="Answer at least one question first")
        interview.overall_score = round(sum(scores) / len(scores), 1)
        interview.status = "completed"
        interview.completed_at = utcnow()
        db.commit()
        background.add_task(generate_summary, interview.id)
    return interview
