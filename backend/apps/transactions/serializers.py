from minti.validation import MoneyField
from apps.events.models import CalendarEvent
from rest_framework import serializers

from .models import RecurringTransaction, Transaction


class TransactionSerializer(serializers.ModelSerializer):
    amount = MoneyField()

    def validate_eventId(self, value):
        if value and not CalendarEvent.objects.filter(id=value, user=self.context["request"].user).exists():
            raise serializers.ValidationError("Unknown event")
        return value

    eventId = serializers.CharField(source="event_id", required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "amount",
            "description",
            "date",
            "category",
            "eventId",
            "type",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = ["id", "createdAt", "updatedAt"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class RecurringTransactionSerializer(serializers.ModelSerializer):
    amount = MoneyField()
    startDate = serializers.DateTimeField(source="start_date")
    endDate = serializers.DateTimeField(source="end_date", required=False, allow_null=True)
    lastProcessed = serializers.DateTimeField(source="last_processed", read_only=True, allow_null=True)
    isActive = serializers.BooleanField(source="is_active", required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = RecurringTransaction
        fields = [
            "id",
            "description",
            "amount",
            "category",
            "type",
            "frequency",
            "startDate",
            "endDate",
            "lastProcessed",
            "isActive",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = ["id", "lastProcessed", "createdAt", "updatedAt"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
