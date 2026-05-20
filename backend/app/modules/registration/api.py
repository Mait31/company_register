from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.wechat import RegistrationInvitation
from app.modules.registration.service import (
    apply_registration_update,
    create_registration_invitation,
    invitation_detail,
    list_registration_invitations,
)
from app.schemas.invitation import (
    AdminInvitationDetail,
    AdminInvitationListItem,
    AdminInvitationUpdate,
    InvitationCreate,
    InvitationRead,
)

router = APIRouter(prefix="/admin/invitations", tags=["admin"])


@router.post("", response_model=InvitationRead)
def create_invitation(
    payload: InvitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RegistrationInvitation:
    return create_registration_invitation(db, payload, current_user)


@router.get("", response_model=list[AdminInvitationListItem])
def list_admin_invitations(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[AdminInvitationListItem]:
    return list_registration_invitations(db)


@router.get("/{invitation_id}", response_model=AdminInvitationDetail)
def get_admin_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AdminInvitationDetail:
    invitation = db.get(RegistrationInvitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return invitation_detail(db, invitation)


@router.patch("/{invitation_id}", response_model=AdminInvitationDetail)
def update_admin_invitation(
    invitation_id: int,
    payload: AdminInvitationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AdminInvitationDetail:
    invitation = db.get(RegistrationInvitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return apply_registration_update(db, invitation, payload)


@router.post("/{invitation_id}/convert-to-order")
def convert_invitation_to_order(
    invitation_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    invitation = db.get(RegistrationInvitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return {"invitation_id": invitation.id, "status": "planned", "message": "转正式工单接口已预留"}
