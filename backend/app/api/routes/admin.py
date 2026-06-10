from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.log import WorkflowLog
from app.models.order import RegistrationOrder
from app.models.user import Customer, User
from app.schemas.order import OrderCreate, OrderRead, OrderStatusChange
from app.services.document_generation import generate_order_documents
from app.services.state_machine import InvalidStatusTransition, assert_transition_allowed

router = APIRouter()


def make_order_no() -> str:
    return "CR" + datetime.utcnow().strftime("%Y%m%d%H%M%S%f")


@router.post("/orders", response_model=OrderRead)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RegistrationOrder:
    customer = Customer(name=payload.customer_name, mobile=payload.customer_mobile)
    db.add(customer)
    db.flush()

    order = RegistrationOrder(
        order_no=make_order_no(),
        customer_id=customer.id,
        sales_user_id=current_user.id,
        assigned_user_id=current_user.id,
        is_urgent=payload.is_urgent,
        need_registered_address=payload.need_registered_address,
        need_bank_account=payload.need_bank_account,
        need_tax_registration=payload.need_tax_registration,
        need_accounting=payload.need_accounting,
        need_work_permit_later=payload.need_work_permit_later,
        remark=payload.remark,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("/orders", response_model=list[OrderRead])
def list_orders(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[RegistrationOrder]:
    return db.query(RegistrationOrder).order_by(RegistrationOrder.id.desc()).limit(100).all()


@router.get("/orders/{order_id}", response_model=OrderRead)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> RegistrationOrder:
    order = db.get(RegistrationOrder, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="工单不存在")
    return order


@router.post("/orders/{order_id}/change-status", response_model=OrderRead)
def change_order_status(
    order_id: int,
    payload: OrderStatusChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RegistrationOrder:
    order = db.get(RegistrationOrder, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="工单不存在")

    try:
        assert_transition_allowed(order.status, payload.to_status.value)
    except InvalidStatusTransition as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    from_status = order.status
    order.status = payload.to_status.value
    db.add(
        WorkflowLog(
            order_id=order.id,
            from_status=from_status,
            to_status=order.status,
            operator_id=current_user.id,
            comment=payload.comment,
        )
    )
    db.commit()
    db.refresh(order)
    return order


@router.post("/orders/{order_id}/generate-documents")
def generate_documents(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    order = db.get(RegistrationOrder, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="工单不存在")

    documents, missing_fields = generate_order_documents(db, order, current_user)
    return {
        "order_id": order.id,
        "status": "generated",
        "message": "已生成内部草稿文件；正式公证内容仍需由公证员系统出具",
        "missing_fields": missing_fields,
        "documents": [
            {
                "id": document.id,
                "document_type": document.document_type,
                "document_name": document.document_name,
                "template_id": document.template_id,
                "file_id": document.file_id,
                "generated_at": document.generated_at,
            }
            for document in documents
        ],
    }


@router.post("/orders/{order_id}/archive")
def archive_order(
    order_id: int,
    _: User = Depends(get_current_user),
) -> dict:
    return {"order_id": order_id, "status": "planned", "message": "公司档案归档接口已预留"}
