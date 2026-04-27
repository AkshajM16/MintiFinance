from django.conf import settings
from django.db import models


class CalendarEvent(models.Model):
    # Google Calendar event ID is used as the primary key
    id = models.CharField(max_length=255, primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="calendar_events",
    )
    title = models.CharField(max_length=512)
    description = models.TextField(null=True, blank=True)
    start = models.DateTimeField()
    end = models.DateTimeField()
    category = models.CharField(max_length=100, null=True, blank=True)
    raw = models.JSONField(default=dict)

    # Enhanced spending prediction fields
    spending_probability = models.FloatField(null=True, blank=True)
    expected_spending_range = models.JSONField(null=True, blank=True)  # [min, max]
    spending_categories = models.JSONField(null=True, blank=True)  # list of strings
    confidence = models.FloatField(null=True, blank=True)
    keywords = models.JSONField(null=True, blank=True)  # list of strings

    class Meta:
        db_table = "calendar_events"
        ordering = ["start"]

    def __str__(self):
        return f"{self.title} ({self.start:%Y-%m-%d})"
