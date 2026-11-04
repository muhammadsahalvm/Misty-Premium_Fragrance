from django.contrib import admin

from .models import Wishlist, WishlistItem


class WishlistItemInline(admin.TabularInline):
    model = WishlistItem
    extra = 0
    fields = ("product", "created_at")
    readonly_fields = ("created_at",)


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "item_count", "created_at", "updated_at")
    search_fields = ("user__email", "user__first_name", "user__last_name")
    list_filter = ("created_at", "updated_at")
    readonly_fields = ("created_at", "updated_at")
    inlines = [WishlistItemInline]

    @admin.display(description="Items")
    def item_count(self, obj):
        return obj.items.count()


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ("wishlist", "product", "created_at")
    search_fields = (
        "wishlist__user__email",
        "product__name",
        "product__slug",
    )
    list_filter = ("created_at", "product__is_active")
    readonly_fields = ("created_at",)
