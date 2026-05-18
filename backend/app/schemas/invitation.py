from datetime import datetime

from pydantic import BaseModel, Field


class InvitationCreate(BaseModel):
    customer_id: int | None = None
    expires_at: datetime | None = None
    max_participants: int | None = Field(default=None, ge=1)
    allow_forward: bool = True
    remark: str | None = None


class InvitationRead(BaseModel):
    id: int
    token: str
    status: str
    allow_forward: bool
    expires_at: datetime | None
    remark: str | None
    entry_mode: str = "token_only"

    model_config = {"from_attributes": True}


class ParticipantCreate(BaseModel):
    role: str = "customer"
    name: str = Field(min_length=1, max_length=100)
    mobile: str | None = Field(default=None, max_length=50)
    full_company_name: str | None = Field(default=None, max_length=255)
    company_name_1: str | None = Field(default=None, max_length=255)
    company_name_2: str | None = Field(default=None, max_length=255)
    company_name_3: str | None = Field(default=None, max_length=255)
    legal_address: str | None = None
    director_name: str | None = Field(default=None, max_length=100)
    director_phone: str | None = Field(default=None, max_length=50)
    director_address: str | None = None
    shareholder_note: str | None = None
    registered_capital: str | None = Field(default=None, max_length=100)
    business_scope: str | None = None
    need_registered_address: bool = False
    need_bank_account: bool = False
    need_accounting: bool = False
    tax_regime: str | None = Field(default=None, max_length=100)
    visa_type: str | None = Field(default=None, max_length=100)
    filled_date: str | None = Field(default=None, max_length=50)


class ParticipantRead(BaseModel):
    participant_id: int
