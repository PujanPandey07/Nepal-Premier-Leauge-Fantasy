from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'  # allow client to override
    max_page_size = 50  # was 20 — too low to return all 32 NPL matches in one request
