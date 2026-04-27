import uuid

from django.conf import settings
from django.db import models


class BudgetPeriod(models.TextChoices):
    DAILY = "DAILY", "Daily"
    WEEKLY = "WEEKLY", "Weekly"
    MONTHLY = "MONTHLY", "Monthly"
    YEARLY = "YEARLY", "Yearly"


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="categories",
    )
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=20)
    budget = models.FloatField(null=True, blank=True)
    icon = models.CharField(max_length=100, null=True, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "categories"
        ordering = ["name"]
        unique_together = [("user", "name")]

    def __str__(self):
        return self.name


class Budget(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="budgets",
    )
    name = models.CharField(max_length=255)
    amount = models.FloatField()
    period = models.CharField(max_length=10, choices=BudgetPeriod.choices)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    category = models.ForeignKey(
        Category,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="budgets",
    )
    spent = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "budgets"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} (${self.amount})"


class BudgetGoal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="budget_goals",
    )
    name = models.CharField(max_length=255)
    target_amount = models.FloatField()
    current_amount = models.FloatField(default=0)
    deadline = models.DateTimeField(null=True, blank=True)
    category = models.CharField(max_length=100, null=True, blank=True)
    color = models.CharField(max_length=20)
    icon = models.CharField(max_length=100, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "budget_goals"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} (${self.target_amount})"
