from secrets import token_urlsafe

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.wechat import InvitationParticipant, RegistrationInvitation
from app.schemas.invitation import (
    InvitationCreate,
    InvitationRead,
    ParticipantCreate,
    ParticipantRead,
)

router = APIRouter()


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
        expires_at=payload.expires_at,
        max_participants=payload.max_participants,
        allow_forward=payload.allow_forward,
        remark=payload.remark,
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)
    return invitation


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
def get_invitation(token: str, db: Session = Depends(get_db)) -> RegistrationInvitation:
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
