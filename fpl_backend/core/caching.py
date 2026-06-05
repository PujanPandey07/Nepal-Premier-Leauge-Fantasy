from django.core.cache import cache
from rest_framework.response import Response
from rest_framework import viewsets


class CacheInvalidateMixin:
    cache_key = None

    def list(self, request, *args, **kwargs):
        cached = cache.get(self.cache_key)
        if cached:
            return Response(cached)

        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        cache.set(self.cache_key, serializer.data, timeout=60*15*8)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save()
        cache.delete(self.cache_key)

    def perform_update(self, serializer):
        serializer.save()
        cache.delete(self.cache_key)

    def perform_destroy(self, instance):
        instance.delete()
        cache.delete(self.cache_key)
