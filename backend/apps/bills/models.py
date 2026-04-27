import uuid

from django.conf import settings
from django.db import models


class RecurringFrequency(models.TextChoices):
    DAILY = "DAILY", "Daily"
    WEEKLY = "WEEKLY", "Weekly"
    MONTHLY = "MONTHLY", "Monthly"
    YEARLY = "YEARLY", "Yearly"


class BillReminder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bill_reminders",
    )
    name = models.CharField(max_length=255)
    amount = models.FloatField()
    due_date = models.DateTimeField()
    category = models.CharField(max_length=100, null=True, blank=True)
    is_paid = models.BooleanField(default=False)
    reminder_days = models.IntegerField(default=3)
    is_recurring = models.BooleanField(default=False)
    frequency = models.CharField(
        max_length=10,
        choices=RecurringFrequency.choices,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bill_reminders"
        ordering = ["due_date"]

    def __str__(self):
        return f"{self.name} (due {self.due_date:%Y-%m-%d})"
