from django.core.cache import cache
from rest_framework.response import Response


class CacheInvalidateMixin:
    cache_key = None

    def list(self, request, *args, **kwargs):
        if request.query_params:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        cached = cache.get(self.cache_key)
        if cached:
            return Response(cached)

        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            result = self.get_paginated_response(serializer.data)
            cache.set(self.cache_key, result.data, timeout=60*15*8)
            return result
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
