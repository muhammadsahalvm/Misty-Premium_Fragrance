from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from catalogue.models import ProductVariant

from .models import Cart, CartItem
from .serializers import (
    CartItemCreateSerializer,
    CartItemSerializer,
    CartItemUpdateSerializer,
    CartSerializer,
)


def get_cart_for_user(user):
    return Cart.objects.prefetch_related(
        "items__variant__product",
    ).get_or_create(user=user)[0]


def serialize_cart(cart):
    cart.refresh_from_db()
    cart = Cart.objects.prefetch_related(
        "items__variant__product",
    ).get(pk=cart.pk)
    return CartSerializer(cart).data


def validate_variant_for_cart(variant):
    if not variant.is_active:
        raise ValidationError({"variant_id": "This product variant is inactive."})
    if not variant.product.is_active:
        raise ValidationError({"variant_id": "This product is inactive."})


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart = get_cart_for_user(request.user)
        return Response(serialize_cart(cart), status=status.HTTP_200_OK)


class CartItemCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        input_serializer = CartItemCreateSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        variant_id = input_serializer.validated_data["variant_id"]
        requested_quantity = input_serializer.validated_data["quantity"]

        with transaction.atomic():
            cart, _ = Cart.objects.select_for_update().get_or_create(
                user=request.user,
            )
            variant = get_object_or_404(
                ProductVariant.objects.select_for_update().select_related("product"),
                pk=variant_id,
            )
            validate_variant_for_cart(variant)
            item, created = CartItem.objects.select_for_update().get_or_create(
                cart=cart,
                variant=variant,
                defaults={"quantity": requested_quantity},
            )
            total_quantity = requested_quantity if created else item.quantity + requested_quantity
            if total_quantity > variant.stock_quantity:
                raise ValidationError(
                    {"quantity": "Requested quantity exceeds available stock."}
                )
            if not created:
                item.quantity = total_quantity
                item.save(update_fields=["quantity", "updated_at"])
            cart.save(update_fields=["updated_at"])

        return Response(serialize_cart(cart), status=status.HTTP_200_OK)


class CartItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        input_serializer = CartItemUpdateSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        quantity = input_serializer.validated_data["quantity"]

        with transaction.atomic():
            item = get_object_or_404(
                CartItem.objects.select_for_update().filter(
                    pk=pk,
                    cart__user=request.user,
                ).select_related("cart", "variant__product"),
            )
            variant = ProductVariant.objects.select_for_update().select_related(
                "product",
            ).get(pk=item.variant_id)
            validate_variant_for_cart(variant)
            if quantity > variant.stock_quantity:
                raise ValidationError(
                    {"quantity": "Requested quantity exceeds available stock."}
                )
            item.quantity = quantity
            item.save(update_fields=["quantity", "updated_at"])
            item.cart.save(update_fields=["updated_at"])

        return Response(serialize_cart(item.cart), status=status.HTTP_200_OK)

    def delete(self, request, pk):
        with transaction.atomic():
            item = get_object_or_404(
                CartItem.objects.select_for_update().filter(
                    pk=pk,
                    cart__user=request.user,
                ).select_related("cart"),
            )
            cart = item.cart
            item.delete()
            cart.save(update_fields=["updated_at"])

        return Response(serialize_cart(cart), status=status.HTTP_200_OK)


class CartClearView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        with transaction.atomic():
            cart = get_cart_for_user(request.user)
            CartItem.objects.filter(cart=cart).delete()
            cart.save(update_fields=["updated_at"])

        return Response(serialize_cart(cart), status=status.HTTP_200_OK)
