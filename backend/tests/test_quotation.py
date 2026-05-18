from decimal import Decimal

import pytest

from app.services.quotation import InvalidQuotation, calculate_final_amount


def test_calculates_final_amount() -> None:
    items = [{"amount": "1000", "quantity": 2}, {"amount": "500", "quantity": 1}]
    assert calculate_final_amount(items, Decimal("300")) == Decimal("2200")


def test_rejects_discount_larger_than_total() -> None:
    with pytest.raises(InvalidQuotation):
        calculate_final_amount([{"amount": "100", "quantity": 1}], Decimal("200"))
