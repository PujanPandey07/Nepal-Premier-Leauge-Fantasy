from rest_framework.throttling import AnonRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    rate = '5/minute'  # 5 attempts per minute per IP
