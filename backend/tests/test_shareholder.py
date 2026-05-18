from decimal import Decimal

import pytest

from app.services.shareholder import InvalidShareholderStructure, assert_share_percent_total


def test_share_percent_total_must_equal_100() -> None:
    assert_share_percent_total([Decimal("60"), Decimal("40")])


def test_share_percent_total_rejects_under_100() -> None:
    with pytest.raises(InvalidShareholderStructure):
        assert_share_percent_total([Decimal("60"), Decimal("30")])


def test_share_percent_total_requires_at_least_one_shareholder() -> None:
    with pytest.raises(InvalidShareholderStructure):
        assert_share_percent_total([])
