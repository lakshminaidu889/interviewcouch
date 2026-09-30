from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (registers tables)
from .config import settings
from .database import Base, engine
from .routers import auth, interviews, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)  # swap for Alembic migrations later
    yield


app = FastAPI(title="AI Interview Coach", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(interviews.router)
app.include_router(ws.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
