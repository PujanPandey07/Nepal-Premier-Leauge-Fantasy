from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Auto-completes signup for social (Google) logins by pulling
    name/email straight from the provider's data, and setting an
    unusable random password since social users authenticate via
    Google, not a local password.
    """

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)

        extra_data = sociallogin.account.extra_data
        if not getattr(user, 'email', None):
            user.email = extra_data.get('email', '') or data.get('email', '')
        if not getattr(user, 'name', None):
            user.name = extra_data.get('name', '') or data.get('name', '')

        user.password = make_password(uuid.uuid4().hex)
        return user

    def is_auto_signup_allowed(self, request, sociallogin):
        return True

    # NEW: Prevent duplicate accounts when email already exists
    def pre_social_login(self, request, sociallogin):
        """
        If a user with this email already exists, connect the social
        account to that user instead of creating a new one.
        """
        user = sociallogin.user
        if user.email:
            try:
                existing_user = User.objects.get(email=user.email)
                if not sociallogin.is_existing:
                    sociallogin.connect(request, existing_user)
            except User.DoesNotExist:
                pass

    def save_user(self, request, sociallogin, form=None):
        """
        If a user with this email already exists, return the existing
        user and connect the social account to it.
        """
        user = sociallogin.user
        if user.email:
            try:
                existing = User.objects.get(email=user.email)
                if not sociallogin.is_existing:
                    sociallogin.connect(request, existing)
                return existing
            except User.DoesNotExist:
                pass
        return super().save_user(request, sociallogin, form)
