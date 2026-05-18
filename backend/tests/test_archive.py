import pytest

from app.models.enums import OrderStatus
from app.services.archive import InvalidArchiveRequest, assert_can_archive


def test_can_archive_registered_order_with_result_file() -> None:
    assert_can_archive(OrderStatus.REGISTERED.value, has_registration_result_file=True)


def test_rejects_archive_without_result_file() -> None:
    with pytest.raises(InvalidArchiveRequest):
        assert_can_archive(OrderStatus.REGISTERED.value, has_registration_result_file=False)
