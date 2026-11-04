from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Product, ProductVariant


class ProductListAPITests(APITestCase):
    def setUp(self):
        self.url = reverse("catalogue:product-list")
        self.category = Category.objects.create(
            name="Test Category",
            slug="test-category",
        )

    def create_product(self, index, price, *, inactive_variant_price=None):
        product = Product.objects.create(
            category=self.category,
            name=f"Test Perfume {index}",
            slug=f"test-perfume-{index}",
        )
        ProductVariant.objects.create(
            product=product,
            sku=f"TEST-{index}-ACTIVE",
            size_ml=50,
            price=price,
        )
        if inactive_variant_price is not None:
            ProductVariant.objects.create(
                product=product,
                sku=f"TEST-{index}-INACTIVE",
                size_ml=100,
                price=inactive_variant_price,
                is_active=False,
            )
        return product

    def test_product_list_is_paginated_to_twelve_products(self):
        for index in range(13):
            self.create_product(index, Decimal("100.00") + index)

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 13)
        self.assertEqual(len(response.data["results"]), 12)
        self.assertIsNotNone(response.data["next"])
        self.assertIsNone(response.data["previous"])

    def test_product_list_page_navigation_returns_remaining_products(self):
        for index in range(13):
            self.create_product(index, Decimal("100.00") + index)

        response = self.client.get(self.url, {"page": 2})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertIsNone(response.data["next"])
        self.assertIsNotNone(response.data["previous"])

    def test_inactive_variants_are_excluded_from_public_response(self):
        self.create_product(
            1,
            Decimal("100.00"),
            inactive_variant_price=Decimal("10.00"),
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        variants = response.data["results"][0]["variants"]
        self.assertEqual(len(variants), 1)
        self.assertEqual(variants[0]["price"], "100.00")
        self.assertTrue(variants[0]["is_active"])

    def test_products_are_ordered_by_lowest_active_variant_price_ascending(self):
        self.create_product(1, Decimal("300.00"))
        self.create_product(2, Decimal("100.00"))
        self.create_product(3, Decimal("200.00"))

        response = self.client.get(self.url, {"ordering": "price"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [product["name"] for product in response.data["results"]],
            ["Test Perfume 2", "Test Perfume 3", "Test Perfume 1"],
        )

    def test_products_are_ordered_by_lowest_active_variant_price_descending(self):
        self.create_product(1, Decimal("300.00"))
        self.create_product(2, Decimal("100.00"))
        self.create_product(3, Decimal("200.00"))

        response = self.client.get(self.url, {"ordering": "-price"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [product["name"] for product in response.data["results"]],
            ["Test Perfume 1", "Test Perfume 3", "Test Perfume 2"],
        )
