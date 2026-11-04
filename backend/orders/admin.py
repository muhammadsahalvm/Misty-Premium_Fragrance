from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = (
        "product_name",
        "sku",
        "size_ml",
        "unit_price",
        "quantity",
        "line_total",
    )
    readonly_fields = fields


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "user",
        "status",
        "payment_method",
        "payment_status",
        "total_amount",
        "created_at",
    )
    search_fields = ("order_number", "user__email", "user__first_name", "user__last_name")
    list_filter = ("status", "payment_method", "payment_status", "created_at")
    readonly_fields = (
        "order_number",
        "user",
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
        "created_at",
        "updated_at",
    )
    fields = (
        "order_number",
        "user",
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
        "created_at",
        "updated_at",
    )
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "order",
        "product_name",
        "sku",
        "size_ml",
        "unit_price",
        "quantity",
        "line_total",
    )
    search_fields = ("order__order_number", "product_name", "sku")
    readonly_fields = (
        "order",
        "product",
        "variant",
        "product_name",
        "sku",
        "size_ml",
        "unit_price",
        "quantity",
        "line_total",
        "created_at",
    )
