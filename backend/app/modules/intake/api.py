from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.modules.intake.repository import PUBLIC_INTAKE_TOKEN, get_invitation_by_token
from app.modules.intake.service import (
    create_participant_submission,
    public_intake_read_model,
    resolve_invitation_for_submission,
)
from app.schemas.invitation import InvitationRead, ParticipantCreate, ParticipantRead

router = APIRouter(tags=["invitations"])


@router.get("/invitations/{token}", response_model=InvitationRead)
def get_invitation(token: str, db: Session = Depends(get_db)):
    if token == PUBLIC_INTAKE_TOKEN:
        return public_intake_read_model()

    invitation = get_invitation_by_token(db, token)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return invitation


@router.post("/invitations/{token}/participants")
def create_participant(
    token: str,
    payload: ParticipantCreate,
    db: Session = Depends(get_db),
) -> ParticipantRead:
    invitation = resolve_invitation_for_submission(db, token)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return create_participant_submission(db, invitation, payload)


@router.patch("/invitations/{token}/customer")
def save_invitation_customer(token: str, db: Session = Depends(get_db)) -> dict:
    invitation = get_invitation_by_token(db, token)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return {"invitation_id": invitation.id, "status": "planned", "message": "客户草稿保存接口已预留"}


@router.patch("/invitations/{token}/company")
def save_invitation_company(token: str, db: Session = Depends(get_db)) -> dict:
    invitation = get_invitation_by_token(db, token)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return {"invitation_id": invitation.id, "status": "planned", "message": "公司草稿保存接口已预留"}


@router.post("/invitations/{token}/files")
def upload_invitation_file(token: str, db: Session = Depends(get_db)) -> dict:
    invitation = get_invitation_by_token(db, token)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return {"invitation_id": invitation.id, "status": "planned", "message": "邀请材料上传接口已预留"}


@router.post("/invitations/{token}/bind-wechat")
def bind_wechat(token: str, db: Session = Depends(get_db)) -> dict:
    invitation = get_invitation_by_token(db, token)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return {"invitation_id": invitation.id, "status": "planned", "message": "微信公众号身份绑定待联调"}
