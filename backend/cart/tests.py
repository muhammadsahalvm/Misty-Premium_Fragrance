from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from catalogue.models import Category, Product, ProductVariant

from .models import Cart, CartItem

User = get_user_model()


class CartModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="customer@example.com",
            password="CartTestPassword2026!",
        )
        self.category = Category.objects.create(
            name="Cart Test Category",
            slug="cart-test-category",
        )
        self.product = Product.objects.create(
            category=self.category,
            name="Cart Test Perfume",
            slug="cart-test-perfume",
        )
        self.variant_50ml = ProductVariant.objects.create(
            product=self.product,
            sku="CART-50ML",
            size_ml=50,
            price=Decimal("100.00"),
        )
        self.variant_100ml = ProductVariant.objects.create(
            product=self.product,
            sku="CART-100ML",
            size_ml=100,
            price=Decimal("180.00"),
        )

    def test_cart_can_be_created_for_a_user(self):
        cart = Cart.objects.create(user=self.user)

        self.assertEqual(cart.user, self.user)
        self.assertEqual(self.user.cart, cart)

    def test_user_can_have_only_one_cart(self):
        Cart.objects.create(user=self.user)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Cart.objects.create(user=self.user)

    def test_multiple_items_can_be_added_to_one_cart(self):
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, variant=self.variant_50ml, quantity=2)
        CartItem.objects.create(cart=cart, variant=self.variant_100ml, quantity=1)

        self.assertEqual(cart.items.count(), 2)

    def test_different_variants_of_one_product_can_coexist(self):
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, variant=self.variant_50ml, quantity=1)
        CartItem.objects.create(cart=cart, variant=self.variant_100ml, quantity=1)

        self.assertSetEqual(
            set(cart.items.values_list("variant_id", flat=True)),
            {self.variant_50ml.id, self.variant_100ml.id},
        )

    def test_duplicate_variant_in_one_cart_is_rejected(self):
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, variant=self.variant_50ml, quantity=1)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                CartItem.objects.create(
                    cart=cart,
                    variant=self.variant_50ml,
                    quantity=2,
                )

    def test_zero_quantity_is_rejected(self):
        cart = Cart.objects.create(user=self.user)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                CartItem.objects.create(
                    cart=cart,
                    variant=self.variant_50ml,
                    quantity=0,
                )

    def test_deleting_cart_deletes_its_items(self):
        cart = Cart.objects.create(user=self.user)
        item = CartItem.objects.create(
            cart=cart,
            variant=self.variant_50ml,
            quantity=1,
        )

        cart.delete()

        self.assertFalse(CartItem.objects.filter(pk=item.pk).exists())

    def test_deleting_referenced_variant_is_protected(self):
        cart = Cart.objects.create(user=self.user)
        CartItem.objects.create(cart=cart, variant=self.variant_50ml, quantity=1)

        with self.assertRaises(IntegrityError):
            self.variant_50ml.delete()


class CartAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="api-customer@example.com",
            password="CartAPIPassword2026!",
        )
        self.other_user = User.objects.create_user(
            email="other-customer@example.com",
            password="CartAPassword2026!",
        )
        self.category = Category.objects.create(
            name="API Cart Category",
            slug="api-cart-category",
        )
        self.product = Product.objects.create(
            category=self.category,
            name="API Cart Perfume",
            slug="api-cart-perfume",
            is_active=True,
        )
        self.variant_50ml = ProductVariant.objects.create(
            product=self.product,
            sku="API-CART-50ML",
            size_ml=50,
            price=Decimal("125.00"),
            stock_quantity=5,
        )
        self.variant_100ml = ProductVariant.objects.create(
            product=self.product,
            sku="API-CART-100ML",
            size_ml=100,
            price=Decimal("200.00"),
            stock_quantity=3,
        )
        self.cart_url = reverse("cart:detail")
        self.items_url = reverse("cart:item-create")
        self.clear_url = reverse("cart:clear")

    def authenticate(self, user=None):
        refresh = RefreshToken.for_user(user or self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}",
        )

    def test_unauthenticated_cart_access_is_rejected(self):
        response = self.client.get(self.cart_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_get_creates_and_returns_empty_cart(self):
        self.authenticate()

        response = self.client.get(self.cart_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data["id"])
        self.assertEqual(response.data["items"], [])
        self.assertEqual(response.data["total"], Decimal("0.00"))
        self.assertTrue(Cart.objects.filter(user=self.user).exists())

    def test_valid_variant_can_be_added(self):
        self.authenticate()

        response = self.client.post(
            self.items_url,
            {"variant_id": self.variant_50ml.id, "quantity": 2},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"][0]["quantity"], 2)
        self.assertEqual(response.data["items"][0]["sku"], "API-CART-50ML")
        self.assertEqual(response.data["items"][0]["size_ml"], 50)
        self.assertEqual(response.data["items"][0]["price"], "125.00")
        self.assertEqual(response.data["items"][0]["subtotal"], Decimal("250.00"))
        self.assertEqual(response.data["total"], Decimal("250.00"))

    def test_adding_existing_variant_increases_quantity_without_duplicate(self):
        self.authenticate()
        self.client.post(
            self.items_url,
            {"variant_id": self.variant_50ml.id, "quantity": 2},
            format="json",
        )

        response = self.client.post(
            self.items_url,
            {"variant_id": self.variant_50ml.id, "quantity": 1},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(CartItem.objects.filter(cart__user=self.user).count(), 1)
        self.assertEqual(response.data["items"][0]["quantity"], 3)

    def test_different_bottle_sizes_can_be_added(self):
        self.authenticate()

        self.client.post(
            self.items_url,
            {"variant_id": self.variant_50ml.id, "quantity": 1},
            format="json",
        )
        response = self.client.post(
            self.items_url,
            {"variant_id": self.variant_100ml.id, "quantity": 1},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["items"]), 2)

    def test_inactive_variant_is_rejected(self):
        self.authenticate()
        self.variant_50ml.is_active = False
        self.variant_50ml.save(update_fields=["is_active"])

        response = self.client.post(
            self.items_url,
            {"variant_id": self.variant_50ml.id, "quantity": 1},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("variant_id", response.data)

    def test_inactive_product_is_rejected(self):
        self.authenticate()
        self.product.is_active = False
        self.product.save(update_fields=["is_active"])

        response = self.client.post(
            self.items_url,
            {"variant_id": self.variant_50ml.id, "quantity": 1},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("variant_id", response.data)

    def test_insufficient_stock_is_rejected(self):
        self.authenticate()

        response = self.client.post(
            self.items_url,
            {"variant_id": self.variant_50ml.id, "quantity": 6},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("quantity", response.data)

    def test_zero_and_negative_quantities_are_rejected(self):
        self.authenticate()

        for quantity in (0, -1):
            response = self.client.post(
                self.items_url,
                {"variant_id": self.variant_50ml.id, "quantity": quantity},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("quantity", response.data)

    def test_quantity_can_be_updated(self):
        self.authenticate()
        self.client.post(
            self.items_url,
            {"variant_id": self.variant_50ml.id, "quantity": 1},
            format="json",
        )
        item = CartItem.objects.get(cart__user=self.user)

        response = self.client.patch(
            reverse("cart:item-detail", kwargs={"pk": item.pk}),
            {"quantity": 4},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"][0]["quantity"], 4)
        self.assertEqual(response.data["total"], Decimal("500.00"))

    def test_item_can_be_removed(self):
        self.authenticate()
        self.client.post(
            self.items_url,
            {"variant_id": self.variant_50ml.id, "quantity": 1},
            format="json",
        )
        item = CartItem.objects.get(cart__user=self.user)

        response = self.client.delete(
            reverse("cart:item-detail", kwargs={"pk": item.pk}),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"], [])
        self.assertFalse(CartItem.objects.filter(pk=item.pk).exists())

    def test_cart_can_be_cleared_without_deleting_cart(self):
        self.authenticate()
        self.client.post(
            self.items_url,
            {"variant_id": self.variant_50ml.id, "quantity": 1},
            format="json",
        )
        cart_id = Cart.objects.get(user=self.user).id

        response = self.client.delete(self.clear_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"], [])
        self.assertTrue(Cart.objects.filter(pk=cart_id).exists())

    def test_item_outside_customer_cart_returns_not_found(self):
        self.authenticate()
        other_cart = Cart.objects.create(user=self.other_user)
        item = CartItem.objects.create(
            cart=other_cart,
            variant=self.variant_50ml,
            quantity=1,
        )

        response = self.client.patch(
            reverse("cart:item-detail", kwargs={"pk": item.pk}),
            {"quantity": 2},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_current_price_is_used_after_price_change(self):
        self.authenticate()
        self.client.post(
            self.items_url,
            {"variant_id": self.variant_50ml.id, "quantity": 2},
            format="json",
        )
        self.variant_50ml.price = Decimal("150.00")
        self.variant_50ml.save(update_fields=["price"])

        response = self.client.get(self.cart_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"][0]["price"], "150.00")
        self.assertEqual(response.data["items"][0]["subtotal"], Decimal("300.00"))
        self.assertEqual(response.data["total"], Decimal("300.00"))

    def test_stock_change_after_addition_is_checked_on_update(self):
        self.authenticate()
        self.client.post(
            self.items_url,
            {"variant_id": self.variant_50ml.id, "quantity": 2},
            format="json",
        )
        self.variant_50ml.stock_quantity = 1
        self.variant_50ml.save(update_fields=["stock_quantity"])
        item = CartItem.objects.get(cart__user=self.user)

        response = self.client.patch(
            reverse("cart:item-detail", kwargs={"pk": item.pk}),
            {"quantity": 2},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("quantity", response.data)

    def test_stock_change_after_addition_is_checked_when_increasing(self):
        self.authenticate()
        self.client.post(
            self.items_url,
            {"variant_id": self.variant_50ml.id, "quantity": 2},
            format="json",
        )
        self.variant_50ml.stock_quantity = 2
        self.variant_50ml.save(update_fields=["stock_quantity"])

        response = self.client.post(
            self.items_url,
            {"variant_id": self.variant_50ml.id, "quantity": 1},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("quantity", response.data)
