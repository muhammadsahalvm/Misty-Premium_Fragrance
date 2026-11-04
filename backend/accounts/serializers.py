from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions as django_exceptions
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for returning safe public/profile details of a user.
    Never exposes passwords, password hashes, or administrative flags.
    """

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "date_joined",
        )
        read_only_fields = fields


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for customer registration.
    Enforces password confirmation, strength validation, and strips administrative attributes.
    """

    password = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "phone_number",
        )
        extra_kwargs = {
            "email": {"required": True},
            "first_name": {"required": False, "allow_blank": True},
            "last_name": {"required": False, "allow_blank": True},
            "phone_number": {"required": False, "allow_null": True, "allow_blank": True},
        }

    def validate_email(self, value):
        normalized_email = value.lower().strip()
        if User.objects.filter(email__iexact=normalized_email).exists():
            raise serializers.ValidationError("A user with this email address already exists.")
        return normalized_email

    def validate(self, attrs):
        password = attrs.get("password")
        password_confirm = attrs.get("password_confirm")

        if not password_confirm:
            raise serializers.ValidationError(
                {"password_confirm": "Password confirmation is required."}
            )

        if password != password_confirm:
            raise serializers.ValidationError(
                {"password_confirm": "Password confirmation does not match password."}
            )

        # Apply Django's configured password validators
        temp_user = User(
            email=attrs.get("email", ""),
            first_name=attrs.get("first_name", ""),
            last_name=attrs.get("last_name", ""),
        )
        try:
            validate_password(password, user=temp_user)
        except django_exceptions.ValidationError as err:
            raise serializers.ValidationError({"password": list(err.messages)})

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm", None)
        password = validated_data.pop("password")

        # Explicitly ensure customer cannot assign administrative permissions
        validated_data.pop("is_staff", None)
        validated_data.pop("is_superuser", None)

        user = User.objects.create_user(
            password=password,
            is_staff=False,
            is_superuser=False,
            is_active=True,
            **validated_data
        )
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for customer profile updates (PATCH/PUT /api/accounts/me/).
    email, id, and date_joined are read-only.
    Administrative fields (is_staff, is_superuser, is_active) are excluded entirely.
    """

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "phone_number", "date_joined")
        read_only_fields = ("id", "email", "date_joined")


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom Simple JWT TokenObtainPairSerializer ensuring email normalization
    and strict authentication via email and password.
    """

    username_field = User.USERNAME_FIELD

    def validate(self, attrs):
        email_val = attrs.get(self.username_field)
        if email_val and isinstance(email_val, str):
            attrs[self.username_field] = email_val.strip().lower()
        return super().validate(attrs)
