from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)

        extra_data = sociallogin.account.extra_data
        if not getattr(user, 'email', None):
            user.email = extra_data.get('email', '') or data.get('email', '')
        if not getattr(user, 'name', None):
            user.name = extra_data.get('name', '') or data.get('name', '')

        user.password = make_password(uuid.uuid4().hex)

        # Google already verified this email — mark as verified
        user.is_verified = True

        return user

    def is_auto_signup_allowed(self, request, sociallogin):
        return True

    def pre_social_login(self, request, sociallogin):
        user = sociallogin.user
        if user.email:
            try:
                existing_user = User.objects.get(email=user.email)
                if not sociallogin.is_existing:
                    sociallogin.connect(request, existing_user)
            except User.DoesNotExist:
                pass

    def save_user(self, request, sociallogin, form=None):
        user = sociallogin.user
        if user.email:
            try:
                existing = User.objects.get(email=user.email)
                if not sociallogin.is_existing:
                    sociallogin.connect(request, existing)
                # Ensure existing users are also marked verified
                if not existing.is_verified:
                    existing.is_verified = True
                    existing.save(update_fields=['is_verified'])
                return existing
            except User.DoesNotExist:
                pass
        return super().save_user(request, sociallogin, form)
