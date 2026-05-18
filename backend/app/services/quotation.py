from decimal import Decimal


class InvalidQuotation(ValueError):
    pass


def calculate_final_amount(items: list[dict], discount_amount: Decimal = Decimal("0")) -> Decimal:
    total = Decimal("0")
    for item in items:
        amount = Decimal(str(item["amount"]))
        quantity = Decimal(str(item.get("quantity", 1)))
        total += amount * quantity

    if discount_amount < 0:
        raise InvalidQuotation("折扣金额不能小于 0")
    if discount_amount > total:
        raise InvalidQuotation("折扣金额不能大于总金额")
    return total - discount_amount
