from django.contrib import admin

from .models import SavingsGoal


@admin.register(SavingsGoal)
class SavingsGoalAdmin(admin.ModelAdmin):
    list_display = ("name", "target_amount", "current_amount", "is_active", "user")
