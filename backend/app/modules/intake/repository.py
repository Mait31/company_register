from secrets import token_urlsafe

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.wechat import InvitationParticipant, RegistrationInvitation

PUBLIC_INTAKE_TOKEN = "company-registration"


def latest_participant(db: Session, invitation_id: int) -> InvitationParticipant | None:
    return (
        db.query(InvitationParticipant)
        .filter(InvitationParticipant.invitation_id == invitation_id)
        .order_by(InvitationParticipant.id.desc())
        .first()
    )


def company_name(fields: dict | None) -> str | None:
    if not fields:
        return None
    for key in ("full_company_name", "company_name_1", "company_name_2", "company_name_3"):
        value = fields.get(key)
        if value:
            return str(value)
    return None


def get_invitation_by_token(db: Session, token: str) -> RegistrationInvitation | None:
    return db.query(RegistrationInvitation).filter(RegistrationInvitation.token == token).first()


def public_sales_user_id(db: Session) -> int:
    user = db.query(User).order_by(User.id.asc()).first()
    if user:
        return user.id

    user = User(name="公开填写入口", role="admin", status="active")
    db.add(user)
    db.flush()
    return user.id


def create_public_intake_invitation(db: Session) -> RegistrationInvitation:
    invitation = RegistrationInvitation(
        token=token_urlsafe(32),
        sales_user_id=public_sales_user_id(db),
        status="pending_internal_confirm",
        remark="公开填写入口自动创建",
        allow_forward=True,
    )
    db.add(invitation)
    db.flush()
    return invitation
