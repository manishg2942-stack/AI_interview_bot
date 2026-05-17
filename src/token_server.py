import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from livekit import api
from pydantic import BaseModel

from config.envpath import envpath

load_dotenv(envpath, override=True)

app = FastAPI(title="LiveKit Meeting Token Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://localhost:8000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TokenRequest(BaseModel):
    room: str
    identity: str
    name: str = ""


@app.post("/api/livekit/token")
async def create_livekit_token(request: TokenRequest):
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    agent_name = os.getenv("AGENT_NAME")

    if not api_key or not api_secret:
        raise HTTPException(status_code=500, detail="LiveKit credentials are not configured")

    if not agent_name:
        raise HTTPException(status_code=500, detail="AGENT_NAME is not configured")

    token = (
        api.AccessToken(api_key, api_secret)
        .with_identity(request.identity)
        .with_name(request.name or request.identity)
        .with_grants(
            api.VideoGrants(
                room_join=True,
                room=request.room,
                can_publish=True,
                can_subscribe=True,
            )
        )
        .to_jwt()
    )

    lkapi = api.LiveKitAPI()
    try:
        dispatch_request = api.CreateAgentDispatchRequest(
            agent_name=agent_name,
            room=request.room,
            metadata=json.dumps({
                "room": request.room,
                "requested_by": request.identity,
            })
        )
        await lkapi._agent_dispatch.create_dispatch(dispatch_request)
    finally:
        await lkapi.aclose()

    return {
        "url": os.getenv("LIVEKIT_URL"),
        "token": token,
        "room": request.room,
        "identity": request.identity,
    }
