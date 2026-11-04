"""
Django admin registration for the catalogue app.
"""

from django.contrib import admin
from .models import Category, Collection, Product, ProductVariant, ProductImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "created_at")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")
    list_filter = ("is_active",)


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "sort_order", "created_at")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug")
    list_filter = ("is_active",)
    ordering = ("sort_order", "name")


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0
    fields = (
        "sku",
        "size_ml",
        "price",
        "compare_at_price",
        "stock_quantity",
        "is_active",
    )
    readonly_fields = ()
    show_change_link = True


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0
    fields = (
        "image_url",
        "alt_text",
        "is_primary",
        "sort_order",
    )
    readonly_fields = ()
    show_change_link = True


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "slug",
        "category",
        "is_featured",
        "is_active",
        "created_at",
    )
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "slug", "description")
    list_filter = ("is_active", "is_featured", "category", "fragrance_family", "concentration", "gender")
    inlines = [ProductVariantInline, ProductImageInline]
    ordering = ("-created_at",)
    filter_horizontal = ("collections",)


admin.site.register(ProductVariant)
admin.site.register(ProductImage)

