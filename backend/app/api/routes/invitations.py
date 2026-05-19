from secrets import token_urlsafe

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.wechat import InvitationParticipant, RegistrationInvitation
from app.schemas.invitation import (
    AdminInvitationDetail,
    AdminInvitationListItem,
    AdminInvitationUpdate,
    InvitationCreate,
    InvitationRead,
    ParticipantCreate,
    ParticipantRead,
)

router = APIRouter()
PUBLIC_INTAKE_TOKEN = "company-registration"


def _latest_participant(
    db: Session, invitation_id: int
) -> InvitationParticipant | None:
    return (
        db.query(InvitationParticipant)
        .filter(InvitationParticipant.invitation_id == invitation_id)
        .order_by(InvitationParticipant.id.desc())
        .first()
    )


def _company_name(fields: dict | None) -> str | None:
    if not fields:
        return None
    for key in ("full_company_name", "company_name_1", "company_name_2", "company_name_3"):
        value = fields.get(key)
        if value:
            return str(value)
    return None


def _public_sales_user_id(db: Session) -> int:
    user = db.query(User).order_by(User.id.asc()).first()
    if user:
        return user.id

    user = User(name="公开填写入口", role="admin", status="active")
    db.add(user)
    db.flush()
    return user.id


def _invitation_list_item(
    db: Session, invitation: RegistrationInvitation
) -> AdminInvitationListItem:
    participant = _latest_participant(db, invitation.id)
    fields = participant.submitted_fields_json if participant else None
    return AdminInvitationListItem(
        id=invitation.id,
        token=invitation.token,
        status=invitation.status,
        remark=invitation.remark,
        company_name=_company_name(fields),
        contact_name=participant.name if participant else None,
        contact_mobile=participant.mobile if participant else None,
        latest_submitted_at=participant.updated_at if participant else None,
        created_at=invitation.created_at,
        updated_at=invitation.updated_at,
    )


def _invitation_detail(
    db: Session, invitation: RegistrationInvitation
) -> AdminInvitationDetail:
    item = _invitation_list_item(db, invitation)
    participants = (
        db.query(InvitationParticipant)
        .filter(InvitationParticipant.invitation_id == invitation.id)
        .order_by(InvitationParticipant.id.desc())
        .all()
    )
    return AdminInvitationDetail(
        **item.model_dump(),
        allow_forward=invitation.allow_forward,
        expires_at=invitation.expires_at,
        participants=participants,
    )


@router.post("/admin/invitations", response_model=InvitationRead, tags=["admin"])
def create_invitation(
    payload: InvitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RegistrationInvitation:
    invitation = RegistrationInvitation(
        token=token_urlsafe(32),
        customer_id=payload.customer_id,
        sales_user_id=current_user.id,
        status="waiting_customer",
        expires_at=payload.expires_at,
        max_participants=payload.max_participants,
        allow_forward=payload.allow_forward,
        remark=payload.remark,
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


@router.get("/admin/invitations", response_model=list[AdminInvitationListItem], tags=["admin"])
def list_admin_invitations(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[AdminInvitationListItem]:
    invitations = (
        db.query(RegistrationInvitation)
        .order_by(RegistrationInvitation.id.desc())
        .limit(100)
        .all()
    )
    return [_invitation_list_item(db, invitation) for invitation in invitations]


@router.get("/admin/invitations/{invitation_id}", response_model=AdminInvitationDetail, tags=["admin"])
def get_admin_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AdminInvitationDetail:
    invitation = db.get(RegistrationInvitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return _invitation_detail(db, invitation)


@router.patch("/admin/invitations/{invitation_id}", response_model=AdminInvitationDetail, tags=["admin"])
def update_admin_invitation(
    invitation_id: int,
    payload: AdminInvitationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AdminInvitationDetail:
    invitation = db.get(RegistrationInvitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")

    if payload.status is not None:
        invitation.status = payload.status
    if payload.remark is not None:
        invitation.remark = payload.remark

    if payload.submitted_fields_json is not None:
        participant = _latest_participant(db, invitation.id)
        if not participant:
            participant = InvitationParticipant(
                invitation_id=invitation.id,
                role="customer",
                name=payload.submitted_fields_json.get("name"),
                mobile=payload.submitted_fields_json.get("mobile"),
            )
            db.add(participant)
        participant.submitted_fields_json = payload.submitted_fields_json
        participant.name = payload.submitted_fields_json.get("name") or participant.name
        participant.mobile = payload.submitted_fields_json.get("mobile") or participant.mobile

    db.commit()
    db.refresh(invitation)
    return _invitation_detail(db, invitation)


@router.post("/admin/invitations/{invitation_id}/convert-to-order", tags=["admin"])
def convert_invitation_to_order(
    invitation_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    invitation = db.get(RegistrationInvitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return {"invitation_id": invitation.id, "status": "planned", "message": "转正式工单接口已预留"}


@router.get("/invitations/{token}", response_model=InvitationRead, tags=["invitations"])
def get_invitation(token: str, db: Session = Depends(get_db)) -> RegistrationInvitation | dict:
    if token == PUBLIC_INTAKE_TOKEN:
        return {
            "id": 0,
            "token": PUBLIC_INTAKE_TOKEN,
            "status": "waiting_customer",
            "allow_forward": True,
            "expires_at": None,
            "remark": "公开填写入口",
            "entry_mode": "token_only",
        }

    invitation = db.query(RegistrationInvitation).filter(RegistrationInvitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return invitation


@router.post("/invitations/{token}/participants", tags=["invitations"])
def create_participant(
    token: str,
    payload: ParticipantCreate,
    db: Session = Depends(get_db),
) -> ParticipantRead:
    if token == PUBLIC_INTAKE_TOKEN:
        invitation = RegistrationInvitation(
            token=token_urlsafe(32),
            sales_user_id=_public_sales_user_id(db),
            status="pending_internal_confirm",
            remark="公开填写入口自动创建",
            allow_forward=True,
        )
        db.add(invitation)
        db.flush()
    else:
        invitation = db.query(RegistrationInvitation).filter(RegistrationInvitation.token == token).first()

    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")

    submitted_fields = payload.model_dump()
    participant = InvitationParticipant(
        invitation_id=invitation.id,
        role=payload.role,
        name=payload.name,
        mobile=payload.mobile,
        submitted_fields_json=submitted_fields,
    )
    invitation.status = "pending_internal_confirm"
    db.add(participant)
    db.commit()
    return ParticipantRead(participant_id=participant.id)


@router.patch("/invitations/{token}/customer", tags=["invitations"])
def save_invitation_customer(token: str, db: Session = Depends(get_db)) -> dict:
    invitation = db.query(RegistrationInvitation).filter(RegistrationInvitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return {"invitation_id": invitation.id, "status": "planned", "message": "客户草稿保存接口已预留"}


@router.patch("/invitations/{token}/company", tags=["invitations"])
def save_invitation_company(token: str, db: Session = Depends(get_db)) -> dict:
    invitation = db.query(RegistrationInvitation).filter(RegistrationInvitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return {"invitation_id": invitation.id, "status": "planned", "message": "公司草稿保存接口已预留"}


@router.post("/invitations/{token}/files", tags=["invitations"])
def upload_invitation_file(token: str, db: Session = Depends(get_db)) -> dict:
    invitation = db.query(RegistrationInvitation).filter(RegistrationInvitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return {"invitation_id": invitation.id, "status": "planned", "message": "邀请材料上传接口已预留"}


@router.post("/invitations/{token}/bind-wechat", tags=["invitations"])
def bind_wechat(token: str, db: Session = Depends(get_db)) -> dict:
    invitation = db.query(RegistrationInvitation).filter(RegistrationInvitation.token == token).first()
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return {"invitation_id": invitation.id, "status": "planned", "message": "微信公众号身份绑定待联调"}
