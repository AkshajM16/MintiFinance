from rest_framework import serializers, viewsets
from rest_framework.pagination import LimitOffsetPagination
from .models import BudgetAlert


class AlertSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source="get_threshold_display", read_only=True)

    class Meta:
        model = BudgetAlert
        fields = [
            "id",
            "budget_name",
            "threshold",
            "status",
            "spent",
            "limit",
            "period_start",
            "period_end",
            "created_at",
        ]


class AlertPagination(LimitOffsetPagination):
    default_limit = 20
    max_limit = 100


class AlertViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AlertSerializer
    pagination_class = AlertPagination

    def get_queryset(self):
        return BudgetAlert.objects.filter(user=self.request.user)
