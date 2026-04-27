from rest_framework.routers import DefaultRouter

from .views import SavingsGoalViewSet

router = DefaultRouter(trailing_slash=False)
router.register("savings-goals", SavingsGoalViewSet, basename="savings-goal")

urlpatterns = router.urls
