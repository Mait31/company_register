from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class StoredFile(TimestampMixin, Base):
    __tablename__ = "files"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("registration_orders.id"), index=True)
    owner_type: Mapped[str] = mapped_column(String(100))
    owner_id: Mapped[int | None]
    file_name: Mapped[str] = mapped_column(String(255))
    file_ext: Mapped[str | None] = mapped_column(String(20))
    mime_type: Mapped[str | None] = mapped_column(String(100))
    file_size: Mapped[int]
    storage_path: Mapped[str] = mapped_column(String(500))
    uploaded_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
