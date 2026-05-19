from django.urls import path
from .views import SportListView, SportDetailView, TournamentListView, TournamentDetailView, CricketTeamListView, CricketTeamDetailView

urlpatterns = [
    path('sports/', SportListView.as_view(), name='sport-list'),
    path('sports/<uuid:pk>/', SportDetailView.as_view(), name='sport-detail'),
    path('tournaments/', TournamentListView.as_view(), name='tournament-list'),
    path('tournaments/<uuid:pk>/', TournamentDetailView.as_view(),
         name='tournament-detail'),
    path('teams/', CricketTeamListView.as_view(), name='cricket-team-list'),
    path('teams/<uuid:pk>/', CricketTeamDetailView.as_view(),
         name='cricket-team-detail'),
]
