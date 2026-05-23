import json

from fastapi import APIRouter, Depends, HTTPException
from livekit import api
from pymongo.database import Database

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.schemas.livekit import TokenRequest, TokenResponse
from app.services.dsa_question_service import select_dsa_question_for_interview
from app.services.session_service import save_interview_session


router = APIRouter()


def _identity_for(user: dict[str, object], requested_identity: str | None) -> str:
    if requested_identity:
        return requested_identity
    email = str(user["email"])
    safe_email = email.lower().replace("@", "-at-")
    return "".join(char if char.isalnum() or char in "-_" else "-" for char in safe_email)


def _selected_question_for_request(db: Database, request: TokenRequest) -> dict[str, object] | None:
    if request.interview.type != "dsa":
        return None

    question = select_dsa_question_for_interview(
        db,
        company=request.interview.company,
        difficulty=request.interview.difficulty,
        level=request.interview.level,
    )
    if question is None:
        raise HTTPException(
            status_code=404,
            detail="No active DSA question found for this interview setup",
        )
    return question


@router.post("/token", response_model=TokenResponse)
async def create_livekit_token(
    request: TokenRequest,
    current_user: dict[str, object] = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> TokenResponse:
    if not settings.livekit_api_key or not settings.livekit_api_secret:
        raise HTTPException(status_code=500, detail="LiveKit credentials are not configured")

    if not settings.agent_name:
        raise HTTPException(status_code=500, detail="AGENT_NAME is not configured")

    identity = _identity_for(current_user, request.identity)
    display_name = request.name or str(current_user["name"])
    selected_question = _selected_question_for_request(db, request)

    token = (
        api.AccessToken(settings.livekit_api_key, settings.livekit_api_secret)
        .with_identity(identity)
        .with_name(display_name)
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

    save_interview_session(
        db,
        user_id=str(current_user["id"]),
        room=request.room,
        interview=request.interview,
        selected_question_id=selected_question["id"] if selected_question else None,
    )

    lkapi = api.LiveKitAPI()
    try:
        dispatch_request = api.CreateAgentDispatchRequest(
            agent_name=settings.agent_name,
            room=request.room,
            metadata=json.dumps(
                {
                    "room": request.room,
                    "requested_by": identity,
                    "user_id": current_user["id"],
                    "interview": request.interview.model_dump(),
                    "selected_question": selected_question,
                }
            ),
        )
        await lkapi._agent_dispatch.create_dispatch(dispatch_request)
    finally:
        await lkapi.aclose()

    return TokenResponse(
        url=settings.livekit_url,
        token=token,
        room=request.room,
        identity=identity,
        selected_question=selected_question,
    )
