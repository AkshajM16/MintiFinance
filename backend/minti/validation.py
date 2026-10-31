from decimal import Decimal, InvalidOperation
from rest_framework import serializers


class MoneyField(serializers.FloatField):
    def __init__(self, *args, allow_zero=False, **kwargs):
        self.allow_zero = allow_zero
        super().__init__(*args, **kwargs)

    def to_internal_value(self, data):
        try:
            amount = Decimal(str(data))
            if (
                not amount.is_finite()
                or amount < 0
                or (amount == 0 and not self.allow_zero)
                or amount > Decimal("1000000000")
                or amount != amount.quantize(Decimal("0.01"))
            ):
                raise ValueError()
        except (InvalidOperation, ValueError, TypeError):
            raise serializers.ValidationError(
                "Use a positive amount up to 1 billion with at most two decimal places."
            )
        return float(amount)
