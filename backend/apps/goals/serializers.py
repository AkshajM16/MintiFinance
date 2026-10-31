from minti.validation import MoneyField
from decimal import Decimal
from rest_framework import serializers

from .models import SavingsGoal


class SavingsGoalSerializer(serializers.ModelSerializer):
    contributionAmount = MoneyField(write_only=True, required=False)

    def validate(self, attrs):
        if "contributionAmount" in attrs and ("current_amount" in attrs or self.instance is None):
            raise serializers.ValidationError("Use contributionAmount only when adding to an existing goal, without currentAmount")
        return attrs

    def update(self, instance, validated_data):
        contribution = validated_data.pop("contributionAmount", None)
        if contribution is not None:
            validated_data["current_amount"] = float(Decimal(str(instance.current_amount)) + Decimal(str(contribution)))
        return super().update(instance, validated_data)

    targetAmount = MoneyField(source="target_amount")
    currentAmount = MoneyField(source="current_amount", required=False, allow_zero=True)
    targetDate = serializers.DateTimeField(source="target_date", required=False, allow_null=True)
    monthlyContribution = MoneyField(allow_zero=True,
        source="monthly_contribution", required=False, allow_null=True
    )
    isActive = serializers.BooleanField(source="is_active", required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = SavingsGoal
        fields = [
            "id",
            "name",
            "targetAmount",
            "currentAmount",
            "contributionAmount",
            "targetDate",
            "monthlyContribution",
            "color",
            "icon",
            "isActive",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = ["id", "createdAt", "updatedAt"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
