import json
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
import boto3
import pytest
from django.db import IntegrityError, transaction, connections
from moto import mock_aws
from apps.alerts.models import BudgetAlert, ProcessedEvent
from apps.alerts.service import process_event, event_for, period_bounds
from apps.alerts.queue import handle_message, publish
from apps.budgets.models import Category
from apps.users.models import User

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize(
    "amount,expected",
    [
        (0.01, []),
        (79.99, []),
        (80, [80]),
        (99.99, [80]),
        (100, [80, 100]),
        (120, [80, 100]),
    ],
)
def test_thresholds(budget, expense, amount, expected):
    process_event(event_for(expense(amount)))
    assert sorted(BudgetAlert.objects.values_list("threshold", flat=True)) == expected


def test_decimal_sum(budget, expense):
    budget.amount = 0.3
    budget.save()
    for _ in range(3):
        tx = expense(0.1)
    process_event(event_for(tx))
    assert str(BudgetAlert.objects.get(threshold=100).spent) == "0.30"


def test_duplicate_and_independent_constraint(budget, expense):
    event = event_for(expense(100))
    for _ in range(5):
        process_event(event)
    assert BudgetAlert.objects.count() == 2
    assert ProcessedEvent.objects.count() == 1
    a = BudgetAlert.objects.first()
    with pytest.raises(IntegrityError), transaction.atomic():
        BudgetAlert.objects.create(
            user=a.user,
            budget=a.budget,
            period_start=a.period_start,
            period_end=a.period_end,
            threshold=a.threshold,
            spent=a.spent,
            limit=a.limit,
            budget_name=a.budget_name,
            event_id=a.event_id,
        )


@pytest.mark.django_db(transaction=True)
def test_concurrent_deliveries(budget, expense):
    event = event_for(expense(100))

    def run(_):
        try:
            return process_event(event)
        finally:
            connections.close_all()

    with ThreadPoolExecutor(max_workers=4) as pool:
        assert sum(pool.map(run, range(12))) == 2
    assert BudgetAlert.objects.count() == 2


def test_user_isolation(api, budget, expense):
    process_event(event_for(expense(100)))
    alert_id = BudgetAlert.objects.first().id
    assert len(api.get("/api/alerts").data["results"]) == 2
    api.force_authenticate(User.objects.create_user(email="other@example.test"))
    assert api.get("/api/alerts").data["results"] == []
    assert api.get(f"/api/alerts/{alert_id}").status_code == 404
    api.force_authenticate(None)
    assert api.get("/api/alerts").status_code == 401


def test_category_income_and_end_exclusion(budget, expense, user):
    budget.category = Category.objects.create(user=user, name="Food", color="blue")
    budget.save()
    process_event(event_for(expense(100, category="Transport")))
    process_event(event_for(expense(100, category="Food", type="INCOME")))
    assert BudgetAlert.objects.count() == 0
    process_event(event_for(expense(80, category="food")))
    assert BudgetAlert.objects.count() == 1
    budget.end_date = datetime.now(timezone.utc) - timedelta(seconds=1)
    budget.save()
    process_event(event_for(expense(100, category="Food")))
    assert BudgetAlert.objects.count() == 1


@pytest.mark.parametrize(
    "period,start,end",
    [
        ("DAILY", "2026-03-04", "2026-03-05"),
        ("WEEKLY", "2026-03-02", "2026-03-09"),
        ("MONTHLY", "2026-03-01", "2026-04-01"),
        ("YEARLY", "2026-01-01", "2027-01-01"),
    ],
)
def test_periods(budget, period, start, end):
    budget.period = period
    budget.start_date = datetime(2025, 1, 1, tzinfo=timezone.utc)
    bounds = period_bounds(budget, datetime(2026, 3, 4, tzinfo=timezone.utc))
    assert [d.date().isoformat() for d in bounds] == [start, end]


def test_failed_processing_rolls_back(budget, expense):
    event = event_for(expense())
    with patch(
        "apps.alerts.service.BudgetAlert.objects.get_or_create",
        side_effect=RuntimeError("injected"),
    ):
        with pytest.raises(RuntimeError):
            process_event(event)
    assert ProcessedEvent.objects.count() == 0
    assert process_event(event) == 1


def test_publish_after_commit_and_rollback(
    api, user, django_capture_on_commit_callbacks
):
    payload = {
        "amount": "80.00",
        "description": "Synthetic",
        "type": "EXPENSE",
        "date": "2026-10-30",
    }
    with patch("apps.transactions.views.publish") as send:
        with django_capture_on_commit_callbacks(execute=True) as callbacks:
            assert api.post("/api/transactions", payload).status_code == 201
            assert not send.called
        assert len(callbacks) == 1 and send.call_count == 1
        with django_capture_on_commit_callbacks(execute=True) as callbacks:
            try:
                with transaction.atomic():
                    api.post("/api/transactions", payload)
                    raise RuntimeError("rollback")
            except RuntimeError:
                pass
        assert callbacks == []


def test_publish_failure_is_reported(settings):
    settings.SQS_QUEUE_URL = ""
    assert publish({"event_id": "synthetic"}) is False


@pytest.mark.django_db(transaction=True)
@mock_aws
def test_queue_retries_dlq_and_healthy_message(budget, expense):
    sqs = boto3.client("sqs", region_name="us-east-1")
    dlq = sqs.create_queue(QueueName="test-dlq")["QueueUrl"]
    arn = sqs.get_queue_attributes(QueueUrl=dlq, AttributeNames=["QueueArn"])[
        "Attributes"
    ]["QueueArn"]
    queue = sqs.create_queue(
        QueueName="test-main",
        Attributes={
            "VisibilityTimeout": "0",
            "RedrivePolicy": json.dumps(
                {"deadLetterTargetArn": arn, "maxReceiveCount": "3"}
            ),
        },
    )["QueueUrl"]
    sqs.send_message(QueueUrl=queue, MessageBody="malformed")
    sqs.send_message(QueueUrl=queue, MessageBody=json.dumps(event_for(expense(100))))
    failures = successes = 0
    for _ in range(10):
        for msg in sqs.receive_message(
            QueueUrl=queue,
            MaxNumberOfMessages=1,
            MessageSystemAttributeNames=["ApproximateReceiveCount"],
        ).get("Messages", []):
            ok = handle_message(sqs, queue, msg)
            successes += ok
            failures += not ok
    assert (failures, successes) == (3, 1)
    assert len(sqs.receive_message(QueueUrl=dlq).get("Messages", [])) == 1
    assert BudgetAlert.objects.count() == 2


@pytest.mark.django_db(transaction=True)
@mock_aws
def test_transient_retry(budget, expense):
    sqs = boto3.client("sqs", region_name="us-east-1")
    queue = sqs.create_queue(QueueName="retry", Attributes={"VisibilityTimeout": "0"})[
        "QueueUrl"
    ]
    sqs.send_message(QueueUrl=queue, MessageBody=json.dumps(event_for(expense())))
    msg = sqs.receive_message(QueueUrl=queue)["Messages"][0]

    def fail(_):
        raise RuntimeError("injected")

    assert not handle_message(sqs, queue, msg, processor=fail)
    assert BudgetAlert.objects.count() == 0
    msg = sqs.receive_message(QueueUrl=queue)["Messages"][0]
    assert handle_message(sqs, queue, msg)
    assert BudgetAlert.objects.count() == 1


@pytest.mark.django_db(transaction=True)
def test_distinct_concurrent_events_same_budget(budget, expense):
    events = [event_for(expense(50)) for _ in range(2)]

    def run(event):
        try:
            return process_event(event)
        finally:
            connections.close_all()

    with ThreadPoolExecutor(max_workers=2) as pool:
        assert sum(pool.map(run, events)) == 2
    assert BudgetAlert.objects.count() == 2
    assert ProcessedEvent.objects.count() == 2


def test_month_boundary_excludes_previous_expenses(budget, expense):
    budget.start_date = datetime(2026, 1, 1, tzinfo=timezone.utc)
    budget.save()
    expense(100, date=datetime(2026, 1, 31, tzinfo=timezone.utc))
    process_event(
        event_for(expense(79.99, date=datetime(2026, 2, 1, tzinfo=timezone.utc)))
    )
    assert BudgetAlert.objects.count() == 0
    process_event(
        event_for(expense(0.01, date=datetime(2026, 2, 2, tzinfo=timezone.utc)))
    )
    assert BudgetAlert.objects.get().threshold == 80
