from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Address(models.Model):
    """
    Customer delivery address model for luxury perfume orders.
    Each customer can store multiple addresses with at most one default address.
    Default-address uniqueness is enforced via application logic and row-level
    locking on the User record (transaction.atomic + select_for_update) to maintain
    full compatibility with MySQL without partial unique index restrictions.
    """

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="addresses",
        help_text=_("The customer who owns this delivery address."),
    )
    recipient_name = models.CharField(
        _("recipient name"),
        max_length=150,
        help_text=_("Full name of the recipient for delivery."),
    )
    phone_number = models.CharField(
        _("phone number"),
        max_length=25,
        help_text=_("Contact phone number for delivery coordination."),
    )
    address_line1 = models.CharField(
        _("address line 1"),
        max_length=255,
        help_text=_("House/flat number, building name, street."),
    )
    address_line2 = models.CharField(
        _("address line 2"),
        max_length=255,
        blank=True,
        default="",
        help_text=_("Apartment, suite, unit, floor (optional)."),
    )
    landmark = models.CharField(
        _("landmark"),
        max_length=255,
        blank=True,
        default="",
        help_text=_("Nearby landmark to aid delivery (optional)."),
    )
    city = models.CharField(_("city"), max_length=100)
    state = models.CharField(_("state"), max_length=100)
    postal_code = models.CharField(_("postal code"), max_length=20)
    country = models.CharField(_("country"), max_length=100, default="India")
    is_default = models.BooleanField(
        _("is default"),
        default=False,
        help_text=_("Designates whether this address is the customer's primary delivery address."),
    )
    created_at = models.DateTimeField(_("created at"), auto_now_add=True)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)

    class Meta:
        verbose_name = _("address")
        verbose_name_plural = _("addresses")
        ordering = ["-is_default", "-updated_at"]
        indexes = [
            models.Index(fields=["user", "is_default"], name="idx_address_user_default"),
            models.Index(fields=["user", "-updated_at"], name="idx_address_user_updated"),
        ]

    def __str__(self):
        return f"{self.recipient_name} - {self.address_line1}, {self.city} ({self.postal_code})"
