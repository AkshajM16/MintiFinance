import secrets
import time
from django.utils.crypto import constant_time_compare

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


class GoogleStartView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        state, nonce = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
        request.session["oauth"] = {"state": state, "nonce": nonce, "created": time.time()}
        return Response({"state": state, "nonce": nonce})


class GoogleAuthView(APIView):
    """Exchange a Google id_token for a DRF auth token."""

    permission_classes = [AllowAny]

    def post(self, request):
        pending = request.session.pop("oauth", None)
        state = request.data.get("state")
        if (not pending or not isinstance(state, str) or time.time() - pending["created"] > 600
                or not constant_time_compare(state, pending["state"])):
            return Response({"error": "Login expired or invalid"}, status=401)
        token = request.data.get("id_token")
        if not isinstance(token, str) or not token or len(token) > 16384:
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
        except Exception:
            return Response(
                {"error": "Invalid Google credential"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if (id_info.get("nonce") != pending["nonce"] or id_info.get("email_verified") is not True
                or not id_info.get("sub")):
            return Response({"error": "Invalid Google credential"}, status=401)
        google_sub = id_info.get("sub")
        email = id_info.get("email")
        name = id_info.get("name")
        picture = id_info.get("picture")

        if not email:
            return Response(
                {"error": "Email not present in token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = User.objects.filter(email=email).first()
        if existing and existing.google_id and existing.google_id != google_sub:
            return Response({"error": "Account identity mismatch"}, status=401)
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
