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

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        is_paid = request.data.get("isPaid")
        if is_paid is None:
            return Response(
                {"error": "isPaid is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        instance.is_paid = bool(is_paid)
        instance.save()
        return Response(self.get_serializer(instance).data)
