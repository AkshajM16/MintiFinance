from datetime import datetime, timedelta, timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CalendarEvent
from .serializers import CalendarEventSerializer


class CalendarEventView(APIView):
    """
    GET  /api/events  — list the authenticated user's calendar events
                        (4 weeks ago → 2 weeks ahead)
    POST /api/events  — sync a fresh set of Google Calendar events
                        body: { events: [...] }
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = datetime.now(tz=timezone.utc)
        start = now - timedelta(days=28)
        end = now + timedelta(days=14)

        events = CalendarEvent.objects.filter(
            user=request.user,
            start__gte=start,
            start__lte=end,
        ).order_by("start")

        return Response(CalendarEventSerializer(events, many=True).data)

    def post(self, request):
        events = request.data.get("events", [])
        if not isinstance(events, list):
            return Response(
                {"error": "events must be an array"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Deduplicate incoming events by id
        seen_ids: set = set()
        unique_events = []
        for ev in events:
            if ev.get("id") and ev["id"] not in seen_ids:
                seen_ids.add(ev["id"])
                unique_events.append(ev)

        # Full resync: delete then recreate to avoid stale data
        CalendarEvent.objects.filter(user=request.user).delete()

        saved = 0
        for ev in unique_events:
            try:
                CalendarEvent.objects.create(
                    id=ev["id"],
                    user=request.user,
                    title=ev.get("title", "Untitled"),
                    description=ev.get("description", ""),
                    start=ev["start"],
                    end=ev["end"],
                    category=ev.get("category"),
                    raw=ev.get("raw", {}),
                    spending_probability=ev.get("spendingProbability"),
                    expected_spending_range=ev.get("expectedSpendingRange"),
                    spending_categories=ev.get("spendingCategories"),
                    confidence=ev.get("confidence"),
                    keywords=ev.get("keywords"),
                )
                saved += 1
            except Exception:
                continue

        return Response({"success": True, "savedCount": saved, "totalCount": len(unique_events)})
