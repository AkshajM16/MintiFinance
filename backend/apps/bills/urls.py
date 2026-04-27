from rest_framework.routers import DefaultRouter

from .views import BillReminderViewSet

router = DefaultRouter(trailing_slash=False)
router.register("bill-reminders", BillReminderViewSet, basename="bill-reminder")

urlpatterns = router.urls
