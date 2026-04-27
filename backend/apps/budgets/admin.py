from django.contrib import admin

from .models import Budget, BudgetGoal, Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "color", "user")


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ("name", "amount", "period", "spent", "user")


@admin.register(BudgetGoal)
class BudgetGoalAdmin(admin.ModelAdmin):
    list_display = ("name", "target_amount", "current_amount", "is_active", "user")
