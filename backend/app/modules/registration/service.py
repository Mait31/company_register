from secrets import token_urlsafe

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.wechat import InvitationParticipant, RegistrationInvitation
from app.modules.intake.repository import company_name, latest_participant
from app.schemas.invitation import (
    AdminInvitationDetail,
    AdminInvitationListItem,
    AdminInvitationUpdate,
    InvitationCreate,
)


def invitation_list_item(db: Session, invitation: RegistrationInvitation) -> AdminInvitationListItem:
    participant = latest_participant(db, invitation.id)
    fields = participant.submitted_fields_json if participant else None
    return AdminInvitationListItem(
        id=invitation.id,
        token=invitation.token,
        status=invitation.status,
        remark=invitation.remark,
        company_name=company_name(fields),
        contact_name=participant.name if participant else None,
        contact_mobile=participant.mobile if participant else None,
        latest_submitted_at=participant.updated_at if participant else None,
        created_at=invitation.created_at,
        updated_at=invitation.updated_at,
    )


def invitation_detail(db: Session, invitation: RegistrationInvitation) -> AdminInvitationDetail:
    item = invitation_list_item(db, invitation)
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


def create_registration_invitation(
    db: Session,
    payload: InvitationCreate,
    current_user: User,
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


def list_registration_invitations(db: Session) -> list[AdminInvitationListItem]:
    invitations = (
        db.query(RegistrationInvitation)
        .order_by(RegistrationInvitation.id.desc())
        .limit(100)
        .all()
    )
    return [invitation_list_item(db, invitation) for invitation in invitations]


def apply_registration_update(
    db: Session,
    invitation: RegistrationInvitation,
    payload: AdminInvitationUpdate,
) -> AdminInvitationDetail:
    if payload.status is not None:
        invitation.status = payload.status
    if payload.remark is not None:
        invitation.remark = payload.remark

    if payload.submitted_fields_json is not None:
        participant = latest_participant(db, invitation.id)
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
    return invitation_detail(db, invitation)
