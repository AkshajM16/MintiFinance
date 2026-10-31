import uuid
from django.conf import settings
from django.db import models


class ProcessedEvent(models.Model):
    id = models.UUIDField(primary_key=True)
    processed_at = models.DateTimeField(auto_now_add=True)


class BudgetAlert(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    budget = models.ForeignKey("budgets.Budget", on_delete=models.CASCADE)
    budget_name = models.CharField(max_length=255)
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    threshold = models.PositiveSmallIntegerField(
        choices=[(80, "Warning"), (100, "Critical")]
    )
    spent = models.DecimalField(max_digits=18, decimal_places=2)
    limit = models.DecimalField(max_digits=18, decimal_places=2)
    event_id = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "budget", "period_start", "threshold"],
                name="unique_budget_period_threshold",
            )
        ]
