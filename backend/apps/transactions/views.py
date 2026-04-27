from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import RecurringTransaction, Transaction
from .serializers import RecurringTransactionSerializer, TransactionSerializer


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Transaction.objects.filter(user=self.request.user)
        params = self.request.query_params

        start_date = params.get("startDate")
        end_date = params.get("endDate")
        tx_type = params.get("type")
        category = params.get("category")
        event_id = params.get("eventId")
        search = params.get("search")

        if start_date and end_date:
            qs = qs.filter(date__gte=start_date, date__lte=end_date)
        if tx_type:
            qs = qs.filter(type=tx_type.upper())
        if category:
            qs = qs.filter(category=category)
        if event_id:
            qs = qs.filter(event_id=event_id)
        if search:
            qs = qs.filter(description__icontains=search)

        return qs.order_by("-date")

    def perform_create(self, serializer):
        tx_type = self.request.data.get("type", "")
        serializer.save(user=self.request.user, type=tx_type.upper())

    def perform_update(self, serializer):
        data = {}
        raw = self.request.data
        if "type" in raw:
            data["type"] = raw["type"].upper()
        serializer.save(**data)


class RecurringTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = RecurringTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return RecurringTransaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        raw = self.request.data
        serializer.save(
            user=self.request.user,
            type=raw.get("type", "EXPENSE").upper(),
            frequency=raw.get("frequency", "MONTHLY").upper(),
        )
