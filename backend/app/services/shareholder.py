from decimal import Decimal


class InvalidShareholderStructure(ValueError):
    pass


def assert_share_percent_total(percentages: list[Decimal]) -> None:
    if not percentages:
        raise InvalidShareholderStructure("至少需要一个股东")
    total = sum(percentages, Decimal("0"))
    if total != Decimal("100"):
        raise InvalidShareholderStructure("股东持股比例合计必须等于 100%")
