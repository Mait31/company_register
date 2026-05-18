import hashlib
import time
from secrets import token_urlsafe
from threading import Lock
from typing import Any

import httpx

from app.core.config import settings


class WeChatApiError(RuntimeError):
    pass


class WeChatJsSdkService:
    def __init__(self) -> None:
        self._access_token: str | None = None
        self._access_token_expires_at = 0
        self._jsapi_ticket: str | None = None
        self._jsapi_ticket_expires_at = 0
        self._lock = Lock()

    def is_configured(self) -> bool:
        return bool(settings.wechat_mp_app_id and settings.wechat_mp_app_secret)

    def create_signature(self, url: str) -> dict[str, Any]:
        if not self.is_configured():
            return {
                "enabled": False,
                "reason": "wechat_mp_app_id_or_secret_missing",
                "title": settings.wechat_share_title,
                "desc": settings.wechat_share_desc,
                "imgUrl": settings.wechat_share_image_url,
            }

        ticket = self._get_jsapi_ticket()
        timestamp = int(time.time())
        nonce_str = token_urlsafe(16)
        sign_url = url.split("#", 1)[0]
        plain = (
            f"jsapi_ticket={ticket}&noncestr={nonce_str}&timestamp={timestamp}&url={sign_url}"
        )
        signature = hashlib.sha1(plain.encode("utf-8")).hexdigest()

        return {
            "enabled": True,
            "appId": settings.wechat_mp_app_id,
            "timestamp": timestamp,
            "nonceStr": nonce_str,
            "signature": signature,
            "title": settings.wechat_share_title,
            "desc": settings.wechat_share_desc,
            "imgUrl": settings.wechat_share_image_url,
        }

    def _get_jsapi_ticket(self) -> str:
        now = int(time.time())
        with self._lock:
            if self._jsapi_ticket and now < self._jsapi_ticket_expires_at:
                return self._jsapi_ticket

            access_token = self._get_access_token_locked(now)
            response = httpx.get(
                "https://api.weixin.qq.com/cgi-bin/ticket/getticket",
                params={"access_token": access_token, "type": "jsapi"},
                timeout=10,
            )
            payload = response.json()
            self._ensure_wechat_success(payload, "get jsapi ticket failed")
            self._jsapi_ticket = payload["ticket"]
            self._jsapi_ticket_expires_at = now + max(int(payload.get("expires_in", 7200)) - 300, 60)
            return self._jsapi_ticket

    def _get_access_token_locked(self, now: int) -> str:
        if self._access_token and now < self._access_token_expires_at:
            return self._access_token

        response = httpx.get(
            "https://api.weixin.qq.com/cgi-bin/token",
            params={
                "grant_type": "client_credential",
                "appid": settings.wechat_mp_app_id,
                "secret": settings.wechat_mp_app_secret,
            },
            timeout=10,
        )
        payload = response.json()
        self._ensure_wechat_success(payload, "get access token failed")
        self._access_token = payload["access_token"]
        self._access_token_expires_at = now + max(int(payload.get("expires_in", 7200)) - 300, 60)
        return self._access_token

    @staticmethod
    def _ensure_wechat_success(payload: dict[str, Any], message: str) -> None:
        if payload.get("errcode", 0) not in (0, "0"):
            raise WeChatApiError(f"{message}: {payload}")


wechat_js_sdk_service = WeChatJsSdkService()
