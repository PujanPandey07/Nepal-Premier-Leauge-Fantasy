from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth.hashers import make_password
import uuid


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Auto-completes signup for social (Google) logins by pulling
    name/email straight from the provider's data, and setting an
    unusable random password since social users authenticate via
    Google, not a local password.
    """

    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)

        # Google's extra profile data includes 'name' directly
        extra_data = sociallogin.account.extra_data
        if not getattr(user, 'email', None):
            user.email = extra_data.get('email', '') or data.get('email', '')
        if not getattr(user, 'name', None):
            user.name = extra_data.get('name', '') or data.get('name', '')

        # Social users don't need a real password — set a random
        # unusable one so ACCOUNT_SIGNUP_FIELDS' password requirement
        # is satisfied without prompting the user for one
        user.password = make_password(uuid.uuid4().hex)

        return user

    def is_auto_signup_allowed(self, request, sociallogin):
        print("=== is_auto_signup_allowed CALLED ===", flush=True)
        return True
