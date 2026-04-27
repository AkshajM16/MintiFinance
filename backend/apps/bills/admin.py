from django.contrib import admin

from .models import BillReminder


@admin.register(BillReminder)
class BillReminderAdmin(admin.ModelAdmin):
    list_display = ("name", "amount", "due_date", "is_paid", "user")
    list_filter = ("is_paid", "is_recurring")
