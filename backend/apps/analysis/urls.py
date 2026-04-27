from django.urls import path

from .views import SpendingAnalysisView

urlpatterns = [
    path("analysis/spending", SpendingAnalysisView.as_view(), name="spending-analysis"),
]
