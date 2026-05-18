from app.models.enums import OrderStatus


ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.DRAFT: {OrderStatus.PENDING_QUOTE, OrderStatus.CANCELLED},
    OrderStatus.PENDING_QUOTE: {OrderStatus.PENDING_CUSTOMER_CONFIRM, OrderStatus.CANCELLED},
    OrderStatus.PENDING_CUSTOMER_CONFIRM: {
        OrderStatus.COLLECTING_MATERIALS,
        OrderStatus.CANCELLED,
    },
    OrderStatus.COLLECTING_MATERIALS: {
        OrderStatus.REVIEWING_MATERIALS,
        OrderStatus.NEED_MORE_MATERIALS,
        OrderStatus.CANCELLED,
    },
    OrderStatus.REVIEWING_MATERIALS: {
        OrderStatus.NEED_MORE_MATERIALS,
        OrderStatus.MATERIALS_READY,
        OrderStatus.CANCELLED,
    },
    OrderStatus.NEED_MORE_MATERIALS: {
        OrderStatus.COLLECTING_MATERIALS,
        OrderStatus.REVIEWING_MATERIALS,
        OrderStatus.CANCELLED,
    },
    OrderStatus.MATERIALS_READY: {OrderStatus.PROCESSING_REGISTRATION, OrderStatus.CANCELLED},
    OrderStatus.PROCESSING_REGISTRATION: {OrderStatus.REGISTERED, OrderStatus.CANCELLED},
    OrderStatus.REGISTERED: {OrderStatus.ARCHIVED},
    OrderStatus.ARCHIVED: set(),
    OrderStatus.CANCELLED: set(),
}


class InvalidStatusTransition(ValueError):
    pass


def assert_transition_allowed(from_status: str, to_status: str) -> None:
    try:
        source = OrderStatus(from_status)
        target = OrderStatus(to_status)
    except ValueError as exc:
        raise InvalidStatusTransition("未知工单状态") from exc

    if target not in ALLOWED_TRANSITIONS[source]:
        raise InvalidStatusTransition(f"不允许从 {source.value} 流转到 {target.value}")
