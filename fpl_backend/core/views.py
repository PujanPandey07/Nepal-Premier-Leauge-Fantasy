

from decimal import Decimal

from django.db.models import Sum
from rest_framework.test import APITestCase
from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import ValidationError
from .models import (
    Player, Match, Sport, League, Tournament,
    Fantasy_Team, Fantasy_Team_Player,
    User, Cricket_Team, Player_Match_Performance, Transaction, LeagueMember, League
)
from rest_framework.decorators import action
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
from .filters import PlayerFilter, TournamentFilter, LeagueFilter
from .pagination import StandardPagination
from .caching import CacheInvalidateMixin


class SportsView(CacheInvalidateMixin, viewsets.ModelViewSet):
    cache_key = 'sports_list'
    queryset = Sport.objects.all()
    serializer_class = SportSerializer
    permission_classes = [IsAdminOrReadOnly]


class TournamentView(CacheInvalidateMixin, viewsets.ModelViewSet):
    cache_key = 'tournaments_list'
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_class = TournamentFilter
    search_fields = ['name', 'sport__name']
    ordering_fields = ['start_date', 'end_date']
    pagination_class = StandardPagination


class CricketTeamView(CacheInvalidateMixin, viewsets.ModelViewSet):
    cache_key = 'cricket_teams_list'
    queryset = Cricket_Team.objects.all()
    serializer_class = CricketTeamSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ['tournament', 'name']
    search_fields = ['name', 'tournament__name', 'short_name']
    ordering_fields = ['name']
    pagination_class = StandardPagination


class PlayerView(CacheInvalidateMixin, viewsets.ModelViewSet):
    cache_key = 'players_list'
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_class = PlayerFilter
    search_fields = ['name', 'team__name']
    ordering_fields = ['name', 'credit_value']
    http_method_names = ['get', 'post', 'put', 'patch',]
    pagination_class = StandardPagination


class MatchView(CacheInvalidateMixin, viewsets.ModelViewSet):
    cache_key = 'matches_list'
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ['tournament', 'home_team', 'away_team']
    search_fields = ['home_team__name', 'away_team__name']
    ordering_fields = ['match_date']
    pagination_class = StandardPagination


class MatchPerformanceView(viewsets.ModelViewSet):
    queryset = Player_Match_Performance.objects.all()
    serializer_class = PlayerMatchPerformanceSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ['match', 'player', 'runs_scored', 'wickets_taken',
                        'catches_taken', 'stumpings', 'economy_rate', 'runouts', 'fantasy_points']
    search_fields = ['match__home_team__name',
                     'match__away_team__name', 'player__name']
    ordering_fields = ['fantasy_points', 'runs_scored', 'wickets_taken',
                       'catches_taken', 'stumpings', 'economy_rate', 'runouts']
    pagination_class = StandardPagination


class UserView(viewsets.ModelViewSet):

    queryset = User.objects.all()
    serializer_class = UserPublicSerializer
    permission_classes = [IsAdminOrReadOnly]
    http_method_names = ['get', 'post', 'put', 'patch',]


class FantasyTeamView(viewsets.ModelViewSet):
    serializer_class = FantasyTeamSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Fantasy_Team.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        match_id = self.request.data.get('match')
        match = get_object_or_404(Match, pk=match_id)
        if timezone.now() > match.match_date - timedelta(minutes=30):
            raise ValidationError(
                'Deadline passed, team cannot be created.')
        serializer.save(user=self.request.user)


class FantasyTeamPlayerView(viewsets.ModelViewSet):
    serializer_class = FantasyTeamPlayerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Fantasy_Team_Player.objects.filter(
            fantasy_team__user=self.request.user
        )

    def perform_create(self, serializer):
        fantasy_team_id = self.request.data.get('fantasy_team')
        fantasy_team = get_object_or_404(Fantasy_Team, pk=fantasy_team_id)
        match = fantasy_team.match
        if timezone.now() > match.match_date - timedelta(minutes=30):
            raise ValidationError('Deadline passed, players cannot be added.')
        serializer.save()


class LeagueView(viewsets.ModelViewSet):
    queryset = League.objects.all()
    serializer_class = LeagueSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = LeagueFilter
    search_fields = ['name', 'tournament__name']
    ordering_fields = ['entry_fee', 'name',
                       'created_at', 'prize_pool', 'max_members']
    pagination_class = StandardPagination

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'], url_path='join')
    def join(self, request):
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


class TransactionView(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-created_at')


class RegisterView(APIView):
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
