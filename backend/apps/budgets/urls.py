from rest_framework.routers import DefaultRouter

from .views import BudgetGoalViewSet, BudgetViewSet

router = DefaultRouter(trailing_slash=False)
router.register("budgets", BudgetViewSet, basename="budget")
router.register("budget-goals", BudgetGoalViewSet, basename="budget-goal")

urlpatterns = router.urls
