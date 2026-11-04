from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from addresses.models import Address
from cart.models import Cart, CartItem
from catalogue.models import Category, Product, ProductVariant

from .models import Order, OrderItem

User = get_user_model()


class OrderAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="order-customer@example.com",
            password="OrderPassword2026!",
        )
        self.other_user = User.objects.create_user(
            email="other-order-customer@example.com",
            password="OtherOrderPassword2026!",
        )
        self.category = Category.objects.create(
            name="Order Category",
            slug="order-category",
        )
        self.product = Product.objects.create(
            category=self.category,
            name="Order Perfume",
            slug="order-perfume",
        )
        self.variant = ProductVariant.objects.create(
            product=self.product,
            sku="ORDER-50ML",
            size_ml=50,
            price=Decimal("125.00"),
            stock_quantity=5,
        )
        self.second_variant = ProductVariant.objects.create(
            product=self.product,
            sku="ORDER-100ML",
            size_ml=100,
            price=Decimal("200.00"),
            stock_quantity=3,
        )
        self.address = self.create_address(self.user, "Customer Address")
        self.other_address = self.create_address(self.other_user, "Other Address")
        self.checkout_url = reverse("orders:checkout")
        self.orders_url = reverse("orders:list")

    def create_address(self, user, recipient_name):
        return Address.objects.create(
            user=user,
            recipient_name=recipient_name,
            phone_number="+919876543210",
            address_line1="123 Main Street",
            address_line2="Apartment 4",
            landmark="Central Park",
            city="Mumbai",
            state="Maharashtra",
            postal_code="400001",
            country="India",
            is_default=True,
        )

    def authenticate(self, user=None):
        refresh = RefreshToken.for_user(user or self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}",
        )

    def add_to_cart(self, variant=None, quantity=1, user=None):
        cart = Cart.objects.create(user=user or self.user)
        CartItem.objects.create(
            cart=cart,
            variant=variant or self.variant,
            quantity=quantity,
        )
        return cart

    def test_unauthenticated_checkout_and_history_are_rejected(self):
        checkout_response = self.client.post(
            self.checkout_url,
            {"address_id": self.address.id},
            format="json",
        )
        history_response = self.client.get(self.orders_url)

        self.assertEqual(checkout_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(history_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_successful_cod_order_deducts_stock_and_clears_cart(self):
        cart = self.add_to_cart(quantity=2)
        self.authenticate()

        response = self.client.post(
            self.checkout_url,
            {"address_id": self.address.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order = Order.objects.get(order_number=response.data["order_number"])
        self.variant.refresh_from_db()
        self.assertEqual(order.payment_method, Order.PaymentMethod.COD)
        self.assertEqual(order.payment_status, Order.PaymentStatus.PENDING)
        self.assertEqual(order.subtotal, Decimal("250.00"))
        self.assertEqual(order.total_amount, Decimal("250.00"))
        self.assertEqual(self.variant.stock_quantity, 3)
        self.assertFalse(CartItem.objects.filter(cart=cart).exists())
        self.assertEqual(response.data["items"][0]["quantity"], 2)

    def test_empty_cart_is_rejected(self):
        Cart.objects.create(user=self.user)
        self.authenticate()

        response = self.client.post(
            self.checkout_url,
            {"address_id": self.address.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cart", response.data)

    def test_missing_cart_is_rejected(self):
        self.authenticate()

        response = self.client.post(
            self.checkout_url,
            {"address_id": self.address.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cart", response.data)

    def test_invalid_or_foreign_address_is_rejected(self):
        self.add_to_cart()
        self.authenticate()

        invalid_response = self.client.post(
            self.checkout_url,
            {"address_id": 999999},
            format="json",
        )
        foreign_response = self.client.post(
            self.checkout_url,
            {"address_id": self.other_address.id},
            format="json",
        )

        self.assertEqual(invalid_response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(foreign_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_insufficient_stock_rolls_back_order_stock_and_cart(self):
        cart = self.add_to_cart(quantity=6)
        self.authenticate()

        response = self.client.post(
            self.checkout_url,
            {"address_id": self.address.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Order.objects.exists())
        self.assertTrue(CartItem.objects.filter(cart=cart).exists())
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 5)

    def test_server_ignores_client_totals_and_prices(self):
        self.add_to_cart(quantity=2)
        self.authenticate()

        response = self.client.post(
            self.checkout_url,
            {
                "address_id": self.address.id,
                "subtotal": "1.00",
                "shipping_fee": "999.00",
                "total_amount": "1.00",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["subtotal"], "250.00")
        self.assertEqual(response.data["shipping_fee"], "0.00")
        self.assertEqual(response.data["total_amount"], "250.00")

    def test_address_and_order_item_snapshots_are_preserved(self):
        self.add_to_cart(quantity=1)
        self.authenticate()

        response = self.client.post(
            self.checkout_url,
            {"address_id": self.address.id},
            format="json",
        )
        order = Order.objects.get(pk=response.data["id"])
        item = order.items.get()

        self.product.name = "Renamed Perfume"
        self.product.save(update_fields=["name"])
        self.variant.price = Decimal("999.00")
        self.variant.save(update_fields=["price"])
        self.address.recipient_name = "Changed Recipient"
        self.address.save(update_fields=["recipient_name"])
        item.refresh_from_db()
        order.refresh_from_db()

        self.assertEqual(item.product_name, "Order Perfume")
        self.assertEqual(item.unit_price, Decimal("125.00"))
        self.assertEqual(order.shipping_recipient_name, "Customer Address")

    def test_order_history_and_detail_are_scoped_to_customer(self):
        self.add_to_cart()
        self.authenticate()
        response = self.client.post(
            self.checkout_url,
            {"address_id": self.address.id},
            format="json",
        )
        order_id = response.data["id"]

        history_response = self.client.get(self.orders_url)
        self.assertEqual(history_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(history_response.data), 1)

        self.authenticate(self.other_user)
        detail_response = self.client.get(
            reverse("orders:detail", kwargs={"pk": order_id}),
        )
        self.assertEqual(detail_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cancellable_order_restores_stock_once(self):
        self.add_to_cart(quantity=2)
        self.authenticate()
        checkout_response = self.client.post(
            self.checkout_url,
            {"address_id": self.address.id},
            format="json",
        )
        order_id = checkout_response.data["id"]
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 3)

        cancel_response = self.client.post(
            reverse("orders:cancel", kwargs={"pk": order_id}),
            format="json",
        )

        self.assertEqual(cancel_response.status_code, status.HTTP_200_OK)
        self.assertEqual(cancel_response.data["status"], Order.Status.CANCELLED)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 5)

        duplicate_cancel_response = self.client.post(
            reverse("orders:cancel", kwargs={"pk": order_id}),
            format="json",
        )
        self.assertEqual(
            duplicate_cancel_response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 5)

    def test_shipped_order_cannot_be_cancelled(self):
        self.add_to_cart()
        self.authenticate()
        checkout_response = self.client.post(
            self.checkout_url,
            {"address_id": self.address.id},
            format="json",
        )
        order = Order.objects.get(pk=checkout_response.data["id"])
        order.status = Order.Status.SHIPPED
        order.save(update_fields=["status"])

        response = self.client.post(
            reverse("orders:cancel", kwargs={"pk": order.pk}),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_quantity, 4)

    def test_cancel_is_scoped_to_customer(self):
        self.add_to_cart()
        self.authenticate()
        checkout_response = self.client.post(
            self.checkout_url,
            {"address_id": self.address.id},
            format="json",
        )
        order_id = checkout_response.data["id"]
        self.authenticate(self.other_user)

        response = self.client.post(
            reverse("orders:cancel", kwargs={"pk": order_id}),
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class OrderModelTests(TestCase):
    def test_order_number_is_unique(self):
        user = User.objects.create_user(
            email="order-model@example.com",
            password="OrderModelPassword2026!",
        )
        values = {
            "order_number": "MST-DUPLICATE",
            "user": user,
            "shipping_recipient_name": "Recipient",
            "shipping_phone": "1234567890",
            "shipping_address_line1": "Address",
            "shipping_city": "City",
            "shipping_state": "State",
            "shipping_postal_code": "12345",
            "subtotal": Decimal("10.00"),
            "shipping_fee": Decimal("0.00"),
            "total_amount": Decimal("10.00"),
        }
        Order.objects.create(**values)

        from django.db import IntegrityError, transaction

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Order.objects.create(**values)
