from secrets import token_urlsafe

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import OrderStatus
from app.models.mixins import TimestampMixin


class RegistrationOrder(TimestampMixin, Base):
    __tablename__ = "registration_orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_no: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"))
    sales_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    assigned_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(50), default=OrderStatus.DRAFT.value, index=True)
    public_token: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, default=lambda: token_urlsafe(32)
    )
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False)
    need_registered_address: Mapped[bool] = mapped_column(Boolean, default=False)
    need_bank_account: Mapped[bool] = mapped_column(Boolean, default=False)
    need_tax_registration: Mapped[bool] = mapped_column(Boolean, default=False)
    need_accounting: Mapped[bool] = mapped_column(Boolean, default=False)
    need_work_permit_later: Mapped[bool] = mapped_column(Boolean, default=False)
    remark: Mapped[str | None] = mapped_column(Text)

    customer = relationship("Customer")
