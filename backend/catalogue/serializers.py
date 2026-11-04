"""
Serializers for the catalogue app.
"""

from django.db.models import Min, Q
from rest_framework import serializers

from .models import (
    Category,
    Collection,
    Product,
    ProductVariant,
    ProductImage,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description"]
        read_only_fields = fields


class CollectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ["id", "name", "slug", "description", "sort_order"]
        read_only_fields = fields


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "sku",
            "size_ml",
            "price",
            "compare_at_price",
            "stock_quantity",
            "is_active",
        ]
        read_only_fields = fields


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = [
            "id",
            "image_url",
            "alt_text",
            "is_primary",
            "sort_order",
        ]
        read_only_fields = fields


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    collections = CollectionSerializer(many=True, read_only=True)
    variants = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "slug",
            "name",
            "short_description",
            "description",
            "fragrance_family",
            "concentration",
            "gender",
            "top_notes",
            "middle_notes",
            "base_notes",
            "is_featured",
            "category",
            "collections",
            "variants",
            "images",
        ]
        read_only_fields = fields

    def get_variants(self, obj):
        # Only active variants that are in stock or allow zero stock (still visible)
        qs = obj.variants.filter(is_active=True)
        return ProductVariantSerializer(qs, many=True).data

    def get_images(self, obj):
        qs = obj.images.all().order_by("sort_order", "id")
        return ProductImageSerializer(qs, many=True).data

