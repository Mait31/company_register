from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import QuotationStatus
from app.models.mixins import TimestampMixin


class Quotation(TimestampMixin, Base):
    __tablename__ = "quotations"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("registration_orders.id"), index=True)
    quotation_no: Mapped[str] = mapped_column(String(50), unique=True)
    currency: Mapped[str] = mapped_column(String(20), default="USD")
    total_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    final_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=0)
    status: Mapped[str] = mapped_column(String(50), default=QuotationStatus.DRAFT.value)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))


class QuotationItem(TimestampMixin, Base):
    __tablename__ = "quotation_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    quotation_id: Mapped[int] = mapped_column(ForeignKey("quotations.id"), index=True)
    item_name: Mapped[str] = mapped_column(String(255))
    item_type: Mapped[str | None] = mapped_column(String(100))
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2))
    quantity: Mapped[int] = mapped_column(default=1)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(18, 2))
    is_required: Mapped[bool] = mapped_column(default=False)
    remark: Mapped[str | None] = mapped_column(Text)
