from rest_framework.routers import DefaultRouter

from .views import RecurringTransactionViewSet, TransactionViewSet

router = DefaultRouter(trailing_slash=False)
router.register("transactions", TransactionViewSet, basename="transaction")
router.register(
    "recurring-transactions",
    RecurringTransactionViewSet,
    basename="recurring-transaction",
)

urlpatterns = router.urls
