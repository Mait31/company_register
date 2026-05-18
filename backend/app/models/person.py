from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class Person(TimestampMixin, Base):
    __tablename__ = "persons"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("registration_orders.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    name_en: Mapped[str | None] = mapped_column(String(150))
    nationality: Mapped[str | None] = mapped_column(String(100))
    passport_no: Mapped[str | None] = mapped_column(String(100))
    passport_expiry_date: Mapped[date | None] = mapped_column(Date)
    mobile: Mapped[str | None] = mapped_column(String(50))
    email: Mapped[str | None] = mapped_column(String(255))
    residential_address: Mapped[str | None] = mapped_column(Text)
    current_visa_type: Mapped[str | None] = mapped_column(String(100))
    is_director: Mapped[bool] = mapped_column(default=False)
    is_contact_person: Mapped[bool] = mapped_column(default=False)


class Shareholder(TimestampMixin, Base):
    __tablename__ = "shareholders"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("registration_orders.id"), index=True)
    shareholder_type: Mapped[str] = mapped_column(String(50))
    person_id: Mapped[int | None] = mapped_column(ForeignKey("persons.id"))
    company_name: Mapped[str | None] = mapped_column(String(255))
    company_registration_no: Mapped[str | None] = mapped_column(String(100))
    nationality_or_country: Mapped[str | None] = mapped_column(String(100))
    share_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    address: Mapped[str | None] = mapped_column(Text)
