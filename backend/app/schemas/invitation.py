from datetime import datetime
from typing import Any, Literal

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


InvitationFollowStatus = Literal[
    "waiting_customer",
    "pending_internal_confirm",
    "processing",
    "completed",
]


class InvitationParticipantDetail(BaseModel):
    id: int
    role: str
    name: str | None
    mobile: str | None
    submitted_fields_json: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdminInvitationListItem(BaseModel):
    id: int
    token: str
    status: str
    remark: str | None
    company_name: str | None
    contact_name: str | None
    contact_mobile: str | None
    latest_submitted_at: datetime | None
    created_at: datetime
    updated_at: datetime


class AdminInvitationDetail(AdminInvitationListItem):
    allow_forward: bool
    expires_at: datetime | None
    participants: list[InvitationParticipantDetail]


class AdminInvitationUpdate(BaseModel):
    status: InvitationFollowStatus | None = None
    remark: str | None = None
    submitted_fields_json: dict[str, Any] | None = None


MaterialReviewStatus = Literal["approved", "rejected"]


class InvitationMaterialFileRead(BaseModel):
    id: int
    file_name: str
    file_ext: str | None
    mime_type: str | None
    file_size: int
    uploaded_at: datetime


class InvitationMaterialRead(BaseModel):
    id: int
    material_type: str
    material_name: str
    description: str
    required: bool
    status: str
    review_comment: str | None
    reviewed_at: datetime | None
    file: InvitationMaterialFileRead | None


class InvitationMaterialSummary(BaseModel):
    invitation_id: int
    token: str
    status: str
    total: int
    uploaded: int
    approved: int
    rejected: int
    missing: int
    materials: list[InvitationMaterialRead]


class InvitationMaterialReview(BaseModel):
    status: MaterialReviewStatus
    review_comment: str | None = Field(default=None, max_length=500)
