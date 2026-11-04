import re

from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import Address

User = get_user_model()

# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

PHONE_DIGIT_RE = re.compile(r'\d')

def validate_phone_number(value):
    """
    Accepts international phone number formats.
    Requires between 7 and 20 digits (after stripping non-digit characters).
    Allows leading +, spaces, dashes, and parentheses.
    """
    digits = PHONE_DIGIT_RE.findall(value)
    if len(digits) < 7:
        raise serializers.ValidationError(
            _("Phone number must contain at least 7 digits.")
        )
    if len(digits) > 20:
        raise serializers.ValidationError(
            _("Phone number must not exceed 20 digits.")
        )
    allowed_chars = re.compile(r'^[+\d\s\-().]+$')
    if not allowed_chars.match(value):
        raise serializers.ValidationError(
            _("Phone number may only contain digits, spaces, +, -, (, and ).")
        )
    return value.strip()


def validate_postal_code(value):
    """
    Flexible postal code validation supporting international formats.
    Accepts 3-20 characters of alphanumeric, space, and hyphen.
    """
    value = value.strip()
    if len(value) < 3 or len(value) > 20:
        raise serializers.ValidationError(
            _("Postal code must be between 3 and 20 characters.")
        )
    if not re.match(r'^[A-Za-z0-9][A-Za-z0-9\s\-]{1,18}[A-Za-z0-9]$', value):
        raise serializers.ValidationError(
            _("Postal code may only contain letters, digits, spaces, and hyphens.")
        )
    return value


# ---------------------------------------------------------------------------
# Address Serializer
# ---------------------------------------------------------------------------

class AddressSerializer(serializers.ModelSerializer):
    """
    Serializer for customer delivery addresses.
    `user` is always derived from `request.user`; never writable from client.
    """

    class Meta:
        model = Address
        fields = (
            "id",
            "recipient_name",
            "phone_number",
            "address_line1",
            "address_line2",
            "landmark",
            "city",
            "state",
            "postal_code",
            "country",
            "is_default",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_recipient_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError(
                _("Recipient name must be at least 2 characters.")
            )
        return value

    def validate_phone_number(self, value):
        return validate_phone_number(value)

    def validate_postal_code(self, value):
        return validate_postal_code(value)

    def validate_address_line1(self, value):
        return value.strip()

    def validate_city(self, value):
        return value.strip()

    def validate_state(self, value):
        return value.strip()

    def validate_country(self, value):
        return value.strip()

