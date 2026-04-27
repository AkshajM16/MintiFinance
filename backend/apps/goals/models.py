import uuid

from django.conf import settings
from django.db import models


class SavingsGoal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="savings_goals",
    )
    name = models.CharField(max_length=255)
    target_amount = models.FloatField()
    current_amount = models.FloatField(default=0)
    target_date = models.DateTimeField(null=True, blank=True)
    monthly_contribution = models.FloatField(null=True, blank=True)
    color = models.CharField(max_length=20)
    icon = models.CharField(max_length=100, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "savings_goals"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} (${self.target_amount})"
