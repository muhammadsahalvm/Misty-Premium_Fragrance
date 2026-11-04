from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from catalogue.models import Collection, Product, ProductImage, ProductVariant

from .models import Wishlist, WishlistItem
from .serializers import WishlistItemCreateSerializer, WishlistSerializer

User = get_user_model()


def wishlist_queryset(include_inactive=False):
    item_queryset = WishlistItem.objects.select_related(
        "product__category",
    ).prefetch_related(
        Prefetch(
            "product__collections",
            queryset=Collection.objects.filter(is_active=True),
        ),
        Prefetch(
            "product__variants",
            queryset=ProductVariant.objects.filter(is_active=True),
            to_attr="_active_variants",
        ),
        Prefetch(
            "product__images",
            queryset=ProductImage.objects.all(),
            to_attr="_prefetched_images",
        ),
    )
    if not include_inactive:
        item_queryset = item_queryset.filter(product__is_active=True)

    return Wishlist.objects.prefetch_related(
        Prefetch("items", queryset=item_queryset, to_attr="_visible_items"),
    ).select_related("user")


def get_wishlist_for_user(user):
    with transaction.atomic():
        User.objects.select_for_update().get(pk=user.pk)
        wishlist, _ = Wishlist.objects.get_or_create(user=user)
    return wishlist


def serialize_wishlist(wishlist, *, include_inactive=False):
    queryset = wishlist_queryset(include_inactive=include_inactive).filter(pk=wishlist.pk)
    return WishlistSerializer(queryset.get()).data


class WishlistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wishlist = get_wishlist_for_user(request.user)
        return Response(serialize_wishlist(wishlist), status=status.HTTP_200_OK)


class WishlistItemCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        input_serializer = WishlistItemCreateSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        product_id = input_serializer.validated_data["product_id"]

        with transaction.atomic():
            User.objects.select_for_update().get(pk=request.user.pk)
            wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
            product = get_object_or_404(
                Product.objects.select_for_update(),
                pk=product_id,
            )
            if not product.is_active:
                raise ValidationError({"product_id": "This product is inactive."})
            WishlistItem.objects.get_or_create(
                wishlist=wishlist,
                product=product,
            )
            wishlist.save(update_fields=["updated_at"])

        return Response(
            serialize_wishlist(wishlist),
            status=status.HTTP_200_OK,
        )


class WishlistItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        with transaction.atomic():
            item = get_object_or_404(
                WishlistItem.objects.select_for_update().filter(
                    pk=pk,
                    wishlist__user=request.user,
                ).select_related("wishlist"),
            )
            wishlist = item.wishlist
            item.delete()
            wishlist.save(update_fields=["updated_at"])

        return Response(
            serialize_wishlist(wishlist),
            status=status.HTTP_200_OK,
        )


class WishlistClearView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        wishlist = get_wishlist_for_user(request.user)
        WishlistItem.objects.filter(wishlist=wishlist).delete()
        wishlist.save(update_fields=["updated_at"])
        return Response(
            serialize_wishlist(wishlist),
            status=status.HTTP_200_OK,
        )
