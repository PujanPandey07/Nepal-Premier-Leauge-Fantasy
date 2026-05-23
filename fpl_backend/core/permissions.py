from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminOrReadOnly(BasePermission):
    """
    Anyone can read (GET, HEAD, OPTIONS)
    Only admin can write (POST, PUT, PATCH, DELETE)
    Used for: Sports, Tournaments, Players, Matches
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.is_staff


class IsOwnerOrAdmin(BasePermission):
    """
    Must be logged in to access at all
    Can only access their own objects unless admin
    Used for: FantasyTeam, Transaction, User profile
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user or request.user.is_staff


class IsAuthenticated(BasePermission):
    """
    Must be logged in to access at all
    Used for: League
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsLeagueOwnerOrAdmin(BasePermission):
    """
    Must be logged in to access at all
    Can only access leagues they own unless admin
    Used for: League
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        return obj.created_by == request.user or request.user.is_staff
