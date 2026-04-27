from django.contrib import admin

from .models import RecurringTransaction, Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("description", "amount", "type", "category", "date", "user")
    list_filter = ("type", "category")
    search_fields = ("description",)
    ordering = ("-date",)


@admin.register(RecurringTransaction)
class RecurringTransactionAdmin(admin.ModelAdmin):
    list_display = ("description", "amount", "type", "frequency", "is_active", "user")
    list_filter = ("type", "frequency", "is_active")
