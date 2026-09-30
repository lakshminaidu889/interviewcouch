from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class InterviewCreate(BaseModel):
    role: str


class AnswerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    question_index: int
    question: str
    answer_text: str
    feedback: str
    score: float | None


class InterviewSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    role: str
    status: str
    overall_score: float | None
    created_at: datetime


class InterviewOut(InterviewSummary):
    questions: list[str]
    summary: str | None
    completed_at: datetime | None
    answers: list[AnswerOut]
