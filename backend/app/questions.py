import random

QUESTION_BANK: dict[str, list[str]] = {
    "Frontend Developer": [
        "Explain how the browser turns HTML, CSS and JavaScript into pixels on the screen.",
        "When would you reach for useMemo or useCallback in React, and when would you avoid them?",
        "How do you make a web page accessible to keyboard and screen reader users?",
        "Walk me through how you would debug a page that feels slow to load.",
        "How do you decide where state should live in a React application?",
        "Describe a UI bug that was hard to track down and how you fixed it.",
    ],
    "Backend Developer": [
        "How would you design a REST API for a to-do app with users and shared lists?",
        "Explain the difference between authentication and authorization, with an example.",
        "What causes the N+1 query problem, and how do you fix it?",
        "How would you make a slow endpoint faster? Walk me through your process.",
        "When would you use a message queue or background worker instead of handling work in the request?",
        "Describe how you would design database indexes for a table that is read heavily.",
    ],
    "Data Analyst": [
        "How would you investigate a sudden 20% drop in weekly active users?",
        "Explain the difference between correlation and causation with a real example.",
        "What steps do you take to clean a messy dataset before analysis?",
        "How would you design an A/B test for a new checkout button?",
        "Explain a SQL window function and when you would use one.",
        "Tell me about a time your analysis changed a decision.",
    ],
    "Product Manager": [
        "How do you decide what to build next when everything seems important?",
        "Tell me about a product you love and how you would improve it.",
        "How would you measure the success of a new onboarding flow?",
        "Describe how you handle disagreement between engineering and design.",
        "How would you prioritize a backlog with limited engineering capacity?",
        "Tell me about a launch that did not go as planned.",
    ],
    "DevOps Engineer": [
        "Explain what happens in a CI/CD pipeline from commit to production.",
        "How would you roll out a risky change with minimal downtime?",
        "What is the difference between a container and a virtual machine?",
        "How do you decide what to monitor and alert on for a web service?",
        "Describe how you would respond to a production outage at 3 a.m.",
        "What does infrastructure as code give you, and what problems can it cause?",
    ],
}


def pick_questions(role: str, n: int = 5) -> list[str]:
    pool = QUESTION_BANK[role]
    return random.sample(pool, k=min(n, len(pool)))
