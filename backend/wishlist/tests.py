from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from catalogue.models import Category, Product

from .models import Wishlist, WishlistItem

User = get_user_model()


class WishlistModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="wishlist-model@example.com",
            password="WishlistModelPassword2026!",
        )
        self.category = Category.objects.create(
            name="Wishlist Model Category",
            slug="wishlist-model-category",
        )
        self.product = Product.objects.create(
            category=self.category,
            name="Wishlist Model Perfume",
            slug="wishlist-model-perfume",
        )

    def test_wishlist_can_be_created_for_a_user(self):
        wishlist = Wishlist.objects.create(user=self.user)

        self.assertEqual(self.user.wishlist, wishlist)

    def test_user_can_have_only_one_wishlist(self):
        Wishlist.objects.create(user=self.user)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Wishlist.objects.create(user=self.user)

    def test_duplicate_product_in_wishlist_is_rejected(self):
        wishlist = Wishlist.objects.create(user=self.user)
        WishlistItem.objects.create(wishlist=wishlist, product=self.product)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                WishlistItem.objects.create(
                    wishlist=wishlist,
                    product=self.product,
                )

    def test_deleting_wishlist_deletes_items(self):
        wishlist = Wishlist.objects.create(user=self.user)
        item = WishlistItem.objects.create(
            wishlist=wishlist,
            product=self.product,
        )

        wishlist.delete()

        self.assertFalse(WishlistItem.objects.filter(pk=item.pk).exists())

    def test_deleting_referenced_product_is_protected(self):
        wishlist = Wishlist.objects.create(user=self.user)
        WishlistItem.objects.create(wishlist=wishlist, product=self.product)

        with self.assertRaises(IntegrityError):
            self.product.delete()


class WishlistAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="wishlist-api@example.com",
            password="WishlistAPIPassword2026!",
        )
        self.other_user = User.objects.create_user(
            email="wishlist-other@example.com",
            password="WishlistOtherPassword2026!",
        )
        self.category = Category.objects.create(
            name="Wishlist API Category",
            slug="wishlist-api-category",
        )
        self.product = Product.objects.create(
            category=self.category,
            name="Wishlist API Perfume",
            slug="wishlist-api-perfume",
        )
        self.inactive_product = Product.objects.create(
            category=self.category,
            name="Inactive Wishlist Perfume",
            slug="inactive-wishlist-perfume",
            is_active=False,
        )
        self.detail_url = reverse("wishlist:detail")
        self.items_url = reverse("wishlist:item-create")
        self.clear_url = reverse("wishlist:clear")

    def authenticate(self, user=None):
        refresh = RefreshToken.for_user(user or self.user)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}",
        )

    def test_unauthenticated_access_is_rejected(self):
        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_retrieval_creates_empty_wishlist(self):
        self.authenticate()

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data["id"])
        self.assertEqual(response.data["items"], [])
        self.assertTrue(Wishlist.objects.filter(user=self.user).exists())

    def test_active_product_can_be_added(self):
        self.authenticate()

        response = self.client.post(
            self.items_url,
            {"product_id": self.product.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["items"]), 1)
        self.assertEqual(
            response.data["items"][0]["product"]["id"],
            self.product.id,
        )

    def test_invalid_product_is_rejected(self):
        self.authenticate()

        response = self.client.post(
            self.items_url,
            {"product_id": 999999},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_inactive_product_is_rejected(self):
        self.authenticate()

        response = self.client.post(
            self.items_url,
            {"product_id": self.inactive_product.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("product_id", response.data)

    def test_duplicate_product_does_not_create_another_item(self):
        self.authenticate()
        payload = {"product_id": self.product.id}

        self.client.post(self.items_url, payload, format="json")
        response = self.client.post(self.items_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(WishlistItem.objects.filter(wishlist__user=self.user).count(), 1)
        self.assertEqual(len(response.data["items"]), 1)

    def test_item_can_be_removed(self):
        self.authenticate()
        self.client.post(
            self.items_url,
            {"product_id": self.product.id},
            format="json",
        )
        item = WishlistItem.objects.get(wishlist__user=self.user)

        response = self.client.delete(
            reverse("wishlist:item-detail", kwargs={"pk": item.pk}),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"], [])
        self.assertFalse(WishlistItem.objects.filter(pk=item.pk).exists())

    def test_wishlist_can_be_cleared(self):
        self.authenticate()
        self.client.post(
            self.items_url,
            {"product_id": self.product.id},
            format="json",
        )
        wishlist_id = Wishlist.objects.get(user=self.user).id

        response = self.client.delete(self.clear_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"], [])
        self.assertTrue(Wishlist.objects.filter(pk=wishlist_id).exists())

    def test_item_from_another_user_returns_not_found(self):
        self.authenticate(self.other_user)
        other_wishlist = Wishlist.objects.create(user=self.other_user)
        item = WishlistItem.objects.create(
            wishlist=other_wishlist,
            product=self.product,
        )
        self.authenticate(self.user)

        response = self.client.delete(
            reverse("wishlist:item-detail", kwargs={"pk": item.pk}),
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(WishlistItem.objects.filter(pk=item.pk).exists())

    def test_inactive_saved_product_is_hidden_from_retrieval(self):
        self.authenticate()
        wishlist = Wishlist.objects.create(user=self.user)
        item = WishlistItem.objects.create(
            wishlist=wishlist,
            product=self.inactive_product,
        )

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"], [])
        self.assertTrue(WishlistItem.objects.filter(pk=item.pk).exists())
