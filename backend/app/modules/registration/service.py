from secrets import token_urlsafe
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import re

from sqlalchemy.orm import Session

from app.models.company import CompanyDraft
from app.models.enums import MaterialStatus, OrderStatus
from app.models.file import StoredFile
from app.models.log import AuditLog, WorkflowLog
from app.models.material import InvitationMaterial, OrderMaterial
from app.models.order import RegistrationOrder
from app.models.person import Person
from app.models.user import Customer
from app.models.user import User
from app.models.wechat import InvitationParticipant, RegistrationInvitation
from app.modules.intake.materials import REQUIRED_MATERIALS, existing_invitation_materials
from app.modules.intake.repository import company_name, latest_participant
from app.schemas.invitation import (
    AdminInvitationDetail,
    AdminInvitationListItem,
    AdminInvitationUpdate,
    InvitationCreate,
)
from app.schemas.order import OrderRead


class InvitationConversionError(ValueError):
    pass


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


def make_order_no() -> str:
    return "CR" + datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")


def parse_capital_amount(value: object) -> Decimal | None:
    if value in (None, ""):
        return None
    match = re.search(r"\d+(?:\.\d+)?", str(value).replace(",", ""))
    if not match:
        return None
    try:
        return Decimal(match.group(0))
    except InvalidOperation:
        return None


def parse_capital_currency(value: object) -> str | None:
    if not value:
        return None
    text = str(value).upper()
    for currency in ("USD", "KGS", "RUB", "CNY", "EUR"):
        if currency in text:
            return currency
    return None


def approved_required_materials(db: Session, invitation: RegistrationInvitation) -> list[InvitationMaterial]:
    required_types = {item["material_type"] for item in REQUIRED_MATERIALS}
    materials = existing_invitation_materials(db, invitation)
    by_type = {material.material_type: material for material in materials}
    missing_types = required_types - set(by_type)
    if missing_types:
        raise InvitationConversionError("委托书材料收集尚未完成")

    for material_type in required_types:
        material = by_type[material_type]
        if material.status != MaterialStatus.APPROVED.value:
            raise InvitationConversionError("委托书材料必须全部审核通过后才能转正式工单")
        if not material.file_id:
            raise InvitationConversionError("委托书材料文件缺失")

    return [by_type[item["material_type"]] for item in REQUIRED_MATERIALS]


def create_customer_from_invitation(
    db: Session,
    invitation: RegistrationInvitation,
    fields: dict,
) -> Customer:
    if invitation.customer_id:
        customer = db.get(Customer, invitation.customer_id)
        if customer:
            return customer

    customer = Customer(
        name=str(fields.get("name") or "未命名客户"),
        mobile=fields.get("mobile"),
        current_visa_type=fields.get("visa_type"),
        source="registration_invitation",
        remark=invitation.remark,
    )
    db.add(customer)
    db.flush()
    invitation.customer_id = customer.id
    return customer


def create_company_draft_from_fields(db: Session, order: RegistrationOrder, fields: dict) -> None:
    db.add(
        CompanyDraft(
            order_id=order.id,
            company_name_1=fields.get("company_name_1") or fields.get("full_company_name"),
            company_name_2=fields.get("company_name_2"),
            company_name_3=fields.get("company_name_3"),
            legal_address=fields.get("legal_address"),
            registered_capital_amount=parse_capital_amount(fields.get("registered_capital")),
            registered_capital_currency=parse_capital_currency(fields.get("registered_capital")),
            business_scope=fields.get("business_scope"),
            tax_regime=fields.get("tax_regime"),
        )
    )


def create_person_from_fields(db: Session, order: RegistrationOrder, fields: dict) -> None:
    person_name = fields.get("director_name") or fields.get("name")
    if not person_name:
        return

    db.add(
        Person(
            order_id=order.id,
            name=str(person_name),
            mobile=fields.get("director_phone") or fields.get("mobile"),
            residential_address=fields.get("director_address"),
            current_visa_type=fields.get("visa_type"),
            is_director=bool(fields.get("director_name")),
            is_contact_person=True,
        )
    )


def copy_invitation_materials_to_order(
    db: Session,
    order: RegistrationOrder,
    materials: list[InvitationMaterial],
) -> None:
    for material in materials:
        if material.file_id:
            stored_file = db.get(StoredFile, material.file_id)
            if stored_file:
                stored_file.order_id = order.id
        db.add(
            OrderMaterial(
                order_id=order.id,
                material_type=material.material_type,
                material_name=material.material_name,
                required=material.required,
                status=material.status,
                file_id=material.file_id,
                review_comment=material.review_comment,
                reviewed_by=material.reviewed_by,
                reviewed_at=material.reviewed_at,
            )
        )


def convert_registration_invitation_to_order(
    db: Session,
    invitation: RegistrationInvitation,
    current_user: User,
) -> OrderRead:
    if invitation.order_id:
        order = db.get(RegistrationOrder, invitation.order_id)
        if not order:
            raise InvitationConversionError("邀请已关联的正式工单不存在")
        return OrderRead.model_validate(order)

    if invitation.status != "completed":
        raise InvitationConversionError("客户基础资料归档后才能转正式工单")

    participant = latest_participant(db, invitation.id)
    if not participant or not participant.submitted_fields_json:
        raise InvitationConversionError("客户基础资料缺失")

    materials = approved_required_materials(db, invitation)
    fields = participant.submitted_fields_json
    customer = create_customer_from_invitation(db, invitation, fields)

    order = RegistrationOrder(
        order_no=make_order_no(),
        customer_id=customer.id,
        sales_user_id=invitation.sales_user_id,
        assigned_user_id=current_user.id,
        status=OrderStatus.DRAFT.value,
        need_registered_address=bool(fields.get("need_registered_address")),
        need_bank_account=bool(fields.get("need_bank_account")),
        need_accounting=bool(fields.get("need_accounting")),
        need_work_permit_later=bool(fields.get("visa_type")),
        remark=invitation.remark,
    )
    db.add(order)
    db.flush()

    create_company_draft_from_fields(db, order, fields)
    create_person_from_fields(db, order, fields)
    copy_invitation_materials_to_order(db, order, materials)

    invitation.order_id = order.id
    db.add(
        WorkflowLog(
            order_id=order.id,
            from_status=None,
            to_status=order.status,
            operator_id=current_user.id,
            comment="前置资料和委托书材料审核通过后转正式工单",
        )
    )
    db.add(
        AuditLog(
            user_id=current_user.id,
            action="convert_invitation_to_order",
            target_type="registration_invitation",
            target_id=invitation.id,
            before_json={"invitation_id": invitation.id, "order_id": None},
            after_json={
                "invitation_id": invitation.id,
                "order_id": order.id,
                "submitted_fields_json": fields,
                "material_ids": [material.id for material in materials],
            },
            ip=None,
        )
    )
    db.commit()
    db.refresh(order)
    return OrderRead.model_validate(order)
