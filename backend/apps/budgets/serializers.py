from minti.validation import MoneyField
from django.utils import timezone
from datetime import timedelta
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
    amount = MoneyField()
    categoryName = serializers.CharField(write_only=True, required=False, max_length=100)
    color = serializers.CharField(write_only=True, required=False, max_length=20, default="#3B82F6")
    period = serializers.ChoiceField(choices=Budget._meta.get_field("period").choices, default="MONTHLY")

    def validate(self, attrs):
        if not self.instance and "start_date" not in attrs:
            start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            period = attrs.get("period", "MONTHLY")
            if period == "WEEKLY": start -= timedelta(days=start.weekday())
            elif period == "MONTHLY": start = start.replace(day=1)
            elif period == "YEARLY": start = start.replace(month=1, day=1)
            attrs["start_date"] = start
        start = attrs.get("start_date", getattr(self.instance, "start_date", timezone.now()))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if end and end <= start:
            raise serializers.ValidationError("endDate must follow startDate")
        return attrs

    def _category(self, attrs):
        name = attrs.pop("categoryName", None)
        color = attrs.pop("color", "#3B82F6")
        if name:
            attrs["category"], _ = Category.objects.get_or_create(user=self.context["request"].user, name=name, defaults={"color": color})
        return attrs

    def update(self, instance, validated_data):
        return super().update(instance, self._category(validated_data))

    category = CategorySerializer(read_only=True)
    startDate = serializers.DateTimeField(source="start_date", required=False)
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
            "categoryName",
            "color",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = ["id", "spent", "createdAt", "updatedAt"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(self._category(validated_data))


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
