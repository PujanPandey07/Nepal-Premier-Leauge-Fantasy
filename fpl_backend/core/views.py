from django.shortcuts import render
from rest_framework, views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework import status
from .models import (
    Player, Match, Sport, League, Tournament,
    Fantasy_Team, Fantasy_Team_Player, LeagueMember,
    User, Cricket_Team, Player_Match_Performance, Transaction
)
from .serializers import (
    PlayerSerializer, MatchSerializer, SportSerializer, LeagueSerializer, TournamentSerializer,
    FantasyTeamSerializer, FantasyTeamPlayerSerializer, LeagueMemberSerializer, UserPublicSerializer, UserPrivateSerializer,
    CricketTeamSerializer, PlayerMatchPerformanceSerializer, TransactionSerializer)


class SportListView(APIView):
    def get(self, request):
        sports = Sport.objects.all()
        serializer = SportSerializer(sports, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SportSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SportDetailView(APIView):
    def get(self, request, pk):
        sports = get_object_or_404(Sport, pk=pk)
        serializer = SportSerializer(sports)
        return Response(serializer.data)

    def put(self, request, pk):
        sports = get_object_or_404(Sport, pk=pk)
        serializer = SportSerializer(sports, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        sports = get_object_or_404(Sport, pk=pk)
        sports.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TournamentListView(APIView):
    def get(self, request):
        tournaments = Tournament.objects.all()
        serializer = TournamentSerializer(tournaments, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TournamentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TournamentDetailView(APIView):
    def get(self, request, pk):
        tournament = get_object_or_404(Tournament, pk=pk)
        serializer = TournamentSerializer(tournament)
        return Response(serializer.data)

    def put(self, request, pk):
        tournament = get_object_or_404(Tournament, pk=pk)
        serializer = TournamentSerializer(tournament, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        tournament = get_object_or_404(Tournament, pk=pk)
        tournament.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CricketTeamListView(APIView):
    def get(self, request):
        teams = Cricket_Team.objects.all()
        serializer = CricketTeamSerializer(teams, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CricketTeamSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CricketTeamDetailView(APIView):
    def get(self, request, pk):
        team = get_object_or_404(Cricket_Team, pk=pk)
        serializer = CricketTeamSerializer(team)
        return Response(serializer.data)

    def put(self, request, pk):
        team = get_object_or_404(Cricket_Team, pk=pk)
        serializer = CricketTeamSerializer(team, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        team = get_object_or_404(Cricket_Team, pk=pk)
        team.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
