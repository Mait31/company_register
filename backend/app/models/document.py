from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class GeneratedDocument(TimestampMixin, Base):
    __tablename__ = "generated_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("registration_orders.id"), index=True)
    document_type: Mapped[str] = mapped_column(String(100))
    document_name: Mapped[str] = mapped_column(String(255))
    template_id: Mapped[str | None] = mapped_column(String(100))
    file_id: Mapped[int | None] = mapped_column(ForeignKey("files.id"))
    generated_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
