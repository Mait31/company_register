import pytest

from app.models.enums import OrderStatus
from app.services.state_machine import InvalidStatusTransition, assert_transition_allowed


def test_allows_expected_transition() -> None:
    assert_transition_allowed(OrderStatus.DRAFT.value, OrderStatus.PENDING_QUOTE.value)


def test_rejects_skipping_to_archive() -> None:
    with pytest.raises(InvalidStatusTransition):
        assert_transition_allowed(OrderStatus.PENDING_QUOTE.value, OrderStatus.ARCHIVED.value)
