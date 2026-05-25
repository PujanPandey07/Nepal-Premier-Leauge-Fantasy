from django.urls import path
from .views import (
    MatchDetailView, SportListView, SportDetailView,
    TournamentListView, TournamentDetailView,
    CricketTeamListView, CricketTeamDetailView,
    PlayerListView, PlayerDetailView,
    MatchListView, MatchPerformanceView,
    PlayerPerformanceView, PlayerMatchPerformanceDetailView,
    UserListView, UserDetailView,
    FantasyTeamListView, FantasyTeamDetailView,
    FantasyTeamPlayerListView, FantasyTeamPlayerDetailView,
    LeagueListView, LeagueDetailView,
    TransactionListView, TransactionDetailView, RegisterView
)

urlpatterns = [
    # Sports
    path('sports/', SportListView.as_view(), name='sport-list'),
    path('sports/<uuid:pk>/', SportDetailView.as_view(), name='sport-detail'),

    # Tournaments
    path('tournaments/', TournamentListView.as_view(), name='tournament-list'),
    path('tournaments/<uuid:pk>/', TournamentDetailView.as_view(),
         name='tournament-detail'),

    # Cricket Teams
    path('cricket-teams/', CricketTeamListView.as_view(), name='cricket-team-list'),
    path('cricket-teams/<uuid:pk>/', CricketTeamDetailView.as_view(),
         name='cricket-team-detail'),

    # Players
    path('tournaments/<uuid:tournament_id>/players/',
         PlayerListView.as_view(), name='player-list'),
    path('players/<uuid:pk>/', PlayerDetailView.as_view(), name='player-detail'),

    # Matches
    path('tournaments/<uuid:tournament_id>/matches/',
         MatchListView.as_view(), name='match-list'),
    path('matches/<uuid:pk>/', MatchDetailView.as_view(), name='match-detail'),

    # Performances
    path('matches/<uuid:match_id>/performances/',
         MatchPerformanceView.as_view(), name='match-performances'),
    path('players/<uuid:player_id>/performances/',
         PlayerPerformanceView.as_view(), name='player-performances'),
    path('performances/<uuid:pk>/',
         PlayerMatchPerformanceDetailView.as_view(), name='performance-detail'),

    # Users
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<uuid:pk>/', UserDetailView.as_view(), name='user-detail'),

    # Fantasy Teams
    path('fantasy-teams/', FantasyTeamListView.as_view(), name='fantasy-team-list'),
    path('fantasy-teams/<uuid:pk>/', FantasyTeamDetailView.as_view(),
         name='fantasy-team-detail'),

    # Fantasy Team Players
    path('fantasy-teams/<uuid:fantasy_team_id>/players/',
         FantasyTeamPlayerListView.as_view(), name='fantasy-team-player-list'),
    path('fantasy-teams/<uuid:fantasy_team_id>/players/<uuid:pk>/',
         FantasyTeamPlayerDetailView.as_view(), name='fantasy-team-player-detail'),

    # Leagues
    path('leagues/', LeagueListView.as_view(), name='league-list'),
    path('leagues/<uuid:pk>/', LeagueDetailView.as_view(), name='league-detail'),

    # Transactions
    path('transactions/', TransactionListView.as_view(), name='transaction-list'),
    path('transactions/<uuid:pk>/', TransactionDetailView.as_view(),
         name='transaction-detail'),
    path('auth/register/', RegisterView.as_view(), name='register'),
]
