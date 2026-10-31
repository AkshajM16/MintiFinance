import pytest
from django.utils import timezone
from rest_framework.test import APIClient
from apps.users.models import User
from apps.budgets.models import Budget
from apps.transactions.models import Transaction


@pytest.fixture
def user(db):
    return User.objects.create_user(email="synthetic@example.test")


@pytest.fixture
def api(user):
    client = APIClient()
    client.force_authenticate(user)
    return client


@pytest.fixture
def budget(user):
    return Budget.objects.create(
        user=user,
        name="Monthly synthetic",
        amount=100,
        period="MONTHLY",
        start_date=timezone.now().replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        ),
    )


@pytest.fixture
def expense(user):
    def create(amount=80, **kwargs):
        return Transaction.objects.create(
            user=user,
            amount=amount,
            description="Synthetic expense",
            type=kwargs.pop("type", "EXPENSE"),
            date=kwargs.pop("date", timezone.now()),
            **kwargs,
        )

    return create
