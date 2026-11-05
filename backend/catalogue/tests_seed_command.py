from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from .models import Category, Product, ProductImage, ProductVariant


class SeedCatalogueCommandTests(TestCase):
    def test_seed_catalogue_is_idempotent_and_creates_public_records(self):
        call_command("seed_catalogue", stdout=StringIO())
        call_command("seed_catalogue", stdout=StringIO())

        self.assertEqual(Category.objects.filter(slug__in=["woody", "floral", "fresh", "oriental"]).count(), 4)
        products = Product.objects.filter(slug__in=[
            "the-tragedy-of-lord-george", "oud-essence", "blanche",
            "rose-eternelle", "aqua", "citrus-bloom", "amber-noir", "santal",
        ])
        self.assertEqual(products.count(), 8)
        self.assertEqual(ProductVariant.objects.filter(product__in=products, is_active=True).count(), 16)
        self.assertEqual(ProductImage.objects.filter(product__in=products, is_primary=True).count(), 8)
        self.assertTrue(all(product.is_active and product.variants.filter(is_active=True).exists() for product in products))
