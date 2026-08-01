from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponse
from django.urls import resolve
import logging
logger = logging.getLogger(__name__)


class ForceCorsCredentialsMiddleware(MiddlewareMixin):
    """Ensure `Access-Control-Allow-Credentials: true` is present on responses
    when an `Origin` header is present. Implemented with `process_response`
    so it always runs for responses, even when other middleware return early.
    """

    def process_response(self, request, response):
        origin = request.META.get('HTTP_ORIGIN')
        if origin:
            try:
                response['Access-Control-Allow-Credentials'] = 'true'
            except Exception:
                try:
                    response.headers['Access-Control-Allow-Credentials'] = 'true'
                except Exception:
                    pass
        return response


class PreflightTokenRefreshMiddleware:
    """Short-circuit OPTIONS preflight for the token refresh endpoint so we
    can explicitly return Access-Control-Allow-Credentials for browsers.
    This middleware should be placed early in `MIDDLEWARE` so it runs before
    `CorsMiddleware` and can return our custom preflight response.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only handle OPTIONS for the refresh endpoint
        if request.method == 'OPTIONS':
            # match path to avoid hard-coding host prefixes
            try:
                match = resolve(request.path_info)
                if match.route == 'api/token/refresh/' or request.path_info.endswith('/api/token/refresh/'):
                    origin = request.META.get('HTTP_ORIGIN') or '*'
                    resp = HttpResponse()
                    resp['Access-Control-Allow-Origin'] = origin
                    # log for debugging to ensure this middleware ran
                    logger.debug(
                        'PreflightTokenRefreshMiddleware returning preflight for origin %s', origin)
                    print(
                        f"PreflightTokenRefreshMiddleware: handling OPTIONS for {request.path_info} origin={origin}")
                    resp['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
                    resp['Access-Control-Allow-Headers'] = 'accept, authorization, content-type, x-csrftoken, x-requested-with'
                    resp['Access-Control-Allow-Credentials'] = 'true'
                    resp['Access-Control-Max-Age'] = '86400'
                    return resp
            except Exception:
                pass

        return self.get_response(request)
