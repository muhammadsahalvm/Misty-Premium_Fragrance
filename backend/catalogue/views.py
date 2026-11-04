"""
Views for the public product catalogue.
Only read‑only endpoints are exposed – customers cannot modify data.
"""

from django.db.models import Prefetch, Q, Min, Exists, OuterRef
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, filters
from rest_framework.pagination import PageNumberPagination
from .models import Category, Collection, Product, ProductVariant, ProductImage
from .serializers import (
    CategorySerializer,
    CollectionSerializer,
    ProductSerializer,
)

# ---------------------------------------------------------------------------
# Category list
# ---------------------------------------------------------------------------

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True).order_by("name")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

# ---------------------------------------------------------------------------
# Collection list
# ---------------------------------------------------------------------------

class CollectionListView(generics.ListAPIView):
    queryset = Collection.objects.filter(is_active=True).order_by("sort_order", "name")
    serializer_class = CollectionSerializer
    permission_classes = [permissions.AllowAny]

# ---------------------------------------------------------------------------
# Product list with filters & search
# ---------------------------------------------------------------------------

class ProductPagination(PageNumberPagination):
    page_size = 12


class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = ProductPagination

    # DRF built‑in filters for search and ordering (no extra deps)
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "short_description"]
    ordering_fields = ["created_at", "price"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related(
            "category"
        ).prefetch_related(
            Prefetch("collections", queryset=Collection.objects.filter(is_active=True)),
            Prefetch(
                "variants",
                queryset=ProductVariant.objects.filter(is_active=True),
                to_attr="_active_variants",
            ),
            Prefetch(
                "images",
                queryset=ProductImage.objects.all(),
                to_attr="_prefetched_images",
            ),
        ).distinct()

        # Ensure product has at least one active variant
        qs = qs.filter(variants__is_active=True).annotate(
            price=Min("variants__price", filter=Q(variants__is_active=True))
        ).distinct()


        # --- custom filters via query params ---
        category_slug = self.request.query_params.get("category")
        if category_slug:
            qs = qs.filter(category__slug=category_slug, category__is_active=True)

        collection_slug = self.request.query_params.get("collection")
        if collection_slug:
            qs = qs.filter(collections__slug=collection_slug, collections__is_active=True)

        fragrance = self.request.query_params.get("fragrance_family")
        if fragrance:
            qs = qs.filter(fragrance_family__iexact=fragrance)

        concentration = self.request.query_params.get("concentration")
        if concentration:
            qs = qs.filter(concentration__iexact=concentration)

        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        if min_price or max_price:
            # Validate numeric non‑negative values
            try:
                min_val = float(min_price) if min_price is not None else None
                max_val = float(max_price) if max_price is not None else None
                if (min_val is not None and min_val < 0) or (max_val is not None and max_val < 0):
                    raise ValueError
            except ValueError:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"price": "min_price and max_price must be non‑negative numbers"})

            # Use Exists subquery to ensure at least one active variant matches price range
            variant_q = ProductVariant.objects.filter(
                product=OuterRef('pk'),
                is_active=True,
            )
            if min_val is not None:
                variant_q = variant_q.filter(price__gte=min_val)
            if max_val is not None:
                variant_q = variant_q.filter(price__lte=max_val)
            qs = qs.annotate(has_price=Exists(variant_q)).filter(has_price=True)


        in_stock = self.request.query_params.get("in_stock")
        if in_stock is not None:
            if in_stock.lower() not in ("true", "false"):
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"in_stock": "must be 'true' or 'false'"})
            stock_q = ProductVariant.objects.filter(
                product=OuterRef('pk'),
                is_active=True,
                stock_quantity__gt=0,
            )
            if in_stock.lower() == "true":
                qs = qs.annotate(has_stock=Exists(stock_q)).filter(has_stock=True)
            else:
                qs = qs.annotate(has_stock=Exists(stock_q)).filter(has_stock=False)
        return qs

# ---------------------------------------------------------------------------
# Product detail
# ---------------------------------------------------------------------------

class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True).select_related(
        "category"
    ).prefetch_related(
        Prefetch("collections", queryset=Collection.objects.filter(is_active=True)),
        Prefetch(
            "variants",
            queryset=ProductVariant.objects.filter(is_active=True),
            to_attr="_active_variants",
        ),
        Prefetch(
            "images",
            queryset=ProductImage.objects.all(),
            to_attr="_prefetched_images",
        ),
    )

    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    lookup_url_kwarg = "slug"

    def get_object(self):
        obj = get_object_or_404(self.get_queryset(), slug=self.kwargs.get(self.lookup_url_kwarg))
        return obj
