from datetime import datetime, timedelta, timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.events.models import CalendarEvent
from apps.transactions.models import Transaction


class SpendingAnalysisView(APIView):
    """
    GET /api/analysis/spending?days=30

    Returns a breakdown of spending vs income, event-triggered spending,
    category breakdown, and day-of-week spending for the given window.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        user = request.user

        end_date = datetime.now(tz=timezone.utc)
        start_date = end_date - timedelta(days=days)

        transactions = list(
            Transaction.objects.filter(
                user=user,
                date__gte=start_date,
                date__lte=end_date,
            ).select_related("event")
        )

        events = list(
            CalendarEvent.objects.filter(
                user=user,
                start__gte=start_date,
                start__lte=end_date,
            ).prefetch_related("transactions")
        )

        total_spent = 0.0
        total_income = 0.0
        event_triggered_spending = 0.0
        event_triggered_transactions = []
        category_breakdown: dict[str, float] = {}
        day_of_week_spending: dict[str, float] = {}

        for tx in transactions:
            if tx.type == "EXPENSE":
                total_spent += tx.amount
                if tx.event_id:
                    event_triggered_spending += tx.amount
                    event_triggered_transactions.append(_serialize_tx(tx))

                cat = tx.category or "Uncategorized"
                category_breakdown[cat] = category_breakdown.get(cat, 0) + tx.amount

                day_name = tx.date.strftime("%A")
                day_of_week_spending[day_name] = (
                    day_of_week_spending.get(day_name, 0) + tx.amount
                )
            elif tx.type == "INCOME":
                total_income += tx.amount

        event_spending_correlation = []
        for ev in events:
            ev_start = ev.start - timedelta(hours=24)
            ev_end = ev.start + timedelta(hours=24)
            related = [
                t for t in transactions
                if t.type == "EXPENSE" and ev_start <= t.date <= ev_end
            ]
            if related:
                event_spending_correlation.append(
                    {
                        "event": {
                            "id": ev.id,
                            "title": ev.title,
                            "start": ev.start.isoformat(),
                            "category": ev.category or "Other",
                        },
                        "transactions": [_serialize_tx(t) for t in related],
                        "totalSpent": sum(t.amount for t in related),
                        "transactionCount": len(related),
                    }
                )

        return Response(
            {
                "totalSpent": total_spent,
                "totalIncome": total_income,
                "eventTriggeredSpending": event_triggered_spending,
                "eventTriggeredTransactions": event_triggered_transactions,
                "categoryBreakdown": category_breakdown,
                "timeBasedAnalysis": {
                    "dayOfWeekSpending": day_of_week_spending,
                    "totalDays": days,
                    "averageDailySpending": total_spent / days if days else 0,
                },
                "eventSpendingCorrelation": event_spending_correlation,
            }
        )


def _serialize_tx(tx: Transaction) -> dict:
    return {
        "id": str(tx.id),
        "amount": tx.amount,
        "description": tx.description,
        "date": tx.date.isoformat(),
        "category": tx.category,
        "eventId": tx.event_id,
        "type": tx.type,
    }
