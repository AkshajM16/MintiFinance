import os

from django.conf import settings
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .serializers import UserSerializer


class GoogleAuthView(APIView):
    """Exchange a Google id_token for a DRF auth token."""

    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("id_token")
        if not token:
            return Response(
                {"error": "id_token is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        client_id = settings.GOOGLE_CLIENT_ID
        if not client_id:
            return Response(
                {"error": "Google client ID not configured"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        try:
            id_info = google_id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                client_id,
            )
        except ValueError as exc:
            return Response(
                {"error": f"Invalid token: {exc}"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        google_sub = id_info.get("sub")
        email = id_info.get("email")
        name = id_info.get("name")
        picture = id_info.get("picture")

        if not email:
            return Response(
                {"error": "Email not present in token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user, _ = User.objects.update_or_create(
            email=email,
            defaults={
                "google_id": google_sub,
                "name": name or email,
                "picture": picture or "",
            },
        )

        auth_token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                "token": auth_token.key,
                "user": UserSerializer(user).data,
            }
        )
