from sqlalchemy.orm import Session

from app.models.wechat import InvitationParticipant, RegistrationInvitation
from app.modules.intake.repository import (
    PUBLIC_INTAKE_TOKEN,
    create_public_intake_invitation,
    get_invitation_by_token,
)
from app.schemas.invitation import ParticipantCreate, ParticipantRead


def public_intake_read_model() -> dict:
    return {
        "id": 0,
        "token": PUBLIC_INTAKE_TOKEN,
        "status": "waiting_customer",
        "allow_forward": True,
        "expires_at": None,
        "remark": "公开填写入口",
        "entry_mode": "token_only",
    }


def resolve_invitation_for_submission(db: Session, token: str) -> RegistrationInvitation | None:
    if token == PUBLIC_INTAKE_TOKEN:
        return create_public_intake_invitation(db)
    return get_invitation_by_token(db, token)


def create_participant_submission(
    db: Session,
    invitation: RegistrationInvitation,
    payload: ParticipantCreate,
) -> ParticipantRead:
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
