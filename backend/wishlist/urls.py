from django.urls import path

from .views import (
    WishlistClearView,
    WishlistItemCreateView,
    WishlistItemDetailView,
    WishlistView,
)

app_name = "wishlist"

urlpatterns = [
    path("", WishlistView.as_view(), name="detail"),
    path("items/", WishlistItemCreateView.as_view(), name="item-create"),
    path("items/<int:pk>/", WishlistItemDetailView.as_view(), name="item-detail"),
    path("clear/", WishlistClearView.as_view(), name="clear"),
]
