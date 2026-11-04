from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product",
            "variant",
            "product_name",
            "sku",
            "size_ml",
            "unit_price",
            "quantity",
            "line_total",
        )
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "status",
            "payment_method",
            "payment_status",
            "shipping_recipient_name",
            "shipping_phone",
            "shipping_address_line1",
            "shipping_address_line2",
            "shipping_landmark",
            "shipping_city",
            "shipping_state",
            "shipping_postal_code",
            "shipping_country",
            "subtotal",
            "shipping_fee",
            "total_amount",
            "items",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class CheckoutSerializer(serializers.Serializer):
    address_id = serializers.IntegerField(min_value=1)
