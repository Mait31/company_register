from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.order import RegistrationOrder
from app.schemas.order import OrderRead

router = APIRouter()


@router.get("/orders/{token}", response_model=OrderRead)
def get_public_order(token: str, db: Session = Depends(get_db)) -> RegistrationOrder:
    order = db.query(RegistrationOrder).filter(RegistrationOrder.public_token == token).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="工单不存在")
    return order


@router.post("/orders/{token}/confirm-quotation")
def confirm_quotation(token: str, db: Session = Depends(get_db)) -> dict:
    order = db.query(RegistrationOrder).filter(RegistrationOrder.public_token == token).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="工单不存在")
    return {"order_id": order.id, "status": "planned", "message": "报价确认接口已预留"}
