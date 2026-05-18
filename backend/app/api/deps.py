from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, WeComUser


async def get_current_user(
    x_wecom_userid: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not x_wecom_userid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="需要企业微信登录")

    wecom_user = db.query(WeComUser).filter(WeComUser.wecom_userid == x_wecom_userid).first()
    if not wecom_user or not wecom_user.user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="企业微信用户未绑定")
    return wecom_user.user
