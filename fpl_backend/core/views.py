from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework import status
from .models import (
    Player, Match, Sport, League, Tournament,
    Fantasy_Team, Fantasy_Team_Player,
    User, Cricket_Team, Player_Match_Performance, Transaction
)
from .serializers import (
    PlayerSerializer, MatchSerializer, SportSerializer, LeagueSerializer, TournamentSerializer,
    FantasyTeamSerializer, FantasyTeamPlayerSerializer, UserPublicSerializer,
    CricketTeamSerializer, PlayerMatchPerformanceSerializer, TransactionSerializer, UserRegistrationSerializer
)


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
        sport = get_object_or_404(Sport, pk=pk)
        serializer = SportSerializer(sport)
        return Response(serializer.data)

    def put(self, request, pk):
        sport = get_object_or_404(Sport, pk=pk)
        serializer = SportSerializer(sport, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        sport = get_object_or_404(Sport, pk=pk)
        sport.delete()
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


class PlayerListView(APIView):
    def get(self, request, tournament_id):
        players = Player.objects.filter(team__tournament=tournament_id)

        role = request.query_params.get('role')
        nationality = request.query_params.get('nationality')
        batting_style = request.query_params.get('batting_style')
        bowling_style = request.query_params.get('bowling_style')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')

        if role:
            players = players.filter(role=role)
        if nationality:
            players = players.filter(nationality=nationality)
        if batting_style:
            players = players.filter(batting_style=batting_style)
        if bowling_style:
            players = players.filter(bowling_style=bowling_style)
        if min_price:
            players = players.filter(credit_value__gte=min_price)
        if max_price:
            players = players.filter(credit_value__lte=max_price)

        serializer = PlayerSerializer(players, many=True)
        return Response(serializer.data)

    def post(self, request, tournament_id):
        serializer = PlayerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PlayerDetailView(APIView):
    def get(self, request, pk):
        player = get_object_or_404(Player, pk=pk)
        serializer = PlayerSerializer(player)
        return Response(serializer.data)

    def patch(self, request, pk):
        player = get_object_or_404(Player, pk=pk)
        serializer = PlayerSerializer(player, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MatchListView(APIView):
    def get(self, request, tournament_id):
        matches = Match.objects.filter(tournament=tournament_id)

        status_filter = request.query_params.get('status')
        if status_filter:
            matches = matches.filter(status=status_filter)

        serializer = MatchSerializer(matches, many=True)
        return Response(serializer.data)

    def post(self, request, tournament_id):
        serializer = MatchSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MatchDetailView(APIView):
    def get(self, request, pk):
        match = get_object_or_404(Match, pk=pk)
        serializer = MatchSerializer(match)
        return Response(serializer.data)

    def put(self, request, pk):
        match = get_object_or_404(Match, pk=pk)
        serializer = MatchSerializer(match, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        match = get_object_or_404(Match, pk=pk)
        match.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MatchPerformanceView(APIView):
    def get(self, request, match_id):
        performances = Player_Match_Performance.objects.filter(match=match_id)
        serializer = PlayerMatchPerformanceSerializer(performances, many=True)
        return Response(serializer.data)


class PlayerPerformanceView(APIView):
    def get(self, request, player_id):
        performances = Player_Match_Performance.objects.filter(
            player=player_id)
        serializer = PlayerMatchPerformanceSerializer(performances, many=True)
        return Response(serializer.data)


class PlayerMatchPerformanceDetailView(APIView):
    def get(self, request, pk):
        performance = get_object_or_404(Player_Match_Performance, pk=pk)
        serializer = PlayerMatchPerformanceSerializer(performance)
        return Response(serializer.data)


class UserListView(APIView):
    def get(self, request):
        users = User.objects.all()
        serializer = UserPublicSerializer(users, many=True)
        return Response(serializer.data)


class UserDetailView(APIView):
    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserPublicSerializer(user)
        return Response(serializer.data)

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserPublicSerializer(
            user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FantasyTeamListView(APIView):
    def get(self, request):
        # TODO: filter by request.user after auth is added
        teams = Fantasy_Team.objects.all()
        serializer = FantasyTeamSerializer(teams, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = FantasyTeamSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FantasyTeamDetailView(APIView):
    def get(self, request, pk):
        team = get_object_or_404(Fantasy_Team, pk=pk)
        serializer = FantasyTeamSerializer(team)
        return Response(serializer.data)

    def patch(self, request, pk):
        team = get_object_or_404(Fantasy_Team, pk=pk)
        serializer = FantasyTeamSerializer(
            team, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        team = get_object_or_404(Fantasy_Team, pk=pk)
        team.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FantasyTeamPlayerListView(APIView):
    def get(self, request, fantasy_team_id):
        team_players = Fantasy_Team_Player.objects.filter(
            fantasy_team=fantasy_team_id)
        serializer = FantasyTeamPlayerSerializer(team_players, many=True)
        return Response(serializer.data)

    def post(self, request, fantasy_team_id):
        serializer = FantasyTeamPlayerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(fantasy_team_id=fantasy_team_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FantasyTeamPlayerDetailView(APIView):
    def get(self, request, pk):
        teamplayer = get_object_or_404(Fantasy_Team_Player, pk=pk)
        serializer = FantasyTeamPlayerSerializer(teamplayer)
        return Response(serializer.data)

    def patch(self, request, pk):
        teamplayer = get_object_or_404(Fantasy_Team_Player, pk=pk)
        serializer = FantasyTeamPlayerSerializer(
            teamplayer, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        teamplayer = get_object_or_404(Fantasy_Team_Player, pk=pk)
        teamplayer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LeagueListView(APIView):
    def get(self, request):
        leagues = League.objects.all()
        serializer = LeagueSerializer(leagues, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = LeagueSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LeagueDetailView(APIView):
    def get(self, request, pk):
        league = get_object_or_404(League, pk=pk)
        serializer = LeagueSerializer(league)
        return Response(serializer.data)

    def patch(self, request, pk):
        league = get_object_or_404(League, pk=pk)
        serializer = LeagueSerializer(
            league, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        league = get_object_or_404(League, pk=pk)
        league.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TransactionListView(APIView):
    def get(self, request):
        # TODO: filter by request.user after auth is added
        transactions = Transaction.objects.all()
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)


class TransactionDetailView(APIView):
    def get(self, request, pk):
        transaction = get_object_or_404(Transaction, pk=pk)
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data)


class RegisterView(APIView):
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
