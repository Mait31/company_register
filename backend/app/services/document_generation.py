from dataclasses import dataclass
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
import re
from uuid import uuid4
from zipfile import ZIP_DEFLATED, ZipFile
from xml.sax.saxutils import escape as xml_escape

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.company import CompanyDraft
from app.models.document import GeneratedDocument
from app.models.file import StoredFile
from app.models.enums import MaterialStatus
from app.models.order import RegistrationOrder
from app.models.person import Person
from app.models.user import Customer, User
from app.models.wechat import RegistrationInvitation
from app.modules.intake.materials import REQUIRED_MATERIALS, existing_invitation_materials
from app.modules.intake.repository import latest_participant
from app.services.power_attorney_config import KG_POWER_ATTORNEY_CONFIG


KG_POWER_OF_ATTORNEY_TEMPLATE_ID = "kg_power_attorney_ru_v1"
KG_POWER_OF_ATTORNEY_DOCUMENT_TYPE = "kg_power_attorney_draft"
KG_POWER_OF_ATTORNEY_DOCUMENT_NAME = "吉尔吉斯公司注册委托书（内部草稿）"
KG_POWER_OF_ATTORNEY_DOCX_TEMPLATE_PATH = (
    Path(__file__).resolve().parents[1] / "templates" / "KG_POWER_OF_ATTORNEY_TEMPLATE_RU.docx"
)
DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
FIELD_KEY_PATTERN = re.compile(r"^[a-z][a-z0-9_]*$")
DOCX_PLACEHOLDER_PATTERN = re.compile(r"\{\{\s*([a-z][a-z0-9_]*)\s*\}\}")


class DocumentGenerationError(ValueError):
    pass


@dataclass(frozen=True)
class RenderedDocxDocument:
    content: bytes
    missing_fields: list[str]


def first_present(*values: object) -> str | None:
    for value in values:
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return None


def country_genitive(value: str | None) -> str | None:
    if not value:
        return None
    normalized = value.strip().lower()
    if normalized in {"中国", "china", "cn", "prc", "китай", "кнр"}:
        return "Китайской Народной Республики"
    return value


def short_name(full_name: str) -> str:
    parts = full_name.split()
    if len(parts) >= 2:
        return f"{parts[0]} {parts[1][0]}."
    return full_name


def pending(label: str, missing_fields: list[str]) -> str:
    missing_fields.append(label)
    return f"[[待补：{label}]]"


def build_template_context(
    order: RegistrationOrder | None,
    customer: Customer | None,
    company: CompanyDraft | None,
    person: Person | None,
    invitation_fields: dict,
) -> tuple[dict[str, str], list[str]]:
    missing_fields: list[str] = []

    def field(label: str, *keys_or_values: object) -> str:
        values: list[object] = []
        for item in keys_or_values:
            if isinstance(item, str) and item in invitation_fields:
                values.append(invitation_fields.get(item))
            elif isinstance(item, str) and FIELD_KEY_PATTERN.match(item):
                continue
            else:
                values.append(item)
        return first_present(*values) or pending(label, missing_fields)

    principal_name = field(
        "委托人俄文姓名",
        "principal_full_name_ru",
        "applicant_name_ru",
        "director_name_ru",
        person.name_en if person else None,
        "name",
        customer.name if customer else None,
    )
    principal_country = country_genitive(
        first_present(
            invitation_fields.get("principal_country_genitive"),
            invitation_fields.get("nationality_ru_genitive"),
            invitation_fields.get("nationality"),
            customer.nationality if customer else None,
        )
    ) or pending("委托人国籍俄文属格", missing_fields)

    company_name = first_present(
        invitation_fields.get("company_name_ru"),
        invitation_fields.get("full_company_name"),
        invitation_fields.get("company_name_1"),
        company.company_name_1 if company else None,
    )
    if company_name:
        company_name_clause = f'с фирменным наименованием "{company_name}"'
    else:
        company_name_clause = "с фирменным наименованием на усмотрение поверенного"

    notary_config = KG_POWER_ATTORNEY_CONFIG["notary"]
    agent_config = KG_POWER_ATTORNEY_CONFIG["agent"]
    translator_config = KG_POWER_ATTORNEY_CONFIG["translator"]
    validity_config = KG_POWER_ATTORNEY_CONFIG["validity"]
    certification_config = KG_POWER_ATTORNEY_CONFIG["notary_certification"]

    notary_place_line = first_present(
        invitation_fields.get("notary_place_line"),
        invitation_fields.get("notary_place"),
        f"{notary_config['place_line']}\n{notary_config['phone_line']}",
    )
    agent_full_name = field(
        "受托人俄文姓名",
        "agent_full_name_ru",
        "proxy_full_name_ru",
        agent_config["full_name_ru"],
    )
    translator_full_name = field(
        "翻译人员俄文姓名",
        "translator_full_name_ru",
        translator_config["full_name_ru"],
    )

    context = {
        "notary_place_line": field("公证地点", notary_place_line),
        "notary_date_text": field("公证日期", "notary_date_text"),
        "principal_country_genitive": principal_country,
        "principal_full_name_ru": principal_name,
        "principal_birth_date_text": field("委托人出生日期文字", "principal_birth_date_text", "birth_date"),
        "principal_passport_country_code": field(
            "委托人护照国家代码",
            "principal_passport_country_code",
            "passport_country_code",
            "КНР" if "Китай" in principal_country else None,
        ),
        "principal_passport_number": field("委托人护照号", "principal_passport_number", "passport_no", person.passport_no if person else None),
        "principal_passport_issued_by": field("委托人护照签发机关", "principal_passport_issued_by", "passport_issued_by"),
        "principal_passport_issue_date": field("委托人护照签发日期", "principal_passport_issue_date", "passport_issue_date"),
        "principal_registration_address": field(
            "委托人吉尔吉斯临时登记地址",
            "principal_registration_address",
            "temporary_registration_address",
            person.residential_address if person else None,
        ),
        "principal_pin": field("委托人 PIN", "principal_pin", "pin", "foreign_pin"),
        "principal_extra_identity_line": field(
            "委托人外国人登记/身份补充信息",
            "principal_extra_identity_line",
            "extra_identity_line",
            "имеющий регистрацию иностранного гражданина",
        ),
        "agent_full_name_ru": agent_full_name,
        "agent_birth_date_text": field("受托人出生日期文字", "agent_birth_date_text", "agent_birth_date", agent_config["birth_date_text"]),
        "agent_pin": field("受托人 PIN", "agent_pin", "proxy_pin", agent_config["pin"]),
        "agent_id_card_number": field("受托人身份证 ID", "agent_id_card_number", "proxy_id_card_number", agent_config["id_card_number"]),
        "agent_id_card_issued_by": field("受托人身份证签发机关", "agent_id_card_issued_by", "proxy_id_card_issued_by", agent_config["id_card_issued_by"]),
        "agent_id_card_issue_date": field("受托人身份证签发日期", "agent_id_card_issue_date", "proxy_id_card_issue_date", agent_config["id_card_issue_date"]),
        "agent_registration_address": field("受托人登记地址", "agent_registration_address", "proxy_registration_address", agent_config["registration_address"]),
        "company_name_clause": company_name_clause,
        "validity_period_text": field("委托书有效期", "validity_period_text", validity_config["period_text"]),
        "translator_full_name_ru": translator_full_name,
        "translator_birth_date_text": field("翻译人员出生日期文字", "translator_birth_date_text", translator_config["birth_date_text"]),
        "translator_pin": field("翻译人员 PIN", "translator_pin", translator_config["pin"]),
        "translator_id_card_number": field("翻译人员身份证 ID", "translator_id_card_number", translator_config["id_card_number"]),
        "translator_id_card_issued_by": field("翻译人员身份证签发机关", "translator_id_card_issued_by", translator_config["id_card_issued_by"]),
        "translator_id_card_issue_date": field("翻译人员身份证签发日期", "translator_id_card_issue_date", translator_config["id_card_issue_date"]),
        "translator_education_institution": field("翻译人员证书/学历机构", "translator_education_institution", translator_config["education_institution"]),
        "translator_certificate_date": field("翻译人员证书日期", "translator_certificate_date", translator_config["certificate_date"]),
        "agent_full_name_short": short_name(agent_full_name),
        "principal_signature_name": principal_name,
        "notary_certification_note": certification_config["note"],
        "notary_registry_number": certification_config["registry_number"],
        "state_duty_amount": certification_config["state_duty_amount"],
        "notary_service_fee_amount": certification_config["notary_service_fee_amount"],
        "notary_certification_date_text": certification_config["date_text"],
        "notary_full_name_ru": certification_config["notary_full_name_ru"],
        "notary_district": certification_config["district"],
        "notary_license_number": certification_config["license_number"],
        "notary_license_date": certification_config["license_date"],
        "notary_license_issuer": certification_config["license_issuer"],
        "missing_fields": missing_fields,
    }
    return context, missing_fields


def render_docx_template(context: dict[str, str]) -> bytes:
    if not KG_POWER_OF_ATTORNEY_DOCX_TEMPLATE_PATH.exists():
        raise DocumentGenerationError("委托书 Word 模板不存在")

    replacements = {
        f"{{{{{key}}}}}": xml_escape(str(value))
        for key, value in context.items()
        if key != "missing_fields"
    }

    source = KG_POWER_OF_ATTORNEY_DOCX_TEMPLATE_PATH
    output = BytesIO()
    with ZipFile(source, "r") as zin, ZipFile(output, "w", ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename.startswith("word/") and item.filename.endswith(".xml"):
                text = data.decode("utf-8")
                for placeholder, value in replacements.items():
                    text = text.replace(placeholder, value)

                def replace_unknown(match: re.Match[str]) -> str:
                    field_key = match.group(1)
                    return xml_escape(f"[[待补：{field_key}]]")

                text = DOCX_PLACEHOLDER_PATTERN.sub(replace_unknown, text)
                data = text.encode("utf-8")
            zout.writestr(item, data)
    return output.getvalue()


def render_order_power_attorney_docx(db: Session, order: RegistrationOrder) -> RenderedDocxDocument:
    customer = db.get(Customer, order.customer_id) if order.customer_id else None
    company = db.query(CompanyDraft).filter(CompanyDraft.order_id == order.id).first()
    person = (
        db.query(Person)
        .filter(Person.order_id == order.id)
        .order_by(Person.is_director.desc(), Person.id.asc())
        .first()
    )
    invitation = (
        db.query(RegistrationInvitation)
        .filter(RegistrationInvitation.order_id == order.id)
        .order_by(RegistrationInvitation.id.desc())
        .first()
    )
    participant = latest_participant(db, invitation.id) if invitation else None
    invitation_fields = participant.submitted_fields_json if participant and participant.submitted_fields_json else {}

    context, missing_fields = build_template_context(order, customer, company, person, invitation_fields)
    return RenderedDocxDocument(content=render_docx_template(context), missing_fields=missing_fields)


def assert_invitation_materials_approved(db: Session, invitation: RegistrationInvitation) -> None:
    required_types = {item["material_type"] for item in REQUIRED_MATERIALS}
    materials = existing_invitation_materials(db, invitation)
    by_type = {material.material_type: material for material in materials}

    if required_types - set(by_type):
        raise DocumentGenerationError("委托书材料收集尚未发起")

    for item in REQUIRED_MATERIALS:
        material = by_type[item["material_type"]]
        if not material.file_id:
            raise DocumentGenerationError(f"{item['material_name']}尚未上传")
        if material.status != MaterialStatus.APPROVED.value:
            raise DocumentGenerationError(f"{item['material_name']}尚未审核通过")


def render_invitation_power_attorney_docx(db: Session, invitation: RegistrationInvitation) -> RenderedDocxDocument:
    participant = latest_participant(db, invitation.id)
    invitation_fields = participant.submitted_fields_json if participant and participant.submitted_fields_json else {}
    context, missing_fields = build_template_context(
        order=None,
        customer=None,
        company=None,
        person=None,
        invitation_fields=invitation_fields,
    )
    return RenderedDocxDocument(content=render_docx_template(context), missing_fields=missing_fields)


def save_invitation_generated_docx_document(
    db: Session,
    invitation: RegistrationInvitation,
    current_user: User,
    rendered: RenderedDocxDocument,
) -> StoredFile:
    target_dir = Path(settings.storage_root) / "generated_documents" / "invitations" / str(invitation.id)
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / f"{KG_POWER_OF_ATTORNEY_TEMPLATE_ID}_{uuid4().hex}.docx"
    target_path.write_bytes(rendered.content)

    stored_file = StoredFile(
        order_id=invitation.order_id,
        owner_type="invitation_generated_document",
        owner_id=invitation.id,
        file_name=f"{KG_POWER_OF_ATTORNEY_DOCUMENT_NAME}.docx",
        file_ext="docx",
        mime_type=DOCX_MIME_TYPE,
        file_size=target_path.stat().st_size,
        storage_path=str(target_path),
        uploaded_by=current_user.id,
    )
    db.add(stored_file)
    db.commit()
    db.refresh(stored_file)
    return stored_file


def generate_invitation_documents(
    db: Session,
    invitation: RegistrationInvitation,
    current_user: User,
) -> tuple[list[StoredFile], list[str]]:
    assert_invitation_materials_approved(db, invitation)
    rendered = render_invitation_power_attorney_docx(db, invitation)
    stored_file = save_invitation_generated_docx_document(db, invitation, current_user, rendered)
    return [stored_file], rendered.missing_fields


def save_generated_docx_document(
    db: Session,
    order: RegistrationOrder,
    current_user: User,
    rendered: RenderedDocxDocument,
) -> GeneratedDocument:
    target_dir = Path(settings.storage_root) / "generated_documents" / str(order.id)
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = target_dir / f"{KG_POWER_OF_ATTORNEY_TEMPLATE_ID}_{uuid4().hex}.docx"
    target_path.write_bytes(rendered.content)

    stored_file = StoredFile(
        order_id=order.id,
        owner_type="generated_document",
        owner_id=None,
        file_name=f"{KG_POWER_OF_ATTORNEY_DOCUMENT_NAME}.docx",
        file_ext="docx",
        mime_type=DOCX_MIME_TYPE,
        file_size=target_path.stat().st_size,
        storage_path=str(target_path),
        uploaded_by=current_user.id,
    )
    db.add(stored_file)
    db.flush()

    document = GeneratedDocument(
        order_id=order.id,
        document_type=KG_POWER_OF_ATTORNEY_DOCUMENT_TYPE,
        document_name=KG_POWER_OF_ATTORNEY_DOCUMENT_NAME,
        template_id=KG_POWER_OF_ATTORNEY_TEMPLATE_ID,
        file_id=stored_file.id,
        generated_by=current_user.id,
        generated_at=datetime.now(timezone.utc),
    )
    db.add(document)
    db.flush()
    stored_file.owner_id = document.id
    return document


def generate_order_documents(
    db: Session,
    order: RegistrationOrder,
    current_user: User,
) -> tuple[list[GeneratedDocument], list[str]]:
    rendered = render_order_power_attorney_docx(db, order)
    document = save_generated_docx_document(db, order, current_user, rendered)
    db.commit()
    db.refresh(document)
    return [document], rendered.missing_fields
