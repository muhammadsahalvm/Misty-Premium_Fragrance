from django.urls import path

from .views import AddressDetailView, AddressListCreateView, AddressSetDefaultView

app_name = "addresses"

urlpatterns = [
    path("", AddressListCreateView.as_view(), name="list_create"),
    path("<int:pk>/", AddressDetailView.as_view(), name="detail"),
    path("<int:pk>/set-default/", AddressSetDefaultView.as_view(), name="set_default"),
]

