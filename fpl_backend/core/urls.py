from django.urls import include, path
from rest_framework import routers
from .views import (
    InitiatePaymentView, MatchPerformanceView, RegisterView, SportsView, VerifyPaymentView, TournamentView, CricketTeamView, PlayerView, MatchView, FantasyTeamView, FantasyTeamPlayerView, TransactionView, LeagueView
)
router = routers.DefaultRouter()
router.register(r'sports', SportsView, basename='sports')
router.register(r'tournaments', TournamentView, basename='tournaments')
router.register(r'cricket-teams', CricketTeamView, basename='cricket-teams')
router.register(r'players', PlayerView, basename='players')
router.register(r'matches', MatchView, basename='matches')
router.register(r'fantasy-teams', FantasyTeamView, basename='fantasy-teams')
router.register(r'fantasy-team-players', FantasyTeamPlayerView,
                basename='fantasy-team-players')
router.register(r'transactions', TransactionView, basename='transactions')
router.register(r'leagues', LeagueView, basename='leagues')
router.register(r'match-performances', MatchPerformanceView,
                basename='match-performances')

urlpatterns = [
    path('', include(router.urls)),  # all viewset routes

    # manual routes for custom views
    path('register/', RegisterView.as_view()),
    path('payments/initiate/', InitiatePaymentView.as_view()),
    path('payments/verify/', VerifyPaymentView.as_view()),
]
