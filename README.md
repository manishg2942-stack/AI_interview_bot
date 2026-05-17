# Local Interview Bot

This is a simple local LiveKit interview bot. Run three terminals: one for the agent, one for the token API, and one for the React frontend.

Main files:

- `src/__main__.py` creates STT, LLM, TTS, and starts the LiveKit worker.
- `src/agents/meeting_agent.py` contains the interview agent.
- `src/prompts/interview_prompt.py` controls the bot's interview behavior.
- `src/token_server.py` creates LiveKit tokens for the browser.
- `frontend/` contains the local React UI.

## Setup

```bat
cd C:\Users\manish.gupta2\Desktop\AI_bot_nildari\property_reactivation_bot
python -m venv .venv
.venv\Scripts\activate.bat
python -m pip install -r requirements.txt
```

## Run agent worker

```bat
cd C:\Users\manish.gupta2\Desktop\AI_bot_nildari\property_reactivation_bot\src
..\.venv\Scripts\python __main__.py dev
```

## Run token server

```bat
cd C:\Users\manish.gupta2\Desktop\AI_bot_nildari\property_reactivation_bot\src
..\.venv\Scripts\python -m uvicorn token_server:app --reload --port 8000
```

## Run frontend

```bat
cd C:\Users\manish.gupta2\Desktop\AI_bot_nildari\property_reactivation_bot\frontend
npm.cmd run dev
```

Open `http://localhost:5173`, enter your name and room, then join.
