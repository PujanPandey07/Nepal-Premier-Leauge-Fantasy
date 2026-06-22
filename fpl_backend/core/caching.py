from django.core.cache import cache
from rest_framework.response import Response


class CacheInvalidateMixin:
    cache_key = None

    def list(self, request, *args, **kwargs):

        # If filters exist → skip cache (optional logic)
        if request.query_params:
            queryset = self.filter_queryset(self.get_queryset())

            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)

        # ---- CACHE ----
        cached_data = cache.get(self.cache_key)
        if cached_data is not None:
            return Response(cached_data)

        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)

            response = self.get_paginated_response(serializer.data)

            cache.set(self.cache_key, response.data, timeout=60 * 15 * 8)
            return response

        serializer = self.get_serializer(queryset, many=True)

        cache.set(self.cache_key, serializer.data, timeout=60 * 15 * 8)

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
