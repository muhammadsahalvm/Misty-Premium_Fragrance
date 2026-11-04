from rest_framework import serializers

from catalogue.serializers import ProductSerializer

from .models import Wishlist, WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = WishlistItem
        fields = ("id", "product", "created_at")
        read_only_fields = fields


class WishlistSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = Wishlist
        fields = ("id", "items", "created_at", "updated_at")
        read_only_fields = fields

    def get_items(self, obj):
        items = getattr(obj, "_visible_items", obj.items.all())
        return WishlistItemSerializer(items, many=True).data


class WishlistItemCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
