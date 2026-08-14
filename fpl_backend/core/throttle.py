from rest_framework.throttling import AnonRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    rate = '100/minute'  # 100 attempts per minute per IP
