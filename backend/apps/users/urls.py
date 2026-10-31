from django.urls import path

from .views import GoogleAuthView, GoogleStartView

urlpatterns = [
    path("auth/google/start/", GoogleStartView.as_view(), name="google-start"),
    path("auth/google/", GoogleAuthView.as_view(), name="google-auth"),
]
