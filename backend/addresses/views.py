from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Address
from .serializers import AddressSerializer

User = get_user_model()


# ---------------------------------------------------------------------------
# Address List/Create View
# ---------------------------------------------------------------------------

class AddressListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/addresses/  — List the authenticated customer's addresses.
    POST /api/addresses/  — Create a new address. First address becomes default.
    """

    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        is_default = serializer.validated_data.get("is_default", False)

        with transaction.atomic():
            # Lock the user row before inspecting or changing default state
            User.objects.select_for_update().get(pk=user.pk)

            has_addresses = Address.objects.filter(user=user).exists()

            # First-ever address always becomes the default regardless of submitted value
            if not has_addresses:
                is_default = True

            if is_default:
                # Clear any existing default for this customer
                Address.objects.filter(user=user, is_default=True).update(is_default=False)

            serializer.save(user=user, is_default=is_default)


# ---------------------------------------------------------------------------
# Address Retrieve/Update/Delete View
# ---------------------------------------------------------------------------

class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/addresses/<id>/  — Retrieve an address.
    PUT    /api/addresses/<id>/  — Replace an address.
    PATCH  /api/addresses/<id>/  — Partially update an address.
    DELETE /api/addresses/<id>/  — Delete an address.
    """

    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Strictly scoped to the authenticated user — other users' addresses return 404
        return Address.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        user = self.request.user
        instance = serializer.instance
        new_is_default = serializer.validated_data.get("is_default", instance.is_default)

        with transaction.atomic():
            User.objects.select_for_update().get(pk=user.pk)

            if new_is_default:
                Address.objects.filter(user=user, is_default=True).exclude(pk=instance.pk).update(
                    is_default=False
                )

            serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        was_default = instance.is_default

        with transaction.atomic():
            User.objects.select_for_update().get(pk=user.pk)
            instance.delete()

            if was_default:
                # Promote the most recently updated remaining address to default
                next_default = (
                    Address.objects.filter(user=user, is_default=False)
                    .order_by("-updated_at")
                    .first()
                )
                if next_default:
                    next_default.is_default = True
                    next_default.save(update_fields=["is_default", "updated_at"])


# ---------------------------------------------------------------------------
# Set-Default Action View
# ---------------------------------------------------------------------------

class AddressSetDefaultView(APIView):
    """
    POST /api/addresses/<id>/set-default/
    Marks the specified address as the customer's default and clears the
    previous default within a single atomic transaction.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        with transaction.atomic():
            # Lock the customer row first to serialize default-address changes.
            User.objects.select_for_update().get(pk=user.pk)
            # Ownership check — returns 404 if the address doesn't belong to this customer.
            try:
                address = Address.objects.get(pk=pk, user=user)
            except Address.DoesNotExist:
                raise NotFound()
            # Remove the previous default.
            Address.objects.filter(user=user, is_default=True).exclude(pk=address.pk).update(is_default=False)
            # Set the selected address as default.
            address.is_default = True
            address.save(update_fields=["is_default", "updated_at"])
            return Response(AddressSerializer(address).data, status=status.HTTP_200_OK)