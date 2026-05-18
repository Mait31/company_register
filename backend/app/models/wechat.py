from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class WeChatUser(TimestampMixin, Base):
    __tablename__ = "wechat_users"

    id: Mapped[int] = mapped_column(primary_key=True)
    openid: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    unionid: Mapped[str | None] = mapped_column(String(128), index=True)
    nickname: Mapped[str | None] = mapped_column(String(100))
    avatar_url: Mapped[str | None] = mapped_column(String(500))


class RegistrationInvitation(TimestampMixin, Base):
    __tablename__ = "registration_invitations"

    id: Mapped[int] = mapped_column(primary_key=True)
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"))
    order_id: Mapped[int | None] = mapped_column(ForeignKey("registration_orders.id"))
    sales_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(50), default="draft")
    purpose: Mapped[str] = mapped_column(String(100), default="company_registration")
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    bound_openid: Mapped[str | None] = mapped_column(String(128), index=True)
    max_participants: Mapped[int | None]
    allow_forward: Mapped[bool] = mapped_column(default=True)
    remark: Mapped[str | None] = mapped_column(Text)


class InvitationParticipant(TimestampMixin, Base):
    __tablename__ = "invitation_participants"

    id: Mapped[int] = mapped_column(primary_key=True)
    invitation_id: Mapped[int] = mapped_column(ForeignKey("registration_invitations.id"), index=True)
    wechat_user_id: Mapped[int | None] = mapped_column(ForeignKey("wechat_users.id"))
    role: Mapped[str] = mapped_column(String(50), default="customer")
    name: Mapped[str | None] = mapped_column(String(100))
    mobile: Mapped[str | None] = mapped_column(String(50))
    submitted_fields_json: Mapped[dict | None] = mapped_column(JSON)
