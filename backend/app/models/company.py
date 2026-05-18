from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class CompanyDraft(TimestampMixin, Base):
    __tablename__ = "company_drafts"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("registration_orders.id"), unique=True)
    company_name_1: Mapped[str | None] = mapped_column(String(255))
    company_name_2: Mapped[str | None] = mapped_column(String(255))
    company_name_3: Mapped[str | None] = mapped_column(String(255))
    company_type: Mapped[str | None] = mapped_column(String(100))
    country: Mapped[str | None] = mapped_column(String(100))
    city: Mapped[str | None] = mapped_column(String(100))
    legal_address: Mapped[str | None] = mapped_column(Text)
    registered_capital_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    registered_capital_currency: Mapped[str | None] = mapped_column(String(20))
    is_capital_paid: Mapped[bool | None]
    business_scope: Mapped[str | None] = mapped_column(Text)
    tax_regime: Mapped[str | None] = mapped_column(String(100))


class CompanyArchive(TimestampMixin, Base):
    __tablename__ = "company_archives"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("registration_orders.id"), unique=True)
    company_name: Mapped[str] = mapped_column(String(255))
    company_type: Mapped[str | None] = mapped_column(String(100))
    registration_no: Mapped[str | None] = mapped_column(String(100))
    tax_no: Mapped[str | None] = mapped_column(String(100))
    legal_address: Mapped[str | None] = mapped_column(Text)
    registered_capital_amount: Mapped[Decimal | None] = mapped_column(Numeric(18, 2))
    registered_capital_currency: Mapped[str | None] = mapped_column(String(20))
    business_scope: Mapped[str | None] = mapped_column(Text)
    director_person_id: Mapped[int | None] = mapped_column(ForeignKey("persons.id"))
    registration_date: Mapped[date | None] = mapped_column(Date)
    tax_regime: Mapped[str | None] = mapped_column(String(100))
    bank_account_status: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50), default="active")
