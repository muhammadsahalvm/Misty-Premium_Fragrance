from django.contrib import admin

from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    fields = ("variant", "quantity", "created_at", "updated_at")
    readonly_fields = ("created_at", "updated_at")


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "item_count", "created_at", "updated_at")
    search_fields = ("user__email", "user__first_name", "user__last_name")
    list_filter = ("created_at", "updated_at")
    readonly_fields = ("created_at", "updated_at")
    inlines = [CartItemInline]

    @admin.display(description="Items")
    def item_count(self, obj):
        return obj.items.count()


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("cart", "variant", "quantity", "created_at", "updated_at")
    search_fields = ("cart__user__email", "variant__sku", "variant__product__name")
    list_filter = ("created_at", "updated_at")
    readonly_fields = ("created_at", "updated_at")
