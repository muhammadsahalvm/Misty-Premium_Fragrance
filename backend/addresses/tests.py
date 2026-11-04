"""
Tests for Phase 3C: Customer Profile & Address Management APIs.

Covers:
- Profile retrieve (GET /api/accounts/me/)
- Profile update (PATCH/PUT /api/accounts/me/)
- Address CRUD (GET/POST/PUT/PATCH/DELETE /api/addresses/)
- Set-default action (POST /api/addresses/<id>/set-default/)
- Default address business rules
- Ownership security (cross-customer isolation, 404 on others' addresses)
- Field injection prevention (user, is_staff)
- Input validation (phone, postal code, required fields)
- Unauthenticated rejection (401)
"""

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Address

User = get_user_model()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_user(email, password="TestPass123!", **kwargs):
    """Create a regular (non-staff) customer."""
    return User.objects.create_user(
        email=email,
        password=password,
        first_name=kwargs.get("first_name", "Test"),
        last_name=kwargs.get("last_name", "User"),
        phone_number=kwargs.get("phone_number", ""),
        is_staff=False,
        is_superuser=False,
        is_active=True,
    )


def auth_client(client, user):
    """Attach a valid JWT access token to the test client."""
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


VALID_ADDRESS = {
    "recipient_name": "Test Recipient",
    "phone_number": "+91 9876543210",
    "address_line1": "123 Main Street",
    "address_line2": "",
    "landmark": "",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "country": "India",
    "is_default": False,
}


def make_address(user, **overrides):
    """Create an Address instance directly in the database."""
    data = {
        "user": user,
        "recipient_name": "Test Recipient",
        "phone_number": "+91 9876543210",
        "address_line1": "123 Main Street",
        "address_line2": "",
        "landmark": "",
        "city": "Mumbai",
        "state": "Maharashtra",
        "postal_code": "400001",
        "country": "India",
        "is_default": False,
    }
    data.update(overrides)
    return Address.objects.create(**data)


# ===========================================================================
# Profile Tests
# ===========================================================================

class ProfileRetrieveTest(APITestCase):
    """GET /api/accounts/me/ — authenticated profile retrieval."""

    def setUp(self):
        self.user = make_user("profile@example.com", first_name="Alice", last_name="Smith")
        auth_client(self.client, self.user)
        self.url = reverse("accounts:me")

    def test_profile_retrieve_authenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["email"], "profile@example.com")
        self.assertEqual(data["first_name"], "Alice")
        self.assertEqual(data["last_name"], "Smith")
        self.assertIn("id", data)
        self.assertIn("date_joined", data)
        # Administrative fields must never appear
        self.assertNotIn("is_staff", data)
        self.assertNotIn("is_superuser", data)
        self.assertNotIn("password", data)

    def test_profile_unauthenticated_rejected(self):
        self.client.credentials()  # strip auth
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProfileUpdateTest(APITestCase):
    """PATCH/PUT /api/accounts/me/ — editable fields only."""

    def setUp(self):
        self.user = make_user(
            "update@example.com",
            first_name="Bob",
            last_name="Jones",
            phone_number="1234567",
        )
        auth_client(self.client, self.user)
        self.url = reverse("accounts:me")

    def test_profile_patch_updates_name(self):
        response = self.client.patch(self.url, {"first_name": "Robert"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Robert")
        self.assertEqual(self.user.last_name, "Jones")  # unchanged

    def test_profile_patch_updates_phone(self):
        response = self.client.patch(self.url, {"phone_number": "9999999999"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.phone_number, "9999999999")

    def test_profile_put_updates_fields(self):
        payload = {
            "first_name": "Bobby",
            "last_name": "Johnson",
            "phone_number": "7777777",
        }
        response = self.client.put(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Bobby")
        self.assertEqual(self.user.last_name, "Johnson")

    def test_profile_email_cannot_be_changed(self):
        """Submitting a new email via PATCH must leave email unchanged."""
        response = self.client.patch(
            self.url, {"email": "hacked@evil.com"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "update@example.com")

    def test_profile_admin_flags_cannot_be_modified(self):
        """Submitting is_staff=True must not elevate the customer."""
        response = self.client.patch(
            self.url, {"is_staff": True, "is_superuser": True}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.is_staff)
        self.assertFalse(self.user.is_superuser)

    def test_profile_patch_unauthenticated_rejected(self):
        self.client.credentials()
        response = self.client.patch(self.url, {"first_name": "X"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ===========================================================================
# Address Tests
# ===========================================================================

class AddressCreateTest(APITestCase):
    """POST /api/addresses/ — creation and default-address rules."""

    def setUp(self):
        self.user = make_user("addr_create@example.com")
        auth_client(self.client, self.user)
        self.url = reverse("addresses:list_create")

    def test_create_address_first_becomes_default(self):
        payload = {**VALID_ADDRESS, "is_default": False}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertTrue(data["is_default"], "First address must automatically become default.")

    def test_create_second_address_non_default(self):
        make_address(self.user, is_default=True)
        payload = {**VALID_ADDRESS, "is_default": False}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Exactly one default must exist
        defaults = Address.objects.filter(user=self.user, is_default=True)
        self.assertEqual(defaults.count(), 1)
        self.assertFalse(response.json()["is_default"])

    def test_create_address_with_is_default_true_switches_previous(self):
        first = make_address(self.user, is_default=True)
        payload = {**VALID_ADDRESS, "is_default": True}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.json()["is_default"])
        first.refresh_from_db()
        self.assertFalse(first.is_default, "Previous default must be cleared.")
        self.assertEqual(
            Address.objects.filter(user=self.user, is_default=True).count(), 1
        )

    def test_create_cannot_inject_different_user(self):
        """Frontend supplying another user's pk as 'user' must be ignored."""
        other = make_user("other_inject@example.com")
        payload = {**VALID_ADDRESS, "user": other.pk}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        addr = Address.objects.get(pk=response.json()["id"])
        self.assertEqual(addr.user_id, self.user.pk)

    def test_unauthenticated_create_rejected(self):
        self.client.credentials()
        response = self.client.post(self.url, VALID_ADDRESS, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_phone_number_rejected(self):
        payload = {**VALID_ADDRESS, "phone_number": "abc"}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("phone_number", response.json())

    def test_invalid_postal_code_rejected(self):
        payload = {**VALID_ADDRESS, "postal_code": "!!"}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("postal_code", response.json())

    def test_missing_required_field_rejected(self):
        payload = {k: v for k, v in VALID_ADDRESS.items() if k != "city"}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("city", response.json())


class AddressListTest(APITestCase):
    """GET /api/addresses/ — list isolation."""

    def setUp(self):
        self.user = make_user("list_user@example.com")
        self.other = make_user("list_other@example.com")
        auth_client(self.client, self.user)
        self.url = reverse("addresses:list_create")

    def test_list_returns_only_own_addresses(self):
        make_address(self.user, is_default=True)
        make_address(self.user)
        make_address(self.other, is_default=True)  # belongs to other customer
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [a["id"] for a in response.json()]
        own_ids = list(Address.objects.filter(user=self.user).values_list("id", flat=True))
        for aid in ids:
            self.assertIn(aid, own_ids)
        self.assertEqual(len(ids), 2)

    def test_unauthenticated_list_rejected(self):
        self.client.credentials()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AddressDetailTest(APITestCase):
    """GET/PUT/PATCH /api/addresses/<id>/ — retrieval and update."""

    def setUp(self):
        self.user = make_user("detail_user@example.com")
        self.other = make_user("detail_other@example.com")
        auth_client(self.client, self.user)
        self.addr = make_address(self.user, is_default=True)
        self.url = reverse("addresses:detail", kwargs={"pk": self.addr.pk})

    def test_retrieve_own_address(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["id"], self.addr.pk)

    def test_patch_updates_address(self):
        response = self.client.patch(self.url, {"city": "Delhi"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.addr.refresh_from_db()
        self.assertEqual(self.addr.city, "Delhi")

    def test_put_replaces_address(self):
        payload = {
            **VALID_ADDRESS,
            "city": "Pune",
            "is_default": True,
        }
        response = self.client.put(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.addr.refresh_from_db()
        self.assertEqual(self.addr.city, "Pune")

    def test_cannot_access_other_customers_address(self):
        other_addr = make_address(self.other, is_default=True)
        url = reverse("addresses:detail", kwargs={"pk": other_addr.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_update_other_customers_address(self):
        other_addr = make_address(self.other, is_default=True)
        url = reverse("addresses:detail", kwargs={"pk": other_addr.pk})
        response = self.client.patch(url, {"city": "Hacked"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_delete_other_customers_address(self):
        other_addr = make_address(self.other, is_default=True)
        url = reverse("addresses:detail", kwargs={"pk": other_addr.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class AddressDeleteTest(APITestCase):
    """DELETE /api/addresses/<id>/ — deletion and default-promotion rules."""

    def setUp(self):
        self.user = make_user("delete_user@example.com")
        auth_client(self.client, self.user)

    def test_delete_non_default_address(self):
        default_addr = make_address(self.user, is_default=True)
        non_default = make_address(self.user, is_default=False)
        url = reverse("addresses:detail", kwargs={"pk": non_default.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Address.objects.filter(pk=non_default.pk).exists())
        default_addr.refresh_from_db()
        self.assertTrue(default_addr.is_default, "Existing default must be unchanged.")

    def test_delete_default_address_promotes_next(self):
        default_addr = make_address(self.user, is_default=True)
        next_addr = make_address(self.user, is_default=False)
        url = reverse("addresses:detail", kwargs={"pk": default_addr.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        next_addr.refresh_from_db()
        self.assertTrue(next_addr.is_default, "Remaining address must be promoted to default.")
        self.assertEqual(
            Address.objects.filter(user=self.user, is_default=True).count(), 1
        )

    def test_delete_last_address_leaves_no_default(self):
        addr = make_address(self.user, is_default=True)
        url = reverse("addresses:detail", kwargs={"pk": addr.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Address.objects.filter(user=self.user).count(), 0)


class AddressSetDefaultTest(APITestCase):
    """POST /api/addresses/<id>/set-default/"""

    def setUp(self):
        self.user = make_user("setdefault_user@example.com")
        self.other = make_user("setdefault_other@example.com")
        auth_client(self.client, self.user)

    def test_set_default_switches_default(self):
        addr1 = make_address(self.user, is_default=True)
        addr2 = make_address(self.user, is_default=False)
        url = reverse("addresses:set_default", kwargs={"pk": addr2.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        addr1.refresh_from_db()
        addr2.refresh_from_db()
        self.assertFalse(addr1.is_default, "Previous default must be cleared.")
        self.assertTrue(addr2.is_default, "Target address must become default.")
        self.assertEqual(
            Address.objects.filter(user=self.user, is_default=True).count(), 1
        )

    def test_cannot_set_default_other_customers_address(self):
        other_addr = make_address(self.other, is_default=True)
        url = reverse("addresses:set_default", kwargs={"pk": other_addr.pk})
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
