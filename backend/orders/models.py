from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from catalogue.models import Product, ProductVariant


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    class PaymentMethod(models.TextChoices):
        COD = "cod", "Cash on Delivery"

    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    id = models.BigAutoField(primary_key=True)
    order_number = models.CharField(max_length=32, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    payment_method = models.CharField(
        max_length=10,
        choices=PaymentMethod.choices,
        default=PaymentMethod.COD,
    )
    payment_status = models.CharField(
        max_length=10,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    shipping_recipient_name = models.CharField(max_length=150)
    shipping_phone = models.CharField(max_length=25)
    shipping_address_line1 = models.CharField(max_length=255)
    shipping_address_line2 = models.CharField(max_length=255, blank=True, default="")
    shipping_landmark = models.CharField(max_length=255, blank=True, default="")
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_postal_code = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=100, default="India")
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    shipping_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="idx_order_user_created"),
            models.Index(fields=["status", "-created_at"], name="idx_order_status_created"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(subtotal__gte=0),
                name="order_subtotal_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(shipping_fee__gte=0),
                name="order_shipping_fee_non_negative",
            ),
            models.CheckConstraint(
                condition=models.Q(total_amount__gte=0),
                name="order_total_non_negative",
            ),
        ]

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    id = models.BigAutoField(primary_key=True)
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )
    product_name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100)
    size_ml = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    line_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]
        indexes = [
            models.Index(fields=["order", "product"], name="idx_orderitem_order_product"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gt=0),
                name="order_item_quantity_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(unit_price__gt=0),
                name="order_item_unit_price_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(line_total__gt=0),
                name="order_item_line_total_positive",
            ),
        ]

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"
