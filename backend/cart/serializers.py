from decimal import Decimal

from rest_framework import serializers

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()
    variant_id = serializers.IntegerField(source="variant.id", read_only=True)
    sku = serializers.CharField(source="variant.sku", read_only=True)
    size_ml = serializers.IntegerField(source="variant.size_ml", read_only=True)
    price = serializers.DecimalField(
        source="variant.price",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = (
            "id",
            "product",
            "variant_id",
            "sku",
            "size_ml",
            "price",
            "quantity",
            "subtotal",
        )
        read_only_fields = fields

    def get_product(self, obj):
        product = obj.variant.product
        return {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
        }

    def get_subtotal(self, obj):
        return obj.variant.price * obj.quantity


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ("id", "items", "total")
        read_only_fields = fields

    def get_total(self, obj):
        return sum(
            (item.variant.price * item.quantity for item in obj.items.all()),
            Decimal("0.00"),
        )


class CartItemCreateSerializer(serializers.Serializer):
    variant_id = serializers.IntegerField(min_value=1)
    quantity = serializers.IntegerField(min_value=1)


class CartItemUpdateSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)
