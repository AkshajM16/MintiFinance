import uuid

from django.conf import settings
from django.db import models


class TransactionType(models.TextChoices):
    INCOME = "INCOME", "Income"
    EXPENSE = "EXPENSE", "Expense"
    TRANSFER = "TRANSFER", "Transfer"


class RecurringFrequency(models.TextChoices):
    DAILY = "DAILY", "Daily"
    WEEKLY = "WEEKLY", "Weekly"
    MONTHLY = "MONTHLY", "Monthly"
    YEARLY = "YEARLY", "Yearly"


class RecurringTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recurring_transactions",
    )
    description = models.CharField(max_length=512)
    amount = models.FloatField()
    category = models.CharField(max_length=100, null=True, blank=True)
    type = models.CharField(max_length=10, choices=TransactionType.choices)
    frequency = models.CharField(max_length=10, choices=RecurringFrequency.choices)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    last_processed = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "recurring_transactions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.description} ({self.frequency})"


class Transaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    amount = models.FloatField()
    description = models.CharField(max_length=512)
    date = models.DateTimeField()
    category = models.CharField(max_length=100, null=True, blank=True)
    event = models.ForeignKey(
        "events.CalendarEvent",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="transactions",
    )
    type = models.CharField(max_length=10, choices=TransactionType.choices)
    recurring_transaction = models.ForeignKey(
        RecurringTransaction,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="transactions",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "transactions"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.description} (${self.amount})"
