"""
Catalogue app models for Misty e‑commerce platform.

Provides the public product catalogue: categories, collections, products,
product variants (different bottle sizes) and product images.
"""

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    """Product category – e.g. "Floral", "Woody" etc."""

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Collection(models.Model):
    """A curated collection – e.g. "Spring 2024" or "Best Sellers"."""

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "collections"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Product(models.Model):
    """Core product definition.

    Variants (different bottle sizes) and images are related models.
    """

    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="products"
    )
    collections = models.ManyToManyField(
        Collection, related_name="products", blank=True
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    short_description = models.CharField(max_length=512, blank=True)
    description = models.TextField(blank=True)
    fragrance_family = models.CharField(max_length=255, blank=True)
    concentration = models.CharField(max_length=255, blank=True)
    gender = models.CharField(max_length=50, blank=True)
    top_notes = models.CharField(max_length=512, blank=True)
    middle_notes = models.CharField(max_length=512, blank=True)
    base_notes = models.CharField(max_length=512, blank=True)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["slug"])]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class ProductVariant(models.Model):
    """Specific bottle size / SKU for a product."""

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="variants"
    )
    sku = models.CharField(max_length=100, unique=True)
    size_ml = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)]
    )
    compare_at_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-price"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(compare_at_price__gt=models.F("price")) | models.Q(compare_at_price__isnull=True),
                name="compare_price_gt_price",
            ),
            models.CheckConstraint(
                check=models.Q(price__gt=0),
                name="price_positive",
            ),
            models.CheckConstraint(
                check=models.Q(size_ml__gt=0),
                name="size_ml_positive",
            ),
            models.CheckConstraint(
                check=models.Q(stock_quantity__gte=0),
                name="stock_quantity_non_negative",
            ),
        ]

    def __str__(self):
        return f"{self.product.name} – {self.size_ml}ml (SKU: {self.sku})"

    def clean(self):
        # Ensure compare_at_price > price if provided
        if self.compare_at_price is not None and self.compare_at_price <= self.price:
            raise models.ValidationError(
                "compare_at_price must be greater than price"
            )


class ProductImage(models.Model):
    """Image for a product – stored externally (e.g. Cloudinary)."""

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images"
    )
    image_url = models.URLField()
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sort_order", "id"]
        # Removed unique_together constraint to allow multiple primary images if needed.

    def __str__(self):
        return f"Image for {self.product.name} (primary={self.is_primary})"

