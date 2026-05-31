

from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework import status
from .models import (
    Player, Match, Sport, League, Tournament,
    Fantasy_Team, Fantasy_Team_Player,
    User, Cricket_Team, Player_Match_Performance, Transaction, LeagueMember, League
)
from .serializers import (
    PlayerSerializer, MatchSerializer, SportSerializer, LeagueSerializer, TournamentSerializer,
    FantasyTeamSerializer, FantasyTeamPlayerSerializer, UserPublicSerializer,
    CricketTeamSerializer, PlayerMatchPerformanceSerializer, TransactionSerializer, UserRegistrationSerializer, LeagueMemberSerializer
)
from .permissions import IsAdminOrReadOnly, IsOwnerOrAdmin, IsAuthenticated, IsLeagueOwnerOrAdmin
from django.utils import timezone
from datetime import timedelta
from .khalti import initiate_payment, verify_payment
from django.db.models import F
from .pagination import StandardPagination
# at the top of views.py after imports
PLAYER_ALLOWED_ORDERINGS = ['credit_value', 'name', '-credit_value', '-name']
TOURNAMENT_ALLOWED_ORDERINGS = ['name', 'start_date', '-name', '-start_date']
LEAGUE_ALLOWED_ORDERINGS = ['created_at', 'name', '-created_at', '-name',
                            'entry_fee', '-entry_fee', 'prize_pool', '-prize_pool']


class SportListView(APIView):
    permission_classes = [IsAdminOrReadOnly]

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
    permission_classes = [IsAdminOrReadOnly]

    def get(self, request, pk):
        sport = get_object_or_404(Sport, pk=pk)
        self.check_object_permissions(request, sport)
        serializer = SportSerializer(sport)
        return Response(serializer.data)

    def put(self, request, pk):
        sport = get_object_or_404(Sport, pk=pk)
        self.check_object_permissions(request, sport)
        serializer = SportSerializer(sport, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        sport = get_object_or_404(Sport, pk=pk)
        self.check_object_permissions(request, sport)
        sport.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TournamentListView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def get(self, request):
        tournaments = Tournament.objects.all()
        searching = request.query_params.get('search')
        if searching:
            tournaments = tournaments.filter(name__icontains=searching)
        ordering = request.query_params.get('ordering')
        if ordering and ordering in TOURNAMENT_ALLOWED_ORDERINGS:
            tournaments = tournaments.order_by(ordering)

        paginator = StandardPagination()
        result_page = paginator.paginate_queryset(tournaments, request)

        serializer = TournamentSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = TournamentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TournamentDetailView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def get(self, request, pk):
        tournament = get_object_or_404(Tournament, pk=pk)
        self.check_object_permissions(request, tournament)
        serializer = TournamentSerializer(tournament)
        return Response(serializer.data)

    def put(self, request, pk):
        tournament = get_object_or_404(Tournament, pk=pk)
        self.check_object_permissions(request, tournament)
        serializer = TournamentSerializer(tournament, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        tournament = get_object_or_404(Tournament, pk=pk)
        self.check_object_permissions(request, tournament)
        tournament.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CricketTeamListView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def get(self, request):
        teams = Cricket_Team.objects.all()
        searching = request.query_params.get('search')
        if searching:
            teams = teams.filter(name__icontains=searching)

        paginator = StandardPagination()
        result_page = paginator.paginate_queryset(teams, request)
        serializer = CricketTeamSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = CricketTeamSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CricketTeamDetailView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def get(self, request, pk):
        team = get_object_or_404(Cricket_Team, pk=pk)
        self.check_object_permissions(request, team)
        serializer = CricketTeamSerializer(team)
        return Response(serializer.data)

    def put(self, request, pk):
        team = get_object_or_404(Cricket_Team, pk=pk)
        self.check_object_permissions(request, team)
        serializer = CricketTeamSerializer(team, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        team = get_object_or_404(Cricket_Team, pk=pk)
        self.check_object_permissions(request, team)
        team.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlayerListView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def get(self, request, tournament_id):
        players = Player.objects.filter(team__tournament=tournament_id)

        role = request.query_params.get('role')
        nationality = request.query_params.get('nationality')
        batting_style = request.query_params.get('batting_style')
        bowling_style = request.query_params.get('bowling_style')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        search = request.query_params.get('search')
        if search:
            players = players.filter(name__icontains=search)

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
        ordering = request.query_params.get('ordering')
        if ordering and ordering in PLAYER_ALLOWED_ORDERINGS:
            players = players.order_by(ordering)
        paginator = StandardPagination()
        result_page = paginator.paginate_queryset(players, request)

        serializer = PlayerSerializer(result_page, many=True)

        return paginator.get_paginated_response(serializer.data)

    def post(self, request, tournament_id):

        serializer = PlayerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PlayerDetailView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def get(self, request, pk):
        player = get_object_or_404(Player, pk=pk)
        self.check_object_permissions(request, player)
        serializer = PlayerSerializer(player)
        return Response(serializer.data)

    def patch(self, request, pk):
        player = get_object_or_404(Player, pk=pk)
        self.check_object_permissions(request, player)
        serializer = PlayerSerializer(player, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MatchListView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def get(self, request, tournament_id):
        matches = Match.objects.filter(tournament=tournament_id)

        status_filter = request.query_params.get('status')
        if status_filter:
            matches = matches.filter(status=status_filter)

        paginator = StandardPagination()
        result_page = paginator.paginate_queryset(matches, request)

        serializer = MatchSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, tournament_id):
        serializer = MatchSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MatchDetailView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def get(self, request, pk):
        match = get_object_or_404(Match, pk=pk)
        self.check_object_permissions(request, match)
        serializer = MatchSerializer(match)
        return Response(serializer.data)

    def put(self, request, pk):
        match = get_object_or_404(Match, pk=pk)
        self.check_object_permissions(request, match)
        serializer = MatchSerializer(match, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        match = get_object_or_404(Match, pk=pk)
        self.check_object_permissions(request, match)
        match.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MatchPerformanceView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def get(self, request, match_id):
        performances = Player_Match_Performance.objects.filter(match=match_id)
        serializer = PlayerMatchPerformanceSerializer(performances, many=True)
        return Response(serializer.data)


class PlayerPerformanceView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def get(self, request, player_id):
        performances = Player_Match_Performance.objects.filter(
            player=player_id)
        paginator = StandardPagination()
        result_page = paginator.paginate_queryset(performances, request)
        serializer = PlayerMatchPerformanceSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)


class PlayerMatchPerformanceDetailView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def get(self, request, pk):
        performance = get_object_or_404(Player_Match_Performance, pk=pk)
        self.check_object_permissions(request, performance)
        serializer = PlayerMatchPerformanceSerializer(performance)
        return Response(serializer.data)


class UserListView(APIView):
    permission_classes = [IsAdminOrReadOnly]

    def get(self, request):
        users = User.objects.all()
        paginator = StandardPagination()
        result_page = paginator.paginate_queryset(users, request)
        serializer = UserPublicSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)


class UserDetailView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        self.check_object_permissions(request, user)
        serializer = UserPublicSerializer(user)
        return Response(serializer.data)

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        self.check_object_permissions(request, user)
        serializer = UserPublicSerializer(
            user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FantasyTeamListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        #
        teams = Fantasy_Team.objects.filter(user=request.user)
        searching = request.query_params.get('search')
        if searching:
            teams = teams.filter(name__icontains=searching)
        paginator = StandardPagination()
        result_page = paginator.paginate_queryset(teams, request)
        serializer = FantasyTeamSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        match_id = request.data.get('match')
        match = get_object_or_404(Match, pk=match_id)
        if timezone.now() > match.match_date - timedelta(minutes=30):
            return Response(
                {'detail': 'Deadline passed, team cannot be created.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = FantasyTeamSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FantasyTeamDetailView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request, pk):
        team = get_object_or_404(Fantasy_Team, pk=pk)
        self.check_object_permissions(request, team)
        serializer = FantasyTeamSerializer(team)
        return Response(serializer.data)

    def patch(self, request, pk):
        team = get_object_or_404(Fantasy_Team, pk=pk)
        self.check_object_permissions(request, team)
        if timezone.now() > team.match.match_date - timedelta(minutes=30):
            return Response(
                {'detail': 'Deadline passed, team cannot be updated.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = FantasyTeamSerializer(
            team, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        team = get_object_or_404(Fantasy_Team, pk=pk)
        self.check_object_permissions(request, team)
        team.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FantasyTeamPlayerListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, fantasy_team_id):
        team_players = Fantasy_Team_Player.objects.filter(
            fantasy_team=fantasy_team_id)
        serializer = FantasyTeamPlayerSerializer(team_players, many=True)
        return Response(serializer.data)

    def post(self, request, fantasy_team_id):
        team = get_object_or_404(Fantasy_Team, pk=fantasy_team_id)
        deadline = team.match.match_date - timedelta(minutes=30)
        if timezone.now() > deadline:
            return Response(
                {'detail': 'Deadline passed, players cannot be added.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = FantasyTeamPlayerSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(fantasy_team_id=fantasy_team_id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FantasyTeamPlayerDetailView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request, pk):
        teamplayer = get_object_or_404(Fantasy_Team_Player, pk=pk)
        self.check_object_permissions(request, teamplayer)
        serializer = FantasyTeamPlayerSerializer(teamplayer)
        return Response(serializer.data)

    def patch(self, request, pk):
        team = get_object_or_404(
            Fantasy_Team_Player, pk=pk)
        deadline = team.fantasy_team.match.match_date - timedelta(minutes=30)
        self.check_object_permissions(request, team)
        if timezone.now() > deadline:
            return Response(
                {'detail': 'Deadline passed, player cannot be updated.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = FantasyTeamPlayerSerializer(
            team, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        teamplayer = get_object_or_404(Fantasy_Team_Player, pk=pk)
        self.check_object_permissions(request, teamplayer)
        teamplayer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class LeagueListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        leagues = League.objects.all()
        searching = request.query_params.get('search')
        if searching:
            leagues = leagues.filter(name__icontains=searching)
        ordering = request.query_params.get('ordering')
        if ordering and ordering in LEAGUE_ALLOWED_ORDERINGS:
            leagues = leagues.order_by(ordering)
        paginator = StandardPagination()
        result_page = paginator.paginate_queryset(leagues, request)
        serializer = LeagueSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = LeagueSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LeagueDetailView(APIView):
    permission_classes = [IsLeagueOwnerOrAdmin]

    def get(self, request, pk):
        league = get_object_or_404(League, pk=pk)
        self.check_object_permissions(request, league)
        serializer = LeagueSerializer(league)
        return Response(serializer.data)

    def patch(self, request, pk):
        league = get_object_or_404(League, pk=pk)
        self.check_object_permissions(request, league)
        serializer = LeagueSerializer(
            league, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        league = get_object_or_404(League, pk=pk)
        self.check_object_permissions(request, league)
        league.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TransactionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        transactions = Transaction.objects.filter(user=request.user)
        paginator = StandardPagination()
        result_page = paginator.paginate_queryset(transactions, request)
        serializer = TransactionSerializer(result_page, many=True)
        return paginator.get_paginated_response(serializer.data)


class TransactionDetailView(APIView):
    permission_classes = [IsOwnerOrAdmin]

    def get(self, request, pk):
        transaction = get_object_or_404(Transaction, pk=pk)
        self.check_object_permissions(request, transaction)
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data)


class RegisterView(APIView):
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JoinLeagueView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        invite_code = request.data.get('invite_code')
        league = get_object_or_404(League, invite_code=invite_code)

        if LeagueMember.objects.filter(user=request.user, league=league).exists():
            return Response({'detail': 'Already a member.'}, status=status.HTTP_400_BAD_REQUEST)

        if LeagueMember.objects.filter(league=league).count() >= league.max_members:
            return Response({'detail': 'League is full.'}, status=status.HTTP_400_BAD_REQUEST)
        if league.entry_fee > 0:
            if request.user.wallet_balance < league.entry_fee:
                return Response({'detail': 'Insufficient balance to join league.'}, status=status.HTTP_400_BAD_REQUEST)

            request.user.wallet_balance -= league.entry_fee
            request.user.save()

            Transaction.objects.create(
                user=request.user,
                amount=league.entry_fee,
                type='debit',
                status='completed',
                payment_method='wallet'
            )

        LeagueMember.objects.create(user=request.user, league=league)
        return Response({'detail': 'Successfully joined the league.'}, status=status.HTTP_201_CREATED)


class InitiatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        if not amount:
            return Response({'detail': 'Amount required.'}, status=status.HTTP_400_BAD_REQUEST)

        transaction = Transaction.objects.create(
            user=request.user,
            amount=amount,
            type='credit',
            status='pending',
            payment_method='khalti'
        )

        return_url = 'http://localhost:8000/api/payments/verify/'
        response = initiate_payment(
            amount, transaction.id, request.user, return_url)

        transaction.reference_id = response.get('pidx')
        transaction.save()

        return Response({'payment_url': response.get('payment_url')})


class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pidx = request.query_params.get('pidx')
        response = verify_payment(pidx)
        transaction = get_object_or_404(Transaction, reference_id=pidx)
        if response.get('status') == 'Completed':
            transaction.status = 'completed'
            transaction.reference_id = response.get('pidx')
            transaction.save()

            User.objects.filter(pk=request.user.pk).update(
                wallet_balance=F('wallet_balance') + transaction.amount
            )
            request.user.save()
            return Response({'detail': 'Payment verified and wallet updated.'})
        else:
            transaction.status = 'failed'
            transaction.save()
            return Response({'detail': 'Payment verification failed.'}, status=status.HTTP_400_BAD_REQUEST)
