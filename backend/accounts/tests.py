from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.forms import UserAdminCreationForm

User = get_user_model()


class AccountsAPITests(APITestCase):
    """
    Automated test suite for Misty customer registration, JWT authentication,
    token refresh, profile retrieval endpoints, and administrative user creation.
    """

    def setUp(self):
        self.register_url = reverse("accounts:register")
        self.login_url = reverse("accounts:login")
        self.refresh_url = reverse("accounts:token_refresh")
        self.me_url = reverse("accounts:me")

        self.valid_user_data = {
            "email": "customer@mistyperfumes.com",
            "password": "MistyLuxuryPassword2026!",
            "password_confirm": "MistyLuxuryPassword2026!",
            "first_name": "Aria",
            "last_name": "Vance",
            "phone_number": "+1234567890",
        }

        # Pre-created active user for login/me tests
        self.existing_password = "ExistingPerfumePass2026!"
        self.existing_user = User.objects.create_user(
            email="existing@mistyperfumes.com",
            password=self.existing_password,
            first_name="Elena",
            last_name="Rostova",
            phone_number="+9876543210",
        )

        # Pre-created inactive user
        self.inactive_password = "InactivePerfumePass2026!"
        self.inactive_user = User.objects.create_user(
            email="inactive@mistyperfumes.com",
            password=self.inactive_password,
            first_name="Inactive",
            last_name="User",
            is_active=False,
        )

    def test_successful_customer_registration(self):
        """Test that a new customer can successfully register with valid details."""
        response = self.client.post(self.register_url, self.valid_user_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)
        self.assertEqual(response.data["email"], self.valid_user_data["email"].lower())
        self.assertEqual(response.data["first_name"], self.valid_user_data["first_name"])
        self.assertEqual(response.data["last_name"], self.valid_user_data["last_name"])
        self.assertEqual(response.data["phone_number"], self.valid_user_data["phone_number"])
        self.assertIn("date_joined", response.data)

        # Ensure credentials/hashes are never exposed in response
        self.assertNotIn("password", response.data)
        self.assertNotIn("password_confirm", response.data)

        # Verify database record
        created_user = User.objects.get(email=self.valid_user_data["email"].lower())
        self.assertEqual(created_user.first_name, "Aria")
        self.assertTrue(created_user.is_active)
        self.assertFalse(created_user.is_staff)
        self.assertFalse(created_user.is_superuser)

    def test_duplicate_email_rejection(self):
        """Test that attempting to register with an existing email (case-insensitive) fails."""
        data = self.valid_user_data.copy()
        data["email"] = "EXISTING@mistyperfumes.com"

        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_invalid_email_rejection(self):
        """Test that registration rejects malformed email addresses."""
        data = self.valid_user_data.copy()
        data["email"] = "not-an-email"

        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_omitted_password_confirm_rejection(self):
        """Test that registration rejects requests where password_confirm is omitted."""
        data = self.valid_user_data.copy()
        data.pop("password_confirm")

        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirm", response.data)

    def test_password_mismatch_rejection(self):
        """Test that registration rejects mismatched password and password_confirm."""
        data = self.valid_user_data.copy()
        data["password_confirm"] = "DifferentPassword2026!"

        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirm", response.data)

    def test_password_is_stored_hashed_not_plain_text(self):
        """Test that passwords are encrypted with Django's password hasher and not plain text."""
        raw_password = self.valid_user_data["password"]
        response = self.client.post(self.register_url, self.valid_user_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email=self.valid_user_data["email"].lower())
        self.assertNotEqual(user.password, raw_password)
        self.assertTrue(user.check_password(raw_password))

    def test_new_customer_cannot_register_with_administrative_privileges(self):
        """Test that submitting administrative flags during registration does not grant staff/superuser."""
        malicious_data = self.valid_user_data.copy()
        malicious_data["email"] = "hacker@mistyperfumes.com"
        malicious_data["is_staff"] = True
        malicious_data["is_superuser"] = True

        response = self.client.post(self.register_url, malicious_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email="hacker@mistyperfumes.com")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_successful_login_returns_tokens(self):
        """Test that logging in with valid email and password returns JWT access and refresh tokens."""
        login_data = {
            "email": "existing@mistyperfumes.com",
            "password": self.existing_password,
        }
        response = self.client.post(self.login_url, login_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertNotIn("password", response.data)

    def test_invalid_login_credentials_are_rejected(self):
        """Test that incorrect password or non-existent email receives HTTP 401."""
        login_data = {
            "email": "existing@mistyperfumes.com",
            "password": "WrongPassword123!",
        }
        response = self.client.post(self.login_url, login_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_inactive_user_cannot_login(self):
        """Test that an inactive customer account is denied login."""
        login_data = {
            "email": "inactive@mistyperfumes.com",
            "password": self.inactive_password,
        }
        response = self.client.post(self.login_url, login_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_retrieve_me_profile(self):
        """Test that an authenticated user with a valid JWT Bearer token can fetch their /me profile."""
        login_response = self.client.post(
            self.login_url,
            {"email": "existing@mistyperfumes.com", "password": self.existing_password},
            format="json",
        )
        access_token = login_response.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.get(self.me_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.existing_user.id)
        self.assertEqual(response.data["email"], self.existing_user.email)
        self.assertEqual(response.data["first_name"], self.existing_user.first_name)
        self.assertEqual(response.data["last_name"], self.existing_user.last_name)
        self.assertEqual(response.data["phone_number"], self.existing_user.phone_number)
        self.assertIn("date_joined", response.data)

        # Critical security assertions: sensitive data must never be returned
        self.assertNotIn("password", response.data)
        self.assertNotIn("is_superuser", response.data)
        self.assertNotIn("is_staff", response.data)

    def test_unauthenticated_user_cannot_retrieve_me(self):
        """Test that accessing /api/accounts/me/ without authentication receives HTTP 401."""
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh_works(self):
        """Test that exchanging a valid refresh token yields a new valid access token."""
        login_response = self.client.post(
            self.login_url,
            {"email": "existing@mistyperfumes.com", "password": self.existing_password},
            format="json",
        )
        refresh_token = login_response.data["refresh"]

        refresh_response = self.client.post(
            self.refresh_url, {"refresh": refresh_token}, format="json"
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_response.data)

        # Validate that the new access token can be used to query /me/
        new_access_token = refresh_response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {new_access_token}")
        me_response = self.client.get(self.me_url)
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)

    def test_admin_user_creation_form_compatibility_and_hashing(self):
        """Test that UserAdminCreationForm successfully creates user and hashes the password."""
        form_data = {
            "email": "admincreated@mistyperfumes.com",
            "password1": "AdminSecretPass2026!",
            "password2": "AdminSecretPass2026!",
            "first_name": "Admin",
            "last_name": "Created",
            "phone_number": "+1122334455",
            "is_staff": True,
            "is_active": True,
        }
        form = UserAdminCreationForm(data=form_data)
        self.assertTrue(form.is_valid(), msg=form.errors.as_text())
        admin_user = form.save()
        self.assertNotEqual(admin_user.password, "AdminSecretPass2026!")
        self.assertTrue(admin_user.check_password("AdminSecretPass2026!"))
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_active)
