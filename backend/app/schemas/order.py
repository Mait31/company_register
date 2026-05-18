from pydantic import BaseModel, Field

from app.models.enums import OrderStatus


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=1, max_length=100)
    customer_mobile: str | None = None
    is_urgent: bool = False
    need_registered_address: bool = False
    need_bank_account: bool = False
    need_tax_registration: bool = False
    need_accounting: bool = False
    need_work_permit_later: bool = False
    remark: str | None = None


class OrderStatusChange(BaseModel):
    to_status: OrderStatus
    comment: str | None = None


class OrderRead(BaseModel):
    id: int
    order_no: str
    status: str
    public_token: str

    model_config = {"from_attributes": True}
