from django.urls import path

from .views import (
    CurrentUserProfileView,
    CustomTokenRefreshView,
    LoginView,
    RegisterView,
)

app_name = "accounts"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("me/", CurrentUserProfileView.as_view(), name="me"),
]

