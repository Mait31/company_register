from urllib.parse import urlencode

from app.core.config import settings


class WeComClient:
    def oauth_login_url(self, redirect_uri: str, state: str) -> str:
        query = urlencode(
            {
                "appid": settings.wecom_corp_id,
                "redirect_uri": redirect_uri,
                "response_type": "code",
                "scope": "snsapi_base",
                "state": state,
            }
        )
        return f"https://open.weixin.qq.com/connect/oauth2/authorize?{query}#wechat_redirect"

    async def sync_users(self) -> dict:
        return {"status": "configured", "message": "通讯录同步接口已预留，待企业微信密钥联调"}

    async def send_message(self, userid: str, content: str) -> dict:
        return {"status": "configured", "userid": userid, "content": content}


wecom_client = WeComClient()
