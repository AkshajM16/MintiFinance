from rest_framework import serializers

from .models import SavingsGoal


class SavingsGoalSerializer(serializers.ModelSerializer):
    targetAmount = serializers.FloatField(source="target_amount")
    currentAmount = serializers.FloatField(source="current_amount", required=False)
    targetDate = serializers.DateTimeField(source="target_date", required=False, allow_null=True)
    monthlyContribution = serializers.FloatField(
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
