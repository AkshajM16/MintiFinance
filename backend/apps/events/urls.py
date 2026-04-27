from django.urls import path

from .views import CalendarEventView

urlpatterns = [
    path("events", CalendarEventView.as_view(), name="events"),
]
