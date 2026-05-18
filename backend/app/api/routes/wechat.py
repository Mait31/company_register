from secrets import token_urlsafe
from urllib.parse import urlencode

from fastapi import APIRouter, HTTPException, Query

from app.core.config import settings
from app.services.wechat_js_sdk import WeChatApiError, wechat_js_sdk_service

router = APIRouter()


@router.get("/oauth/login")
def wechat_oauth_login(redirect_path: str = "/") -> dict:
    if settings.wechat_mode == "token_only":
        return {
            "mode": settings.wechat_mode,
            "login_url": redirect_path,
            "message": "当前使用 token_only 模式，不强制微信公众号网页授权",
        }

    state = token_urlsafe(16)
    redirect_uri = f"{settings.wechat_mp_callback_base_url}/api/wechat/oauth/callback"
    query = urlencode(
        {
            "appid": settings.wechat_mp_app_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "snsapi_base",
            "state": state,
        }
    )
    return {
        "login_url": f"https://open.weixin.qq.com/connect/oauth2/authorize?{query}#wechat_redirect",
        "redirect_path": redirect_path,
    }


@router.get("/oauth/callback")
def wechat_oauth_callback(code: str, state: str | None = None) -> dict:
    if settings.wechat_mode == "token_only":
        return {"status": "skipped", "mode": settings.wechat_mode, "message": "token_only 模式不处理 OAuth 回调"}
    return {"status": "planned", "code": code, "state": state, "message": "待接入公众号网页授权"}


@router.get("/js-sdk-signature")
def wechat_js_sdk_signature(url: str = Query(..., min_length=1)) -> dict:
    try:
        return wechat_js_sdk_service.create_signature(url)
    except WeChatApiError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
