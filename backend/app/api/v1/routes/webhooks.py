from fastapi import APIRouter, Request, Header, HTTPException
from livekit import api
from app.core.config import settings
from app.db.session import get_db
from app.services.session_service import mark_session_abandoned_by_room

router = APIRouter()

@router.post("/webhooks/livekit")
async def livekit_webhook(request: Request, authorization: str = Header(None)):
    body = await request.body()
    receiver = api.WebhookReceiver(settings.livekit_api_key, settings.livekit_api_secret)
    try:
        event = receiver.receive(body.decode(), authorization)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid signature")

    if event.event == "room_finished":
        db = next(get_db())
        mark_session_abandoned_by_room(db, room=event.room.name)

    return {"ok": True}