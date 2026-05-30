from pathlib import Path

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.wechat import RegistrationInvitation
from app.modules.intake.repository import PUBLIC_INTAKE_TOKEN, get_invitation_by_token
from app.modules.intake.materials import (
    material_summary,
    review_invitation_material,
    stored_file_for_material,
    submit_invitation_materials,
    upload_invitation_material,
)
from app.modules.intake.service import (
    create_participant_submission,
    public_intake_read_model,
    resolve_invitation_for_submission,
)
from app.schemas.invitation import (
    InvitationMaterialReview,
    InvitationMaterialSummary,
    InvitationRead,
    ParticipantCreate,
    ParticipantRead,
)

router = APIRouter(tags=["invitations"])


def resolve_material_invitation(db: Session, token: str):
    invitation = resolve_invitation_for_submission(db, token)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    if token == PUBLIC_INTAKE_TOKEN:
        db.commit()
        db.refresh(invitation)
    return invitation


def require_internal_api_key(x_internal_api_key: str | None = Header(default=None)) -> None:
    if settings.internal_api_key and x_internal_api_key != settings.internal_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="内部接口密钥无效")


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
    invitation = resolve_material_invitation(db, token)
    return {"invitation_id": invitation.id, "status": "planned", "message": "请使用材料专用上传接口"}


@router.get("/invitations/{token}/materials", response_model=InvitationMaterialSummary)
def get_invitation_materials(token: str, db: Session = Depends(get_db)) -> InvitationMaterialSummary:
    invitation = resolve_material_invitation(db, token)
    return material_summary(db, invitation)


@router.post("/invitations/{token}/materials/{material_type}/files", response_model=InvitationMaterialSummary)
def upload_material_file(
    token: str,
    material_type: str,
    upload: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> InvitationMaterialSummary:
    invitation = resolve_material_invitation(db, token)
    return upload_invitation_material(db, invitation, material_type, upload)


@router.post("/invitations/{token}/materials/submit", response_model=InvitationMaterialSummary)
def submit_materials(token: str, db: Session = Depends(get_db)) -> InvitationMaterialSummary:
    invitation = resolve_material_invitation(db, token)
    return submit_invitation_materials(db, invitation)


@router.get("/admin/invitations/{invitation_id}/materials", response_model=InvitationMaterialSummary)
def get_admin_invitation_materials(
    invitation_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> InvitationMaterialSummary:
    invitation = db.get(RegistrationInvitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return material_summary(db, invitation)


@router.post(
    "/admin/invitations/{invitation_id}/materials/{material_type}/review",
    response_model=InvitationMaterialSummary,
)
def review_admin_invitation_material(
    invitation_id: int,
    material_type: str,
    payload: InvitationMaterialReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> InvitationMaterialSummary:
    invitation = db.get(RegistrationInvitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return review_invitation_material(
        db,
        invitation,
        material_type,
        payload.status,
        payload.review_comment,
        current_user,
    )


@router.get("/public/invitations/{token}/materials", response_model=InvitationMaterialSummary)
def get_public_invitation_materials(
    token: str,
    x_internal_api_key: str | None = Depends(require_internal_api_key),
    db: Session = Depends(get_db),
) -> InvitationMaterialSummary:
    invitation = get_invitation_by_token(db, token)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return material_summary(db, invitation)


@router.get("/public/invitations/{token}/materials/{material_type}/file")
def download_public_invitation_material(
    token: str,
    material_type: str,
    x_internal_api_key: str | None = Depends(require_internal_api_key),
    db: Session = Depends(get_db),
) -> FileResponse:
    invitation = get_invitation_by_token(db, token)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    stored_file = stored_file_for_material(db, invitation, material_type)
    path = Path(stored_file.storage_path)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="材料文件不存在")
    return FileResponse(path, media_type=stored_file.mime_type, filename=stored_file.file_name)


@router.post("/invitations/{token}/bind-wechat")
def bind_wechat(token: str, db: Session = Depends(get_db)) -> dict:
    invitation = get_invitation_by_token(db, token)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    return {"invitation_id": invitation.id, "status": "planned", "message": "微信公众号身份绑定待联调"}
