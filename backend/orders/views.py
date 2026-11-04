from decimal import Decimal
from uuid import uuid4

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from addresses.models import Address
from cart.models import Cart, CartItem
from catalogue.models import ProductVariant

from .models import Order, OrderItem
from .serializers import CheckoutSerializer, OrderSerializer

SHIPPING_FEE = Decimal("0.00")
CANCELLABLE_STATUSES = {Order.Status.PENDING, Order.Status.CONFIRMED}


def new_order_number():
    return f"MST-{uuid4().hex[:24].upper()}"


def order_queryset():
    return Order.objects.prefetch_related("items").select_related("user")


class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        address_id = serializer.validated_data["address_id"]

        with transaction.atomic():
            address = get_object_or_404(
                Address.objects.select_for_update().filter(
                    pk=address_id,
                    user=request.user,
                ),
            )
            cart = (
                Cart.objects.select_for_update()
                .filter(user=request.user)
                .first()
            )
            if cart is None:
                raise ValidationError({"cart": "Your cart is empty."})
            cart_items = list(
                CartItem.objects.select_for_update()
                .filter(cart=cart)
                .order_by("id")
            )
            if not cart_items:
                raise ValidationError({"cart": "Your cart is empty."})

            variant_ids = [item.variant_id for item in cart_items]
            variants = {
                variant.id: variant
                for variant in ProductVariant.objects.select_for_update()
                .select_related("product")
                .filter(id__in=variant_ids)
            }
            subtotal = Decimal("0.00")
            validated_items = []
            for cart_item in cart_items:
                variant = variants.get(cart_item.variant_id)
                if variant is None:
                    raise ValidationError({"cart": "A cart item is no longer available."})
                if not variant.is_active:
                    raise ValidationError({"cart": f"{variant.sku} is inactive."})
                if not variant.product.is_active:
                    raise ValidationError({"cart": f"{variant.product.name} is inactive."})
                if cart_item.quantity > variant.stock_quantity:
                    raise ValidationError(
                        {"stock": f"Insufficient stock for {variant.product.name}."}
                    )
                line_total = variant.price * cart_item.quantity
                subtotal += line_total
                validated_items.append((cart_item, variant, line_total))

            order = Order.objects.create(
                order_number=new_order_number(),
                user=request.user,
                payment_method=Order.PaymentMethod.COD,
                payment_status=Order.PaymentStatus.PENDING,
                shipping_recipient_name=address.recipient_name,
                shipping_phone=address.phone_number,
                shipping_address_line1=address.address_line1,
                shipping_address_line2=address.address_line2,
                shipping_landmark=address.landmark,
                shipping_city=address.city,
                shipping_state=address.state,
                shipping_postal_code=address.postal_code,
                shipping_country=address.country,
                subtotal=subtotal,
                shipping_fee=SHIPPING_FEE,
                total_amount=subtotal + SHIPPING_FEE,
            )
            for cart_item, variant, line_total in validated_items:
                OrderItem.objects.create(
                    order=order,
                    product=variant.product,
                    variant=variant,
                    product_name=variant.product.name,
                    sku=variant.sku,
                    size_ml=variant.size_ml,
                    unit_price=variant.price,
                    quantity=cart_item.quantity,
                    line_total=line_total,
                )
                variant.stock_quantity -= cart_item.quantity
                variant.save(update_fields=["stock_quantity", "updated_at"])
            cart_items_qs = CartItem.objects.filter(cart=cart)
            cart_items_qs.delete()
            cart.save(update_fields=["updated_at"])

        return Response(
            OrderSerializer(order_queryset().get(pk=order.pk)).data,
            status=status.HTTP_201_CREATED,
        )


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return order_queryset().filter(user=self.request.user)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return order_queryset().filter(user=self.request.user)


class OrderCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        with transaction.atomic():
            order = get_object_or_404(
                Order.objects.select_for_update().filter(
                    pk=pk,
                    user=request.user,
                ),
            )
            if order.status not in CANCELLABLE_STATUSES:
                raise ValidationError(
                    {"status": "This order cannot be cancelled in its current status."}
                )
            items = list(
                OrderItem.objects.select_for_update()
                .filter(order=order)
                .order_by("id")
            )
            variant_ids = [item.variant_id for item in items if item.variant_id is not None]
            variants = {
                variant.id: variant
                for variant in ProductVariant.objects.select_for_update().filter(
                    id__in=variant_ids,
                )
            }
            for item in items:
                variant = variants.get(item.variant_id)
                if variant is not None:
                    variant.stock_quantity += item.quantity
                    variant.save(update_fields=["stock_quantity", "updated_at"])
            order.status = Order.Status.CANCELLED
            order.save(update_fields=["status", "updated_at"])

        return Response(
            OrderSerializer(order_queryset().get(pk=order.pk)).data,
            status=status.HTTP_200_OK,
        )
