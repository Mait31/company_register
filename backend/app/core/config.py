from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    app_secret_key: str = "change-me"
    database_url: str = "postgresql+psycopg://company:company@postgres:5432/company_registration"
    storage_root: str = "/app/storage"
    public_base_url: str = "http://localhost"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost"])
    internal_api_key: str = ""

    wecom_corp_id: str = ""
    wecom_agent_id: str = ""
    wecom_app_secret: str = ""
    wecom_contacts_secret: str = ""
    wecom_token: str = ""
    wecom_aes_key: str = ""
    wecom_callback_base_url: str = "http://localhost"
    super_admin_wecom_userids: str = ""

    wechat_mode: str = "token_only"
    wechat_mp_app_id: str = ""
    wechat_mp_app_secret: str = ""
    wechat_mp_callback_base_url: str = "http://localhost"
    wechat_share_title: str = "公司注册信息登记"
    wechat_share_desc: str = "请按要求补充公司登记所需信息"
    wechat_share_image_url: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
