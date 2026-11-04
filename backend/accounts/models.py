from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for Misty luxury perfume e-commerce.
    Uses email as the unique identifier for authentication.
    """

    id = models.BigAutoField(primary_key=True)
    email = models.EmailField(
        _("email address"),
        unique=True,
        max_length=255,
        help_text=_("Required. Unique email address used for login."),
    )
    first_name = models.CharField(_("first name"), max_length=150, blank=True)
    last_name = models.CharField(_("last name"), max_length=150, blank=True)
    phone_number = models.CharField(
        _("phone number"),
        max_length=20,
        blank=True,
        null=True,
        help_text=_("Optional contact phone number."),
    )
    is_active = models.BooleanField(
        _("active"),
        default=True,
        help_text=_("Designates whether this user account should be treated as active."),
    )
    is_staff = models.BooleanField(
        _("staff status"),
        default=False,
        help_text=_("Designates whether the user can log into this admin site."),
    )
    date_joined = models.DateTimeField(
        _("date joined"),
        default=timezone.now,
        help_text=_("Timestamp of when the user account was created."),
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        ordering = ["-date_joined"]

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else self.email

    def get_full_name(self):
        return self.full_name

    def get_short_name(self):
        return self.first_name if self.first_name else self.email
