from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import MaterialStatus
from app.models.mixins import TimestampMixin


class OrderMaterial(TimestampMixin, Base):
    __tablename__ = "order_materials"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("registration_orders.id"), index=True)
    material_type: Mapped[str] = mapped_column(String(100))
    material_name: Mapped[str] = mapped_column(String(255))
    required: Mapped[bool] = mapped_column(default=True)
    status: Mapped[str] = mapped_column(String(50), default=MaterialStatus.MISSING.value)
    file_id: Mapped[int | None] = mapped_column(ForeignKey("files.id"))
    review_comment: Mapped[str | None] = mapped_column(Text)
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class InvitationMaterial(TimestampMixin, Base):
    __tablename__ = "invitation_materials"

    id: Mapped[int] = mapped_column(primary_key=True)
    invitation_id: Mapped[int] = mapped_column(
        ForeignKey("registration_invitations.id"),
        index=True,
    )
    material_type: Mapped[str] = mapped_column(String(100), index=True)
    material_name: Mapped[str] = mapped_column(String(255))
    required: Mapped[bool] = mapped_column(default=True)
    status: Mapped[str] = mapped_column(String(50), default=MaterialStatus.MISSING.value)
    file_id: Mapped[int | None] = mapped_column(ForeignKey("files.id"))
    review_comment: Mapped[str | None] = mapped_column(Text)
    reviewed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
