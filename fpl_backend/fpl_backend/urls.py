from core.views import (
    CustomTokenObtainPairView, GoogleLoginCompleteView,
    CookieTokenRefreshView, LogoutView, verify_email_view
)
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('api/token/', CustomTokenObtainPairView.as_view(),
         name='token_obtain_pair'),
    # Use CookieTokenRefreshView directly — corsheaders handles CORS
    path('api/token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'),
         name='swagger-ui'),
    path('api/', include('core.urls')),

    path('auth/complete/', GoogleLoginCompleteView.as_view()),
    path("accounts/", include("allauth.urls")),
    path('api/auth/verify-email/<str:key>/',
         verify_email_view, name='verify_email')

]
