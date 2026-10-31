from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView
from .views import health

urlpatterns = [
    path("api/health", health),
    path("api/", include("apps.alerts.urls")),
    path("admin/", admin.site.urls),
    path("api/", include("apps.users.urls")),
    path("api/", include("apps.transactions.urls")),
    path("api/", include("apps.budgets.urls")),
    path("api/", include("apps.goals.urls")),
    path("api/", include("apps.bills.urls")),
    path("api/", include("apps.events.urls")),
    path("api/", include("apps.analysis.urls")),
    path("api/", include("apps.chat.urls")),
    re_path(r"^(?!api/|admin/|static/).*", TemplateView.as_view(template_name="index.html")),
]
