from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Budget, BudgetGoal, Category
from .serializers import BudgetGoalSerializer, BudgetSerializer, CategorySerializer


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user).select_related("category")

    def create(self, request, *args, **kwargs):
        data = request.data
        category_name = data.get("categoryName")
        color = data.get("color", "#3B82F6")

        category = None
        if category_name:
            category, _ = Category.objects.get_or_create(
                user=request.user,
                name=category_name,
                defaults={"color": color},
            )

        budget = Budget.objects.create(
            user=request.user,
            name=data.get("name", ""),
            amount=float(data.get("amount", 0)),
            period=data.get("period", "MONTHLY"),
            start_date=data.get("startDate") or timezone.now(),
            category=category,
        )
        serializer = self.get_serializer(budget)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = request.data
        if "amount" in data:
            instance.amount = float(data["amount"])
        if "spent" in data:
            instance.spent = float(data["spent"])
        if "name" in data:
            instance.name = data["name"]
        instance.save()
        return Response(self.get_serializer(instance).data)


class BudgetGoalViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BudgetGoal.objects.filter(user=self.request.user)
