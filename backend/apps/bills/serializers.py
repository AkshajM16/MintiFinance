from rest_framework import serializers

from .models import BillReminder


class BillReminderSerializer(serializers.ModelSerializer):
    dueDate = serializers.DateTimeField(source="due_date")
    isPaid = serializers.BooleanField(source="is_paid", required=False)
    reminderDays = serializers.IntegerField(source="reminder_days", required=False)
    isRecurring = serializers.BooleanField(source="is_recurring", required=False)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)

    class Meta:
        model = BillReminder
        fields = [
            "id",
            "name",
            "amount",
            "dueDate",
            "category",
            "isPaid",
            "reminderDays",
            "isRecurring",
            "frequency",
            "createdAt",
            "updatedAt",
        ]
        read_only_fields = ["id", "createdAt", "updatedAt"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
