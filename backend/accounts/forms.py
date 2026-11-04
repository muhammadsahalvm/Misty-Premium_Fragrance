from django import forms
from django.contrib.auth.forms import BaseUserCreationForm, UserChangeForm as BaseUserChangeForm
from django.utils.translation import gettext_lazy as _

from .models import User


class UserAdminCreationForm(BaseUserCreationForm):
    """
    A form for creating new users in Django Admin.
    Includes email, personal details, staff status, and password confirmation.
    Automatically hashes the password using Django's password management.
    """

    class Meta:
        model = User
        fields = (
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "is_staff",
            "is_active",
        )

    def clean_email(self):
        email = self.cleaned_data.get("email")
        if email:
            email = email.strip().lower()
            if User.objects.filter(email__iexact=email).exists():
                raise forms.ValidationError(_("A user with this email address already exists."))
        return email


class UserAdminChangeForm(BaseUserChangeForm):
    """
    A form for updating existing users in Django Admin.
    Uses Django's ReadOnlyPasswordHashField for the password field.
    """

    class Meta:
        model = User
        fields = "__all__"

