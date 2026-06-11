from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from zipfile import ZipFile
from xml.etree import ElementTree as ET

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.user import User
from app.services.document_generation import KG_POWER_OF_ATTORNEY_DOCX_TEMPLATE_PATH


WORD_NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def word_attr(element: ET.Element, name: str) -> str | None:
    return element.get(f"{{{WORD_NS['w']}}}{name}")


def make_client() -> TestClient:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    user = User(id=1, name="测试管理员", role="admin", status="active")
    db.add(user)
    db.commit()
    db.close()

    def override_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    def override_user():
        session = TestingSessionLocal()
        try:
            return session.get(User, 1)
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = override_user
    return TestClient(app)


def full_power_attorney_fields() -> dict:
    return {
        "name": "孙八",
        "mobile": "13400000000",
        "company_name_ru": "Test KG Company LLC",
        "full_company_name": "自动填充公司",
        "principal_full_name_ru": "SUN BA",
        "principal_birth_date_text": "01 января 1990",
        "principal_passport_country_code": "КНР",
        "principal_passport_number": "E12345678",
        "principal_passport_issued_by": "Exit Entry Administration",
        "principal_passport_issue_date": "01.01.2020",
        "principal_registration_address": "г. Бишкек",
        "principal_pin": "12345678901234",
        "nationality": "中国",
        "notary_date_text": "10 июня 2026",
    }


def test_kg_power_attorney_template_uses_compact_layout() -> None:
    with ZipFile(KG_POWER_OF_ATTORNEY_DOCX_TEMPLATE_PATH) as docx:
        document_xml = ET.fromstring(docx.read("word/document.xml"))
        styles_xml = ET.fromstring(docx.read("word/styles.xml"))

    page_margins = document_xml.find(".//w:sectPr/w:pgMar", WORD_NS)
    assert page_margins is not None
    assert int(word_attr(page_margins, "top") or 0) <= 454
    assert int(word_attr(page_margins, "bottom") or 0) <= 454
    assert int(word_attr(page_margins, "left") or 0) <= 709
    assert int(word_attr(page_margins, "right") or 0) <= 709

    normal_style = None
    for style in styles_xml.findall("w:style", WORD_NS):
        name = style.find("w:name", WORD_NS)
        if name is not None and word_attr(name, "val") == "Normal":
            normal_style = style
            break
    assert normal_style is not None

    normal_size = normal_style.find("w:rPr/w:sz", WORD_NS)
    normal_spacing = normal_style.find("w:pPr/w:spacing", WORD_NS)
    assert normal_size is not None
    assert word_attr(normal_size, "val") == "17"
    assert normal_spacing is not None
    assert word_attr(normal_spacing, "after") == "0"
    assert word_attr(normal_spacing, "line") == "190"
    assert word_attr(normal_spacing, "lineRule") == "exact"

    paragraphs = document_xml.find("w:body", WORD_NS).findall("w:p", WORD_NS)
    for index in (4, 5, 6, 7, 8, 9, 10, 11, 15, 16):
        paragraph = paragraphs[index]
        spacing = paragraph.find("w:pPr/w:spacing", WORD_NS)
        alignment = paragraph.find("w:pPr/w:jc", WORD_NS)
        indent = paragraph.find("w:pPr/w:ind", WORD_NS)
        sizes = {
            word_attr(size, "val")
            for size in paragraph.findall(".//w:rPr/w:sz", WORD_NS)
        }
        assert spacing is not None
        assert word_attr(spacing, "after") == "0"
        assert word_attr(spacing, "line") == "190"
        assert word_attr(spacing, "lineRule") == "exact"
        assert alignment is not None
        assert word_attr(alignment, "val") == "both"
        assert indent is not None
        assert word_attr(indent, "firstLine") == "360"
        assert sizes == {"17"}


def test_invitation_entry_saves_participant_fields() -> None:
    client = make_client()
    try:
        created = client.post("/api/admin/invitations", json={"remark": "精准客户邀请"})
        assert created.status_code == 200
        token = created.json()["token"]

        submitted = client.post(
            f"/api/invitations/{token}/participants",
            json={
                "role": "customer",
                "name": "张三",
                "mobile": "13800000000",
                "company_name_1": "测试公司",
                "need_bank_account": True,
            },
        )

        assert submitted.status_code == 200
        assert submitted.json()["participant_id"] > 0
    finally:
        app.dependency_overrides.clear()


def test_admin_can_track_and_update_invitation_submission() -> None:
    client = make_client()
    try:
        created = client.post("/api/admin/invitations", json={"remark": "跟进客户"})
        assert created.status_code == 200
        invitation = created.json()
        token = invitation["token"]

        submitted = client.post(
            f"/api/invitations/{token}/participants",
            json={
                "role": "customer",
                "name": "李四",
                "mobile": "13900000000",
                "full_company_name": "测试贸易有限公司",
                "registered_capital": "200000 USD",
                "need_bank_account": True,
            },
        )
        assert submitted.status_code == 200

        listed = client.get("/api/admin/invitations")
        assert listed.status_code == 200
        first = listed.json()[0]
        assert first["status"] == "pending_internal_confirm"
        assert first["company_name"] == "测试贸易有限公司"
        assert first["contact_name"] == "李四"

        updated = client.patch(
            f"/api/admin/invitations/{invitation['id']}",
            json={
                "status": "processing",
                "remark": "资料已确认，开始办理",
                "submitted_fields_json": {
                    "name": "李四",
                    "mobile": "13900000000",
                    "full_company_name": "测试贸易有限公司",
                    "registered_capital": "300000 USD",
                },
            },
        )
        assert updated.status_code == 200
        detail = updated.json()
        assert detail["status"] == "processing"
        assert detail["remark"] == "资料已确认，开始办理"
        assert detail["participants"][0]["submitted_fields_json"]["registered_capital"] == "300000 USD"
    finally:
        app.dependency_overrides.clear()


def test_public_intake_submission_creates_admin_record() -> None:
    client = make_client()
    try:
        entry = client.get("/api/invitations/company-registration")
        assert entry.status_code == 200
        assert entry.json()["token"] == "company-registration"

        submitted = client.post(
            "/api/invitations/company-registration/participants",
            json={
                "role": "customer",
                "name": "王五",
                "mobile": "13700000000",
                "full_company_name": "公开入口公司",
            },
        )
        assert submitted.status_code == 200

        listed = client.get("/api/admin/invitations")
        assert listed.status_code == 200
        rows = listed.json()
        assert rows[0]["status"] == "pending_internal_confirm"
        assert rows[0]["company_name"] == "公开入口公司"
        assert rows[0]["contact_name"] == "王五"
        assert rows[0]["token"] != "company-registration"
    finally:
        app.dependency_overrides.clear()


def test_invitation_material_upload_review_and_public_summary(tmp_path) -> None:
    client = make_client()
    original_storage_root = settings.storage_root
    settings.storage_root = str(tmp_path)
    try:
        created = client.post("/api/admin/invitations", json={"remark": "委托书材料收集"})
        assert created.status_code == 200
        invitation = created.json()
        token = invitation["token"]

        listed = client.get(f"/api/admin/invitations/{invitation['id']}/materials")
        assert listed.status_code == 200
        assert listed.json()["total"] == 0

        started = client.post(f"/api/admin/invitations/{invitation['id']}/materials/start")
        assert started.status_code == 200
        assert started.json()["total"] == 3
        assert started.json()["missing"] == 3

        uploaded = client.post(
            f"/api/invitations/{token}/materials/passport_translation/files",
            files={"upload": ("passport.pdf", b"fake pdf", "application/pdf")},
        )
        assert uploaded.status_code == 200
        uploaded_body = uploaded.json()
        assert uploaded_body["uploaded"] == 1
        assert uploaded_body["materials"][0]["status"] == "uploaded"
        assert uploaded_body["materials"][0]["file"]["file_name"] == "passport.pdf"

        reviewed = client.post(
            f"/api/admin/invitations/{invitation['id']}/materials/passport_translation/review",
            json={"status": "approved"},
        )
        assert reviewed.status_code == 200
        assert reviewed.json()["approved"] == 1

        public_summary = client.get(f"/api/public/invitations/{token}/materials")
        assert public_summary.status_code == 200
        assert public_summary.json()["materials"][0]["file"]["file_name"] == "passport.pdf"
    finally:
        settings.storage_root = original_storage_root
        app.dependency_overrides.clear()


def test_generate_documents_does_not_use_chinese_fields_for_russian_draft(tmp_path) -> None:
    client = make_client()
    original_storage_root = settings.storage_root
    settings.storage_root = str(tmp_path)
    try:
        created = client.post("/api/admin/invitations", json={"remark": "中文资料不兜底俄文委托书"})
        assert created.status_code == 200
        invitation = created.json()
        token = invitation["token"]

        submitted = client.post(
            f"/api/invitations/{token}/participants",
            json={
                "role": "customer",
                "name": "王五",
                "mobile": "13400000000",
                "full_company_name": "中文公司",
            },
        )
        assert submitted.status_code == 200

        updated = client.patch(
            f"/api/admin/invitations/{invitation['id']}",
            json={
                "status": "completed",
                "submitted_fields_json": {
                    "name": "王五",
                    "mobile": "13400000000",
                    "full_company_name": "中文公司",
                    "notary_date_text": "10 июня 2026",
                },
            },
        )
        assert updated.status_code == 200

        started = client.post(f"/api/admin/invitations/{invitation['id']}/materials/start")
        assert started.status_code == 200

        for material_type in ("passport_translation", "pin_code", "landing_signature"):
            uploaded = client.post(
                f"/api/invitations/{token}/materials/{material_type}/files",
                files={"upload": (f"{material_type}.pdf", b"fake pdf", "application/pdf")},
            )
            assert uploaded.status_code == 200
            reviewed = client.post(
                f"/api/admin/invitations/{invitation['id']}/materials/{material_type}/review",
                json={"status": "approved"},
            )
            assert reviewed.status_code == 200

        generated = client.post(f"/api/admin/invitations/{invitation['id']}/generate-documents")
        assert generated.status_code == 200
        body = generated.json()
        assert "委托人俄文姓名" in body["missing_fields"]
        assert "公司俄文名称" in body["missing_fields"]

        generated_files = list(tmp_path.glob(f"generated_documents/invitations/{invitation['id']}/*.docx"))
        assert len(generated_files) == 1
        with ZipFile(generated_files[0]) as docx:
            content = docx.read("word/document.xml").decode("utf-8")
        assert "王五" not in content
        assert "中文公司" not in content
        assert "待补：委托人俄文姓名" in content
        assert "待补：公司俄文名称" in content
    finally:
        settings.storage_root = original_storage_root
        app.dependency_overrides.clear()


def test_generate_documents_prefills_zhang_qing_sample_material_defaults(tmp_path) -> None:
    client = make_client()
    original_storage_root = settings.storage_root
    settings.storage_root = str(tmp_path)
    try:
        created = client.post("/api/admin/invitations", json={"remark": "张青测试材料默认值"})
        assert created.status_code == 200
        invitation = created.json()
        token = invitation["token"]

        submitted = client.post(
            f"/api/invitations/{token}/participants",
            json={
                "role": "customer",
                "name": "张青",
                "mobile": "13400000000",
                "full_company_name": "wlch公司",
            },
        )
        assert submitted.status_code == 200

        updated = client.patch(
            f"/api/admin/invitations/{invitation['id']}",
            json={
                "status": "completed",
                "submitted_fields_json": {
                    "name": "张青",
                    "mobile": "13400000000",
                    "full_company_name": "wlch公司",
                    "notary_date_text": "10 июня 2026",
                },
            },
        )
        assert updated.status_code == 200

        started = client.post(f"/api/admin/invitations/{invitation['id']}/materials/start")
        assert started.status_code == 200

        for material_type in ("passport_translation", "pin_code", "landing_signature"):
            uploaded = client.post(
                f"/api/invitations/{token}/materials/{material_type}/files",
                files={"upload": (f"{material_type}.pdf", b"fake pdf", "application/pdf")},
            )
            assert uploaded.status_code == 200
            reviewed = client.post(
                f"/api/admin/invitations/{invitation['id']}/materials/{material_type}/review",
                json={"status": "approved"},
            )
            assert reviewed.status_code == 200

        generated = client.post(f"/api/admin/invitations/{invitation['id']}/generate-documents")
        assert generated.status_code == 200
        body = generated.json()
        assert "委托人俄文姓名" not in body["missing_fields"]
        assert "公司俄文名称" not in body["missing_fields"]

        generated_files = list(tmp_path.glob(f"generated_documents/invitations/{invitation['id']}/*.docx"))
        assert len(generated_files) == 1
        with ZipFile(generated_files[0]) as docx:
            content = docx.read("word/document.xml").decode("utf-8")
        assert "ZHANG QING" in content
        assert "16 июля 1984" in content
        assert "EJ1917775" in content
        assert "21607198440038" in content
        assert "Буденного" in content
        assert "WLCH LLC" in content
        assert "张青" not in content
        assert "wlch公司" not in content
    finally:
        settings.storage_root = original_storage_root
        app.dependency_overrides.clear()


def test_convert_invitation_to_order_requires_approved_materials(tmp_path) -> None:
    client = make_client()
    original_storage_root = settings.storage_root
    settings.storage_root = str(tmp_path)
    try:
        created = client.post("/api/admin/invitations", json={"remark": "转正式工单"})
        assert created.status_code == 200
        invitation = created.json()

        submitted = client.post(
            f"/api/invitations/{invitation['token']}/participants",
            json={
                "role": "customer",
                "name": "赵六",
                "mobile": "13600000000",
                "full_company_name": "桥接测试公司",
                "registered_capital": "100000 USD",
                "director_name": "赵六",
                "director_phone": "13600000000",
                "need_bank_account": True,
            },
        )
        assert submitted.status_code == 200

        updated = client.patch(
            f"/api/admin/invitations/{invitation['id']}",
            json={"status": "completed"},
        )
        assert updated.status_code == 200

        converted = client.post(f"/api/admin/invitations/{invitation['id']}/convert-to-order")
        assert converted.status_code == 400
        assert "委托书材料" in converted.json()["detail"]
    finally:
        settings.storage_root = original_storage_root
        app.dependency_overrides.clear()


def test_convert_invitation_to_order_creates_registration_order(tmp_path) -> None:
    client = make_client()
    original_storage_root = settings.storage_root
    settings.storage_root = str(tmp_path)
    try:
        created = client.post("/api/admin/invitations", json={"remark": "完整转单"})
        assert created.status_code == 200
        invitation = created.json()
        token = invitation["token"]

        submitted = client.post(
            f"/api/invitations/{token}/participants",
            json={
                "role": "customer",
                "name": "钱七",
                "mobile": "13500000000",
                "full_company_name": "正式工单公司",
                "legal_address": "Bishkek",
                "registered_capital": "250000 USD",
                "director_name": "钱七",
                "director_phone": "13500000000",
                "director_address": "Bishkek",
                "business_scope": "Trade service",
                "tax_regime": "single_tax",
                "need_bank_account": True,
            },
        )
        assert submitted.status_code == 200

        updated = client.patch(
            f"/api/admin/invitations/{invitation['id']}",
            json={"status": "completed"},
        )
        assert updated.status_code == 200

        started = client.post(f"/api/admin/invitations/{invitation['id']}/materials/start")
        assert started.status_code == 200

        for material_type in ("passport_translation", "pin_code", "landing_signature"):
            uploaded = client.post(
                f"/api/invitations/{token}/materials/{material_type}/files",
                files={"upload": (f"{material_type}.pdf", b"fake pdf", "application/pdf")},
            )
            assert uploaded.status_code == 200
            reviewed = client.post(
                f"/api/admin/invitations/{invitation['id']}/materials/{material_type}/review",
                json={"status": "approved"},
            )
            assert reviewed.status_code == 200

        converted = client.post(f"/api/admin/invitations/{invitation['id']}/convert-to-order")
        assert converted.status_code == 200
        order = converted.json()
        assert order["id"] > 0
        assert order["status"] == "draft"
        assert order["order_no"].startswith("CR")

        orders = client.get("/api/admin/orders")
        assert orders.status_code == 200
        assert len(orders.json()) == 1
        assert orders.json()[0]["id"] == order["id"]

        converted_again = client.post(f"/api/admin/invitations/{invitation['id']}/convert-to-order")
        assert converted_again.status_code == 200
        assert converted_again.json()["id"] == order["id"]

        orders_again = client.get("/api/admin/orders")
        assert len(orders_again.json()) == 1
    finally:
        settings.storage_root = original_storage_root
        app.dependency_overrides.clear()


def test_generate_documents_autofills_kg_power_attorney_draft(tmp_path) -> None:
    client = make_client()
    original_storage_root = settings.storage_root
    settings.storage_root = str(tmp_path)
    try:
        created = client.post("/api/admin/invitations", json={"remark": "委托书自动填充"})
        assert created.status_code == 200
        invitation = created.json()
        token = invitation["token"]

        submitted = client.post(
            f"/api/invitations/{token}/participants",
            json={
                "role": "customer",
                "name": "孙八",
                "mobile": "13400000000",
                "full_company_name": "自动填充公司",
            },
        )
        assert submitted.status_code == 200

        updated = client.patch(
            f"/api/admin/invitations/{invitation['id']}",
            json={
                "status": "completed",
                "submitted_fields_json": full_power_attorney_fields(),
            },
        )
        assert updated.status_code == 200

        started = client.post(f"/api/admin/invitations/{invitation['id']}/materials/start")
        assert started.status_code == 200

        for material_type in ("passport_translation", "pin_code", "landing_signature"):
            uploaded = client.post(
                f"/api/invitations/{token}/materials/{material_type}/files",
                files={"upload": (f"{material_type}.pdf", b"fake pdf", "application/pdf")},
            )
            assert uploaded.status_code == 200
            reviewed = client.post(
                f"/api/admin/invitations/{invitation['id']}/materials/{material_type}/review",
                json={"status": "approved"},
            )
            assert reviewed.status_code == 200

        generated = client.post(f"/api/admin/invitations/{invitation['id']}/generate-documents")
        assert generated.status_code == 200
        body = generated.json()
        assert body["invitation_id"] == invitation["id"]
        assert body["status"] == "generated"
        document = body["documents"][0]
        assert document["document_type"] == "kg_power_attorney_draft"
        assert document["template_id"] == "kg_power_attorney_ru_v1"
        assert document["download_url"] == f"/api/admin/invitations/{invitation['id']}/generated-documents/{document['file_id']}"
        assert body["missing_fields"] == []

        generated_files = list(tmp_path.glob(f"generated_documents/invitations/{invitation['id']}/*.docx"))
        assert len(generated_files) == 1
        with ZipFile(generated_files[0]) as docx:
            content = docx.read("word/document.xml").decode("utf-8")
        assert "{{" not in content
        assert "ДОВЕРЕННОСТЬ" in content
        assert "Кыргызской Республики" in content
        assert "SUN BA" in content
        assert "01 января 1990" in content
        assert "КНР" in content
        assert "г. Бишкек" in content
        assert "Test KG Company LLC" in content
        assert "Улужбек уулу Уланбек" in content
        assert "Кадырбаевым Илизом Кадырбаевичем" in content
        assert "Кадырбаева Ильиза Кадырбаевича" in content
        assert "Синьского университета Китайской Народной Республики" in content
        assert "№ 2017019" in content
        assert "Жаманкуловым Алнуром Токтомушатовичем" in content
        assert "нотариального округа города Бишкек Кыргызской Республики" in content
        assert "лицензии № 622, выданной МЮ КР от 11.04.2013 года" in content
        assert "ул. Колбаева" in content
        assert "由公证员系统生成" in content
        assert "<w:br/>" in content
        assert "岐" not in content

        downloaded = client.get(document["download_url"])
        assert downloaded.status_code == 200
        assert downloaded.headers["content-type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        assert downloaded.content.startswith(b"PK")
    finally:
        settings.storage_root = original_storage_root
        app.dependency_overrides.clear()
