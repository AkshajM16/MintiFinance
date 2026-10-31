"""Application idempotency, independent of SQS delivery/acknowledgement."""

import logging
import uuid
from datetime import timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from apps.budgets.models import Budget
from apps.transactions.models import Transaction
from .models import BudgetAlert, ProcessedEvent

log = logging.getLogger("minti.alerts")


def money(value):
    result = Decimal(str(value))
    if not result.is_finite() or result < 0:
        raise ValueError("Invalid monetary value")
    return result.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def period_bounds(budget, date):
    date = date.astimezone(timezone.utc)
    start = date.replace(hour=0, minute=0, second=0, microsecond=0)
    if budget.period == "DAILY":
        end = start + timedelta(days=1)
    elif budget.period == "WEEKLY":
        start -= timedelta(days=start.weekday())
        end = start + timedelta(days=7)
    elif budget.period == "MONTHLY":
        start = start.replace(day=1)
        end = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
    elif budget.period == "YEARLY":
        start = start.replace(month=1, day=1)
        end = start.replace(year=start.year + 1)
    else:
        raise ValueError("Unsupported budget period")
    return max(start, budget.start_date), min(
        end, budget.end_date
    ) if budget.end_date else end


def event_for(tx):
    return {"version": 1, "event_id": str(tx.id), "transaction_id": str(tx.id)}


def process_event(event):
    if not isinstance(event, dict) or event.get("version") != 1:
        raise ValueError("Unsupported event")
    event_id = uuid.UUID(event["event_id"])
    tx_id = uuid.UUID(event["transaction_id"])
    if event_id != tx_id:
        raise ValueError("Event identity mismatch")
    with transaction.atomic():
        # The unique receipt insert blocks concurrent deliveries until the winner commits.
        _, new = ProcessedEvent.objects.get_or_create(id=event_id)
        if not new:
            log.info("event_duplicate", extra={"event_id": str(event_id)})
            return 0
        tx = Transaction.objects.filter(id=tx_id).first()
        if tx is None or tx.type != "EXPENSE":
            log.info("event_ignored", extra={"event_id": str(event_id)})
            return 0
        budgets = (
            Budget.objects.filter(user_id=tx.user_id, start_date__lte=tx.date)
            .select_related("category")
            .order_by("id")
        )
        created = 0
        for budget in budgets:
            if budget.end_date and tx.date >= budget.end_date:
                continue
            category = budget.category.name if budget.category_id else None
            if (
                category is not None
                and category.casefold() != (tx.category or "").casefold()
            ):
                continue
            start, end = period_bounds(budget, tx.date)
            expenses = Transaction.objects.filter(
                user_id=tx.user_id, type="EXPENSE", date__gte=start, date__lt=end
            )
            if category is not None:
                expenses = expenses.filter(category__iexact=category)
            spent = sum(
                (money(v) for v in expenses.values_list("amount", flat=True)),
                Decimal("0"),
            )
            limit = money(budget.amount)
            if limit <= 0:
                continue
            for threshold in (80, 100):
                if spent * 100 >= limit * threshold:
                    _, added = BudgetAlert.objects.get_or_create(
                        user_id=tx.user_id,
                        budget=budget,
                        period_start=start,
                        threshold=threshold,
                        defaults={
                            "period_end": end,
                            "spent": spent,
                            "limit": limit,
                            "event_id": event_id,
                            "budget_name": budget.name,
                        },
                    )
                    created += int(added)
    log.info(
        "event_processed", extra={"event_id": str(event_id), "alerts_created": created}
    )
    return created
