from django.contrib import admin

from .models import CalendarEvent


@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ("title", "start", "end", "category", "user")
    list_filter = ("category",)
    search_fields = ("title",)
