import json
from datetime import datetime, timedelta, timezone

from django.conf import settings
from django.http import StreamingHttpResponse
from openai import OpenAI
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.events.models import CalendarEvent
from apps.goals.models import SavingsGoal
from apps.budgets.models import BudgetGoal
from apps.transactions.models import Transaction


SYSTEM_PROMPT = (
    "You are Larry the Llama, Minti's friendly AI financial advisor. "
    "You have access to the user's transaction history, upcoming calendar events, "
    "and budget goals. Give personalized, actionable, context-aware financial advice. "
    "Be warm, specific to the user's actual data, and keep responses concise."
)


def _build_context_prompt(user) -> str:
    now = datetime.now(tz=timezone.utc)
    ninety_days_ago = now - timedelta(days=90)

    transactions = list(
        Transaction.objects.filter(user=user, date__gte=ninety_days_ago)
        .order_by("-date")
        .values("amount", "category", "description", "date", "type")[:90]
    )

    expenses = [t for t in transactions if t["type"] == "EXPENSE"]
    income = [t for t in transactions if t["type"] == "INCOME"]
    expense_total = sum(t["amount"] for t in expenses)
    income_total = sum(t["amount"] for t in income)

    recent_expenses = [
        {
            "amount": t["amount"],
            "category": t["category"],
            "description": t["description"],
            "date": t["date"].isoformat() if hasattr(t["date"], "isoformat") else str(t["date"]),
        }
        for t in expenses[:15]
    ]

    upcoming_events = list(
        CalendarEvent.objects.filter(user=user, start__gte=now)
        .order_by("start")
        .values("title", "start", "category", "spending_probability", "expected_spending_range")[:20]
    )
    for ev in upcoming_events:
        if hasattr(ev.get("start"), "isoformat"):
            ev["start"] = ev["start"].isoformat()

    savings_goals = list(
        SavingsGoal.objects.filter(user=user, is_active=True)
        .values("name", "target_amount", "current_amount", "monthly_contribution")
    )

    budget_goals = list(
        BudgetGoal.objects.filter(user=user, is_active=True)
        .values("name", "target_amount", "current_amount", "category")
    )

    return (
        f"User context snapshot:\n"
        f"- Last 90 days: income ${income_total:.2f}, "
        f"expenses ${expense_total:.2f}, net ${income_total - expense_total:.2f}\n"
        f"- Recent expense transactions: {json.dumps(recent_expenses)}\n"
        f"- Upcoming calendar events: {json.dumps(upcoming_events)}\n"
        f"- Savings goals: {json.dumps(savings_goals)}\n"
        f"- Budget goals: {json.dumps(budget_goals)}\n"
    )


class ChatView(APIView):
    """
    POST /api/chat

    Body: { messages: [{ role, content }, ...] }

    Streams a plain-text response from Larry the Llama (gpt-4o-mini)
    enriched with the authenticated user's financial context.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        api_key = settings.OPENAI_API_KEY
        if not api_key:
            return StreamingHttpResponse(
                "OPENAI_API_KEY is not configured.", status=500, content_type="text/plain"
            )

        messages = request.data.get("messages", [])
        if not isinstance(messages, list):
            return StreamingHttpResponse(
                "Invalid request payload.", status=400, content_type="text/plain"
            )

        context_prompt = _build_context_prompt(request.user)

        full_messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "system", "content": context_prompt},
            *messages,
        ]

        client = OpenAI(api_key=api_key)

        def event_stream():
            try:
                stream = client.chat.completions.create(
                    model="gpt-4o-mini",
                    stream=True,
                    messages=full_messages,
                    temperature=0.4,
                )
                for chunk in stream:
                    delta = chunk.choices[0].delta.content or ""
                    if delta:
                        yield delta
            except Exception as exc:
                yield f"\n[Error: {exc}]"

        response = StreamingHttpResponse(
            event_stream(),
            content_type="text/plain; charset=utf-8",
        )
        response["Cache-Control"] = "no-cache"
        return response
