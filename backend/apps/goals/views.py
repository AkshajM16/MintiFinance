from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import SavingsGoal
from .serializers import SavingsGoalSerializer


class SavingsGoalViewSet(viewsets.ModelViewSet):
    serializer_class = SavingsGoalSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return SavingsGoal.objects.filter(user=self.request.user)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = request.data

        contribution = data.get("contributionAmount")
        current = data.get("currentAmount")

        if current is not None:
            instance.current_amount = float(current)
        elif contribution is not None:
            instance.current_amount += float(contribution)

        instance.save()
        return Response(self.get_serializer(instance).data)
