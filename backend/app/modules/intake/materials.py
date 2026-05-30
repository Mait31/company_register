from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import MaterialStatus
from app.models.file import StoredFile
from app.models.material import InvitationMaterial
from app.models.user import User
from app.models.wechat import RegistrationInvitation
from app.schemas.invitation import (
    InvitationMaterialFileRead,
    InvitationMaterialRead,
    InvitationMaterialSummary,
)

MAX_UPLOAD_SIZE = 20 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}

REQUIRED_MATERIALS = [
    {
        "material_type": "passport_translation",
        "material_name": "护照翻译件",
        "description": "请上传清晰的护照翻译件，支持 PDF、JPG、PNG。",
    },
    {
        "material_type": "pin_code",
        "material_name": "PIN 码",
        "description": "请上传 PIN 码截图或扫描件。",
    },
    {
        "material_type": "landing_signature",
        "material_name": "落地签",
        "description": "请上传落地签页面或相关签证材料。",
    },
]


def material_description(material_type: str) -> str:
    for item in REQUIRED_MATERIALS:
        if item["material_type"] == material_type:
            return item["description"]
    return ""


def ensure_invitation_materials(
    db: Session,
    invitation: RegistrationInvitation,
) -> list[InvitationMaterial]:
    existing = {
        material.material_type: material
        for material in db.query(InvitationMaterial)
        .filter(InvitationMaterial.invitation_id == invitation.id)
        .all()
    }
    created = False
    for item in REQUIRED_MATERIALS:
        if item["material_type"] not in existing:
            material = InvitationMaterial(
                invitation_id=invitation.id,
                material_type=item["material_type"],
                material_name=item["material_name"],
                required=True,
                status=MaterialStatus.MISSING.value,
            )
            db.add(material)
            existing[item["material_type"]] = material
            created = True
    if created:
        db.flush()
    return [existing[item["material_type"]] for item in REQUIRED_MATERIALS]


def get_invitation_material(
    db: Session,
    invitation: RegistrationInvitation,
    material_type: str,
) -> InvitationMaterial:
    materials = ensure_invitation_materials(db, invitation)
    for material in materials:
        if material.material_type == material_type:
            return material
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="材料类型不存在")


def material_to_read(db: Session, material: InvitationMaterial) -> InvitationMaterialRead:
    file_read = None
    if material.file_id:
        stored_file = db.get(StoredFile, material.file_id)
        if stored_file:
            file_read = InvitationMaterialFileRead(
                id=stored_file.id,
                file_name=stored_file.file_name,
                file_ext=stored_file.file_ext,
                mime_type=stored_file.mime_type,
                file_size=stored_file.file_size,
                uploaded_at=stored_file.created_at,
            )

    return InvitationMaterialRead(
        id=material.id,
        material_type=material.material_type,
        material_name=material.material_name,
        description=material_description(material.material_type),
        required=material.required,
        status=material.status,
        review_comment=material.review_comment,
        reviewed_at=material.reviewed_at,
        file=file_read,
    )


def material_summary(
    db: Session,
    invitation: RegistrationInvitation,
) -> InvitationMaterialSummary:
    materials = ensure_invitation_materials(db, invitation)
    read_materials = [material_to_read(db, material) for material in materials]
    return InvitationMaterialSummary(
        invitation_id=invitation.id,
        token=invitation.token,
        status=invitation.status,
        total=len(read_materials),
        uploaded=sum(1 for material in read_materials if material.file is not None),
        approved=sum(1 for material in read_materials if material.status == MaterialStatus.APPROVED.value),
        rejected=sum(1 for material in read_materials if material.status == MaterialStatus.REJECTED.value),
        missing=sum(1 for material in read_materials if material.file is None),
        materials=read_materials,
    )


def save_upload_file(
    upload: UploadFile,
    invitation: RegistrationInvitation,
    material_type: str,
) -> tuple[Path, int]:
    original_name = upload.filename or "material"
    suffix = Path(original_name).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="仅支持 PDF、JPG、PNG、WEBP 文件",
        )

    target_dir = Path(settings.storage_root) / "invitations" / str(invitation.id) / material_type
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / f"{uuid4().hex}{suffix}"

    size = 0
    with target_path.open("wb") as output:
        while True:
            chunk = upload.file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_UPLOAD_SIZE:
                target_path.unlink(missing_ok=True)
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="文件不能超过 20MB")
            output.write(chunk)

    return target_path, size


def upload_invitation_material(
    db: Session,
    invitation: RegistrationInvitation,
    material_type: str,
    upload: UploadFile,
) -> InvitationMaterialSummary:
    material = get_invitation_material(db, invitation, material_type)
    storage_path, file_size = save_upload_file(upload, invitation, material_type)
    original_name = upload.filename or f"{material_type}{storage_path.suffix}"
    stored_file = StoredFile(
        order_id=invitation.order_id,
        owner_type="invitation_material",
        owner_id=material.id,
        file_name=original_name,
        file_ext=storage_path.suffix.lstrip(".") or None,
        mime_type=upload.content_type,
        file_size=file_size,
        storage_path=str(storage_path),
        uploaded_by=None,
    )
    db.add(stored_file)
    db.flush()

    material.file_id = stored_file.id
    material.status = MaterialStatus.UPLOADED.value
    material.review_comment = None
    material.reviewed_by = None
    material.reviewed_at = None
    invitation.status = "pending_internal_confirm"
    db.commit()
    db.refresh(invitation)
    return material_summary(db, invitation)


def submit_invitation_materials(
    db: Session,
    invitation: RegistrationInvitation,
) -> InvitationMaterialSummary:
    summary = material_summary(db, invitation)
    if summary.missing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="请先上传全部必需材料")
    invitation.status = "pending_internal_confirm"
    db.commit()
    db.refresh(invitation)
    return material_summary(db, invitation)


def review_invitation_material(
    db: Session,
    invitation: RegistrationInvitation,
    material_type: str,
    review_status: str,
    review_comment: str | None,
    current_user: User,
) -> InvitationMaterialSummary:
    material = get_invitation_material(db, invitation, material_type)
    if not material.file_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="材料尚未上传")

    material.status = review_status
    material.review_comment = review_comment
    material.reviewed_by = current_user.id
    material.reviewed_at = datetime.now(timezone.utc)

    materials = ensure_invitation_materials(db, invitation)
    if review_status == MaterialStatus.REJECTED.value:
        invitation.status = "waiting_customer"
    elif all(item.status == MaterialStatus.APPROVED.value for item in materials):
        invitation.status = "completed"
    else:
        invitation.status = "pending_internal_confirm"

    db.commit()
    db.refresh(invitation)
    return material_summary(db, invitation)


def stored_file_for_material(
    db: Session,
    invitation: RegistrationInvitation,
    material_type: str,
) -> StoredFile:
    material = get_invitation_material(db, invitation, material_type)
    if not material.file_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="材料文件不存在")
    stored_file = db.get(StoredFile, material.file_id)
    if not stored_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="材料文件不存在")
    return stored_file
