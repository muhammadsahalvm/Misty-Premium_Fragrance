from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .forms import UserAdminChangeForm, UserAdminCreationForm
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Admin configuration for the custom User model.
    """

    form = UserAdminChangeForm
    add_form = UserAdminCreationForm

    list_display = (
        "email",
        "first_name",
        "last_name",
        "is_staff",
        "is_active",
        "date_joined",
    )
    list_filter = ("is_staff", "is_active", "is_superuser")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            _("Personal Info"),
            {"fields": ("first_name", "last_name", "phone_number")},
        ),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "first_name",
                    "last_name",
                    "phone_number",
                    "is_staff",
                    "is_active",
                ),
            },
        ),
    )
    search_fields = ("email", "first_name", "last_name", "phone_number")
    ordering = ("-date_joined",)
