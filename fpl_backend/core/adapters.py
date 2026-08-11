from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)

        extra_data = sociallogin.account.extra_data

        # Set email from Google if not already set
        if not user.email:
            user.email = extra_data.get('email', '') or data.get('email', '')

        # Set name from Google
        if not user.name:
            user.name = extra_data.get('name', '') or extra_data.get(
                'given_name', '') or data.get('name', '')

        # Set a random password (user won't use it, they login via Google)
        user.password = make_password(uuid.uuid4().hex)

        # Google already verified this email
        user.is_verified = True

        return user

    def is_auto_signup_allowed(self, request, sociallogin):
        return True

    def pre_social_login(self, request, sociallogin):
        # Call super first for default behavior
        super().pre_social_login(request, sociallogin)

        # If already connected, nothing to do
        if sociallogin.is_existing:
            return

        # Try to connect to existing user with same email
        email = sociallogin.user.email
        if not email:
            return

        try:
            existing_user = User.objects.get(email=email)
            # Connect this Google account to the existing user
            sociallogin.connect(request, existing_user)
            # Ensure existing user is verified
            if not existing_user.is_verified:
                existing_user.is_verified = True
                existing_user.save(update_fields=['is_verified'])
        except User.DoesNotExist:
            # No existing user — allauth will create a new one
            pass
        except Exception as e:
            # If connection fails for any reason, log it but don't crash
            print(f"Social login connection failed: {e}")
            pass

    def save_user(self, request, sociallogin, form=None):
        # Just use default allauth behavior — populate_user already set the fields
        user = super().save_user(request, sociallogin, form)

        # Double-check verification
        if not user.is_verified:
            user.is_verified = True
            user.save(update_fields=['is_verified'])

        return user
