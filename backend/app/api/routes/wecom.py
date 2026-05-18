from secrets import token_urlsafe

from fastapi import APIRouter

from app.core.config import settings
from app.integrations.wecom import wecom_client
from app.schemas.wecom import WeComMessageRequest

router = APIRouter()


@router.get("/oauth/login")
def oauth_login() -> dict:
    state = token_urlsafe(16)
    redirect_uri = f"{settings.wecom_callback_base_url}/api/wecom/oauth/callback"
    return {"login_url": wecom_client.oauth_login_url(redirect_uri=redirect_uri, state=state)}


@router.get("/oauth/callback")
def oauth_callback(code: str, state: str | None = None) -> dict:
    return {"status": "planned", "code": code, "state": state, "message": "待接入企业微信换取用户身份"}


@router.post("/events")
async def events() -> dict:
    return {"status": "received"}


@router.post("/sync-users")
async def sync_users() -> dict:
    return await wecom_client.sync_users()


@router.post("/send-message")
async def send_message(payload: WeComMessageRequest) -> dict:
    return await wecom_client.send_message(userid=payload.userid, content=payload.content)
