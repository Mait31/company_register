from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user
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
