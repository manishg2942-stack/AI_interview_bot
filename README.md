# Aisha Interview Bot

This is a local LiveKit AI voice interview app with a separated FastAPI backend and React frontend. Run three terminals: one for the agent worker, one for the backend API, and one for the frontend.

Main folders:

- `frontend/` contains the React/Vite user interface.
- `backend/` contains the production-style backend API package.
- `livekit-agent/` contains the LiveKit AI agent worker.
- `env/` contains local-only environment files and secrets.

Main files:

- `livekit-agent/__main__.py` creates STT, LLM, TTS, and starts the LiveKit worker.
- `livekit-agent/agents/meeting_agent.py` contains the interview agent.
- `livekit-agent/prompts/interview_prompt.py` controls the bot's interview behavior.
- `livekit-agent/token_server.py` is a compatibility wrapper for older backend run commands.

Backend API structure:

- `backend/app/main.py` creates the FastAPI app.
- `backend/app/api/v1/routes/auth.py` exposes signup and login APIs.
- `backend/app/api/v1/routes/livekit.py` creates LiveKit tokens and dispatches the agent.
- `backend/app/core/` contains config and security helpers.
- `backend/app/db/` contains MongoDB setup.
- `backend/app/services/` contains business logic.
- `backend/app/schemas/` contains request and response models.

## Setup

```bat
cd C:\Users\manish.gupta2\Desktop\bot
python -m venv .venv
.venv\Scripts\activate.bat
python -m pip install -r requirements.txt
```

Add these backend values in `env/.env`:

```env
AUTH_SECRET=change-this-long-random-secret
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=aisha_interview
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:8000
```

The backend uses MongoDB collections named `users` and `interview_sessions`.
Make sure your local MongoDB server is running before starting the backend.

## Run agent worker

```bat
cd C:\Users\manish.gupta2\Desktop\bot\livekit-agent
..\.venv\Scripts\python __main__.py dev
```

## Run backend API

```bat
cd C:\Users\manish.gupta2\Desktop\bot\backend
..\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

## Seed DSA Questions

Run this once before starting DSA interviews:

```bat
cd C:\Users\manish.gupta2\Desktop\bot\backend
..\.venv\Scripts\python scripts\seed_dsa_questions.py
```

## Run frontend

```bat
cd C:\Users\manish.gupta2\Desktop\bot\frontend
npm.cmd run dev
```

Open `http://localhost:5173`, sign up or sign in, choose the interview setup, then start the practice interview.

For DSA interviews, `POST /api/livekit/token` selects a matching question from MongoDB using company, difficulty, and level. The selected question is sent in LiveKit agent dispatch metadata, and the agent injects it into Aisha's interview prompt.

Useful backend endpoints:

- `GET /health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/dsa-questions/bulk`
- `GET /api/dsa-questions`
- `POST /api/livekit/token`

Frontend API contract:

`POST /api/auth/signup`

```json
{
  "name": "Manish Gupta",
  "email": "you@example.com",
  "password": "secret123"
}
```

`POST /api/auth/login`

```json
{
  "email": "you@example.com",
  "password": "secret123"
}
```

Both auth APIs return:

```json
{
  "access_token": "...",
  "token_type": "bearer",
  "user": {
    "id": "6a11f57ca29c1d0f966274d7",
    "name": "Manish Gupta",
    "email": "you@example.com"
  }
}
```

`POST /api/livekit/token`

Requires header:

```txt
Authorization: Bearer <access_token>
```

Request body:

```json
{
  "identity": "you-example-com",
  "name": "Manish Gupta",
  "room": "demo-room",
  "interview": {
    "type": "dsa",
    "company": "Amazon",
    "level": "SDE 1",
    "difficulty": "Medium"
  }
}
```

`POST /api/dsa-questions/bulk`

Requires header:

```txt
Authorization: Bearer <access_token>
```

Request body:

```json
{
  "questions": [
    {
      "title": "Two Sum",
      "question": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      "difficulty": "Easy",
      "companies": ["Amazon", "Google"],
      "topics": ["Array", "HashMap"],
      "level": ["Fresher", "SDE 1"],
      "constraints": ["2 <= nums.length <= 10^4"],
      "examples": [
        {
          "input": "nums = [2,7,11,15], target = 9",
          "output": "[0,1]",
          "explanation": "nums[0] + nums[1] = 9"
        }
      ],
      "expected_approach": "Use a hash map to store previous values.",
      "time_complexity": "O(n)",
      "space_complexity": "O(n)",
      "tags": ["hashing", "array"]
    }
  ]
}
```

Filter inserted questions:

```txt
GET /api/dsa-questions?company=Amazon&difficulty=Easy&level=SDE 1&topic=Array
```

A ready seed file with 100 DSA questions is available at `backend/seed/dsa_questions.json`.
After login, send that JSON to `POST /api/dsa-questions/bulk` with your bearer token.
