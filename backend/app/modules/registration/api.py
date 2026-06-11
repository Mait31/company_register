from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.file import StoredFile
from app.models.user import User
from app.models.wechat import RegistrationInvitation
from app.modules.registration.service import (
    InvitationConversionError,
    apply_registration_update,
    convert_registration_invitation_to_order,
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
from app.schemas.order import OrderRead
from app.services.document_generation import DocumentGenerationError, generate_invitation_documents

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
    current_user: User = Depends(get_current_user),
) -> OrderRead:
    invitation = db.get(RegistrationInvitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    try:
        return convert_registration_invitation_to_order(db, invitation, current_user)
    except InvitationConversionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{invitation_id}/generate-documents")
def generate_invitation_power_attorney_documents(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    invitation = db.get(RegistrationInvitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")
    try:
        files, missing_fields = generate_invitation_documents(db, invitation, current_user)
    except DocumentGenerationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return {
        "invitation_id": invitation.id,
        "status": "generated",
        "message": "已基于 Word 模板生成委托书内部草稿；正式公证内容仍需由公证员系统出具",
        "missing_fields": missing_fields,
        "documents": [
            {
                "file_id": file.id,
                "document_type": "kg_power_attorney_draft",
                "document_name": file.file_name,
                "template_id": "kg_power_attorney_ru_v1",
                "generated_at": file.created_at,
                "download_url": f"/api/admin/invitations/{invitation.id}/generated-documents/{file.id}",
            }
            for file in files
        ],
    }


@router.get("/{invitation_id}/generated-documents/{file_id}")
def download_invitation_generated_document(
    invitation_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> FileResponse:
    invitation = db.get(RegistrationInvitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="邀请不存在")

    stored_file = db.get(StoredFile, file_id)
    if (
        not stored_file
        or stored_file.owner_type != "invitation_generated_document"
        or stored_file.owner_id != invitation.id
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="生成文件不存在")

    path = Path(stored_file.storage_path)
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="生成文件不存在")
    return FileResponse(path, media_type=stored_file.mime_type, filename=stored_file.file_name)
