from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import (
    EmailTokenObtainPairSerializer,
    RegisterSerializer,
    UserProfileUpdateSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    """
    Endpoint for new customer registration.
    Accessible to unauthenticated visitors (AllowAny).
    Returns safe user details without credentials.
    """

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        response_serializer = UserSerializer(user)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """
    Endpoint for customer login via email and password.
    Accessible to unauthenticated visitors (AllowAny).
    Returns JWT access and refresh tokens.
    """

    serializer_class = EmailTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class CustomTokenRefreshView(TokenRefreshView):
    """
    Endpoint to refresh an expired access token using a valid refresh token.
    Accessible to anyone with a valid refresh token (AllowAny).
    """

    permission_classes = [permissions.AllowAny]


class CurrentUserProfileView(generics.RetrieveUpdateAPIView):
    """
    Endpoint to retrieve and update the currently authenticated customer's profile.
    Requires valid JWT authentication (IsAuthenticated).

    GET:   Returns safe fields: id, email, first_name, last_name, phone_number, date_joined.
    PATCH: Partially update editable fields: first_name, last_name, phone_number.
    PUT:   Fully update editable fields: first_name, last_name, phone_number.

    email, id, and date_joined are always read-only.
    Administrative flags (is_staff, is_superuser, is_active) are never exposed or accepted.
    """

    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "put", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UserProfileUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user
