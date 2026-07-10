from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import CustomTokenObtainPairView, GoogleLoginCompleteView


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('api/token/', CustomTokenObtainPairView.as_view(),
         name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'),
         name='swagger-ui'),
    path('api/', include('core.urls')),


    path('auth/complete/', GoogleLoginCompleteView.as_view()),
    path("accounts/", include("allauth.urls")),


    # allauth/dj-rest-auth endpoints
    # login, logout, password reset
    path('api/auth/', include('dj_rest_auth.urls')),
    # register + verify email
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
]
