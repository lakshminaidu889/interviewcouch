"""LLM helpers. Uses Groq when GROQ_API_KEY is set, otherwise a demo fallback
so the whole app still runs offline."""
import asyncio
import re
from collections.abc import AsyncIterator

from groq import AsyncGroq

from .config import settings

SCORE_RE = re.compile(r"SCORE:\s*(\d+(?:\.\d+)?)", re.IGNORECASE)

FEEDBACK_SYSTEM = """You are an interview coach helping a candidate practise for a {role} role.
Judge the candidate's answer to the question. Be specific, honest and encouraging.
Reply in exactly this format:
**Strengths:** one or two sentences.
**To improve:** one or two sentences.
**Stronger answer:** two or three sentences showing how to phrase it better.
Then finish with a final line exactly like: SCORE: <number from 0 to 10>"""

_client = AsyncGroq(api_key=settings.groq_api_key) if settings.groq_api_key else None


async def stream_feedback(role: str, question: str, answer: str) -> AsyncIterator[str]:
    if _client is None:
        async for piece in _demo_stream(answer):
            yield piece
        return

    stream = await _client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": FEEDBACK_SYSTEM.format(role=role)},
            {"role": "user", "content": f"Question: {question}\n\nCandidate answer: {answer}"},
        ],
        temperature=0.4,
        max_tokens=500,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


def split_score(text: str) -> tuple[str, float]:
    """Separate the trailing 'SCORE: n' line from the feedback text."""
    match = SCORE_RE.search(text)
    score = min(max(float(match.group(1)), 0.0), 10.0) if match else 5.0
    return SCORE_RE.sub("", text).strip(), score


async def summarize(role: str, qa: list[tuple[str, str, float | None]]) -> str:
    if _client is None:
        scores = [s for _, _, s in qa if s is not None]
        avg = sum(scores) / len(scores) if scores else 0
        return (
            f"Demo summary: you answered {len(qa)} questions for the {role} role "
            f"with an average score of {avg:.1f}/10. Add a GROQ_API_KEY for a real summary."
        )

    transcript = "\n\n".join(
        f"Q: {q}\nA: {a}\nScore: {s}" for q, a, s in qa
    )
    resp = await _client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {
                "role": "system",
                "content": (
                    f"You are an interview coach. Summarise this {role} mock interview in "
                    "about 90 words: overall impression, top strength, top thing to work on."
                ),
            },
            {"role": "user", "content": transcript},
        ],
        temperature=0.4,
        max_tokens=250,
    )
    return resp.choices[0].message.content.strip()


async def _demo_stream(answer: str) -> AsyncIterator[str]:
    words = len(answer.split())
    score = 3 if words < 20 else 6 if words < 60 else 8
    text = (
        "**Strengths:** You addressed the question directly. (Demo mode: set GROQ_API_KEY "
        "for real AI feedback.)\n"
        f"**To improve:** Your answer was {words} words. Add a concrete example and a result.\n"
        "**Stronger answer:** Open with a one-line answer, back it with a specific project, "
        "then close with the outcome.\n"
        f"SCORE: {score}"
    )
    for i in range(0, len(text), 10):
        yield text[i : i + 10]
        await asyncio.sleep(0.03)
