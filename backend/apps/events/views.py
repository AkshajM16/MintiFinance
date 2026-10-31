from django.db import transaction, IntegrityError
from rest_framework import serializers
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
        events = request.data.get("events")
        if not isinstance(events, list) or len(events) > 1000:
            return Response({"error": "events must be an array of at most 1000 records"}, status=400)
        serializer = CalendarEventSerializer(data=events, many=True)
        serializer.is_valid(raise_exception=True)
        unique = {event["id"]: event for event in serializer.validated_data}
        for event in unique.values():
            if event["end"] < event["start"]:
                raise serializers.ValidationError("Event end must follow start")
        try:
            with transaction.atomic():
                if CalendarEvent.objects.filter(id__in=unique).exclude(user=request.user).exists():
                    return Response({"error": "Event identity conflict"}, status=409)
                for event_id, data in unique.items():
                    CalendarEvent.objects.update_or_create(id=event_id, user=request.user, defaults=data)
                CalendarEvent.objects.filter(user=request.user).exclude(id__in=unique).delete()
        except IntegrityError:
            return Response({"error": "Event identity conflict"}, status=409)
        return Response({"success": True, "savedCount": len(unique), "totalCount": len(events)})
