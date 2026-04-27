from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.users.urls")),
    path("api/", include("apps.transactions.urls")),
    path("api/", include("apps.budgets.urls")),
    path("api/", include("apps.goals.urls")),
    path("api/", include("apps.bills.urls")),
    path("api/", include("apps.events.urls")),
    path("api/", include("apps.analysis.urls")),
    path("api/", include("apps.chat.urls")),
]
