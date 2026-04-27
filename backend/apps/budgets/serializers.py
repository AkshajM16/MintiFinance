from rest_framework import serializers

from .models import Budget, BudgetGoal, Category


class CategorySerializer(serializers.ModelSerializer):
    isDefault = serializers.BooleanField(source="is_default")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "color", "budget", "icon", "isDefault", "createdAt", "updatedAt"]
        read_only_fields = ["id", "createdAt", "updatedAt"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class BudgetSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    startDate = serializers.DateTimeField(source="start_date")
    endDate = serializers.DateTimeField(source="end_date", required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Budget
        fields = [
            "id",
            "name",
            "amount",
            "period",
            "startDate",
            "endDate",
            "category",
            "spent",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = ["id", "createdAt", "updatedAt"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class BudgetGoalSerializer(serializers.ModelSerializer):
    targetAmount = serializers.FloatField(source="target_amount")
    currentAmount = serializers.FloatField(source="current_amount", required=False)
    isActive = serializers.BooleanField(source="is_active", required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = BudgetGoal
        fields = [
            "id",
            "name",
            "targetAmount",
            "currentAmount",
            "deadline",
            "category",
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
