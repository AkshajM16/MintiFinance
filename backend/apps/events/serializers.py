from rest_framework import serializers

from .models import CalendarEvent


class CalendarEventSerializer(serializers.ModelSerializer):
    spendingProbability = serializers.FloatField(
        source="spending_probability", required=False, allow_null=True
    )
    expectedSpendingRange = serializers.JSONField(
        source="expected_spending_range", required=False, allow_null=True
    )
    spendingCategories = serializers.JSONField(
        source="spending_categories", required=False, allow_null=True
    )

    class Meta:
        model = CalendarEvent
        fields = [
            "id",
            "title",
            "description",
            "start",
            "end",
            "category",
            "raw",
            "spendingProbability",
            "expectedSpendingRange",
            "spendingCategories",
            "confidence",
            "keywords",
        ]
