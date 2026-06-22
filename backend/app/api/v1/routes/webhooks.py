@router.post("/webhooks/livekit")
async def livekit_webhook(request: Request, authorization: str = Header(None)):
    body = await request.body()
    print("WEBHOOK HIT, body:", body.decode())  # temporary debug
    
    receiver = api.WebhookReceiver(settings.livekit_api_key, settings.livekit_api_secret)
    try:
        event = receiver.receive(body.decode(), authorization)
    except Exception as e:
        print("WEBHOOK SIGNATURE FAILED:", e)  # temporary debug
        raise HTTPException(status_code=401, detail="Invalid signature")

    print("EVENT TYPE:", event.event)  # temporary debug
    
    if event.event == "room_finished":
        db = next(get_db())
        result = mark_session_abandoned_by_room(db, room=event.room.name)
        print("ABANDONED RESULT:", result)  # temporary debug

    return {"ok": True}