from app.db.session import SessionLocal
from app.models.user import User, WeComUser
from app.models.wechat import RegistrationInvitation


def main() -> None:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            user = User(id=1, name="演示管理员", role="admin", status="active")
            db.add(user)
            db.flush()

        wecom_user = db.query(WeComUser).filter(WeComUser.wecom_userid == "demo").first()
        if not wecom_user:
            db.add(WeComUser(user_id=user.id, wecom_userid="demo", name=user.name))

        invitation = db.query(RegistrationInvitation).filter(
            RegistrationInvitation.token == "demo-token"
        ).first()
        if not invitation:
            invitation = RegistrationInvitation(
                token="demo-token",
                sales_user_id=user.id,
                remark="本地演示邀请",
                allow_forward=True,
            )
            db.add(invitation)

        db.commit()
        print(f"invitation_url=/i/{invitation.token}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
