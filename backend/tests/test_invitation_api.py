from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.user import User


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

        listed = client.get(f"/api/invitations/{token}/materials")
        assert listed.status_code == 200
        assert listed.json()["total"] == 3
        assert listed.json()["missing"] == 3

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
