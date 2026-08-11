from core.views import (
    CustomTokenObtainPairView, GoogleLoginCompleteView,
    CookieTokenRefreshView, LogoutView, health_check, verify_email_view
)
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('api/token/', CustomTokenObtainPairView.as_view(),
         name='token_obtain_pair'),
    path('api/token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
    path('api/auth/verify-email/<str:key>/',
         verify_email_view, name='verify_email'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'),
         name='swagger-ui'),
    # includes register, me, payments, router
    path('api/', include('core.urls')),
    path("accounts/", include("allauth.urls")),
    path('health/', health_check, name='health'),
    path('api/auth/complete/', GoogleLoginCompleteView.as_view(),
         name='google_complete'),
]
