from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import BillReminder
from .serializers import BillReminderSerializer


class BillReminderViewSet(viewsets.ModelViewSet):
    serializer_class = BillReminderSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return BillReminder.objects.filter(user=self.request.user).order_by("due_date")
