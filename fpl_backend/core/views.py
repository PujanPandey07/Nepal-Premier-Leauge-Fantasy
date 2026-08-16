from django.db.models.functions import DenseRank
from django.db.models import Sum, Count, F, Window
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from allauth.account.models import EmailConfirmation, EmailConfirmationHMAC
from rest_framework.permissions import AllowAny
from allauth.account.models import EmailAddress
from allauth.account.utils import setup_user_email
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from django.contrib.auth import get_user_model
from django.shortcuts import redirect
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.models import SocialAccount
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from .serializers import CustomTokenObtainPairSerializer, GlobalLeaderboardSerializer
from .permissions import IsAdminOrReadOnly, IsAuthenticated
from decimal import Decimal
from django.core.cache import cache
from django.views import View
from django.db.models import Sum, Count, F
from rest_framework.views import APIView
from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import ValidationError
from .models import (
    Player, Match, Sport, League, Tournament,
    Fantasy_Team, Fantasy_Team_Player,
    User, Cricket_Team, Player_Match_Performance, Transaction, LeagueMember, League, News
)
from rest_framework.decorators import action
from .serializers import (
    PlayerSerializer, MatchSerializer, SportSerializer, LeagueSerializer, TournamentSerializer,
    FantasyTeamSerializer, FantasyTeamPlayerSerializer, UserPublicSerializer,
    CricketTeamSerializer, PlayerMatchPerformanceSerializer, TransactionSerializer, RegisterSerializer, LeagueMemberSerializer,
    MatchScorecardSerializer, NewsSerializer
)
from .permissions import IsAdminOrReadOnly, IsOwnerOrAdmin, IsAuthenticated, IsLeagueOwnerOrAdmin
from django.utils import timezone
from datetime import timedelta
from .khalti import initiate_payment, verify_payment
from .filters import PlayerFilter, TournamentFilter, LeagueFilter
from .pagination import StandardPagination
from .caching import CacheInvalidateMixin
from .tasks import send_welcome_email, send_match_reminder
from django.http import HttpResponse
from .throttle import AuthRateThrottle

User = get_user_model()


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

    @action(detail=True, methods=['get'], url_path='season-stats')
    def season_stats(self, request, pk=None):
        player = self.get_object()
        tournament_id = request.query_params.get('tournament')

        performances = Player_Match_Performance.objects.filter(player=player)
        if tournament_id:
            performances = performances.filter(
                match__tournament_id=tournament_id)

        totals = performances.aggregate(
            total_runs=Sum('runs_scored'),
            total_wickets=Sum('wickets_taken'),
            total_fantasy_points=Sum('fantasy_points'),
            matches_played=Count('id'),
        )

        return Response({
            'total_runs': totals['total_runs'] or 0,
            'total_wickets': totals['total_wickets'] or 0,
            'total_fantasy_points': totals['total_fantasy_points'] or 0,
            'matches_played': totals['matches_played'] or 0,
        })


class MatchView(CacheInvalidateMixin, viewsets.ModelViewSet):
    cache_key = 'matches_list'
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ['tournament', 'home_team', 'away_team']
    search_fields = ['home_team__name', 'away_team__name']
    ordering_fields = ['match_date']
    pagination_class = StandardPagination

    def perform_create(self, serializer):
        match = serializer.save()
        reminder_time = match.match_date - timedelta(hours=1)
        send_match_reminder.apply_async(
            args=[match.id],
            eta=reminder_time
        )
        cache.delete(self.cache_key)

    @action(detail=True, methods=['get'], url_path='scorecard')
    def scorecard(self, request, pk=None):
        match = get_object_or_404(
            Match.objects.prefetch_related('innings__performances__player'),
            pk=pk
        )
        serializer = MatchScorecardSerializer(match)
        return Response(serializer.data)


class MatchPerformanceView(viewsets.ModelViewSet):
    queryset = Player_Match_Performance.objects.all()
    serializer_class = PlayerMatchPerformanceSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ['match', 'player', 'runs_scored', 'wickets_taken',
                        'catches', 'stumpings', 'economy_rate', 'run_outs', 'fantasy_points']
    search_fields = ['match__home_team__name',
                     'match__away_team__name', 'player__name']
    ordering_fields = ['fantasy_points', 'runs_scored', 'wickets_taken',
                       'catches', 'stumpings', 'economy_rate', 'run_outs']
    pagination_class = StandardPagination


class NewsView(CacheInvalidateMixin, viewsets.ModelViewSet):
    cache_key = 'news_list'
    queryset = News.objects.all().order_by('-published_at')
    serializer_class = NewsSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ['tournament']
    search_fields = ['title', 'source_name']
    ordering_fields = ['published_at']
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
    permission_classes = [IsAdminOrReadOnly]
    filterset_class = LeagueFilter
    search_fields = ['name', 'tournament__name']
    ordering_fields = ['entry_fee', 'name',
                       'created_at', 'prize_pool', 'max_members']
    pagination_class = StandardPagination

    def get_permissions(self):
        if self.action in ['join', 'create']:
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'], url_path='join')
    def join(self, request):
        league_id = request.data.get('league_id')
        invite_code = request.data.get('invite_code')

        if league_id:
            league = get_object_or_404(League, pk=league_id)
        elif invite_code:
            league = get_object_or_404(League, invite_code=invite_code)
        else:
            return Response(
                {'detail': 'league_id or invite_code required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if LeagueMember.objects.filter(user=request.user, league=league).exists():
            return Response({'detail': 'Already a member.'}, status=status.HTTP_400_BAD_REQUEST)

        if LeagueMember.objects.filter(league=league).count() >= league.max_members:
            return Response({'detail': 'League is full.'}, status=status.HTTP_400_BAD_REQUEST)

        if league.status != 'open':
            return Response({'detail': 'League is not open.'}, status=status.HTTP_400_BAD_REQUEST)

        if not league.is_public:
            if not invite_code or invite_code != league.invite_code:
                return Response(
                    {'detail': 'Invalid invite code.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if league.entry_fee > 0:
            if request.user.wallet_balance < league.entry_fee:
                return Response(
                    {'detail': 'Insufficient balance.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            request.user.wallet_balance -= league.entry_fee
            request.user.save()
            Transaction.objects.create(
                user=request.user,
                amount=league.entry_fee,
                type='debit',
                status='completed',
                payment_method='wallet'
            )

        member = LeagueMember.objects.create(user=request.user, league=league)
        try:
            latest_team = Fantasy_Team.objects.filter(
                user=request.user, tournament=league.tournament).order_by('-created_at').first()
            if latest_team:
                member.fantasy_team = latest_team
                member.save()
        except Exception:
            pass
        return Response(
            {'detail': 'Successfully joined the league.'},
            status=status.HTTP_201_CREATED
        )


class TransactionView(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-created_at')


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user.is_verified = False
        user.save()

        send_welcome_email.delay(user.id)

        setup_user_email(request, user, [])
        email_address = EmailAddress.objects.get_for_user(user, user.email)
        email_address.send_confirmation(request)

        return Response({
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
                'is_verified': False,
            },
            'detail': 'Registration successful. Please check your email to verify your account.'
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LeagueMemberView(viewsets.ModelViewSet):
    serializer_class = LeagueMemberSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['league', 'user']
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        my_league_ids = LeagueMember.objects.filter(
            user=self.request.user
        ).values_list('league_id', flat=True)
        return LeagueMember.objects.filter(league_id__in=my_league_ids)


class InitiatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        if not amount:
            return Response({'detail': 'Amount required.'}, status=status.HTTP_400_BAD_REQUEST)

        amount_in_npr = int(amount) / 100

        transaction = Transaction.objects.create(
            user=request.user,
            amount=amount_in_npr,
            type='credit',
            status='pending',
            payment_method='khalti'
        )

        return_url = f'{settings.BACKEND_URL}/api/payments/verify/'
        response = initiate_payment(
            amount, transaction.id, request.user, return_url)

        transaction.reference_id = response.get('pidx')
        transaction.save()

        return Response({'payment_url': response.get('payment_url')})


class VerifyPaymentView(APIView):
    permission_classes = []

    def get(self, request):
        pidx = request.query_params.get('pidx')
        if not pidx:
            return redirect(f'{settings.FRONTEND_URL}/wallet?status=failed')

        response = verify_payment(pidx)
        transaction = get_object_or_404(Transaction, reference_id=pidx)

        if response.get('status') == 'Completed':
            transaction.status = 'completed'
            transaction.save()

            User.objects.filter(pk=transaction.user.pk).update(
                wallet_balance=F('wallet_balance') + transaction.amount
            )
            return redirect(f'{settings.FRONTEND_URL}/wallet?status=success')
        else:
            transaction.status = 'failed'
            transaction.save()
            return redirect(f'{settings.FRONTEND_URL}/wallet?status=failed')


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')

        try:
            user = User.objects.get(email=email)
            if not user.is_verified:
                return Response(
                    {'detail': 'Please verify your email before logging in.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except User.DoesNotExist:
            pass

        response = super().post(request, *args, **kwargs)
        if response.status_code == 200 and 'refresh' in response.data:
            refresh = response.data.pop('refresh')
            response.set_cookie(
                'jwt-refresh-auth',
                refresh,
                httponly=True,
                secure=request.is_secure(),      # ← FIX
                samesite='Lax',
                path='/'
            )
        return response


class CookieTokenRefreshView(TokenRefreshView):

    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(
            'jwt-refresh-auth') or request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Refresh token not provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check user verification BEFORE rotating (so we don't blacklist a valid token for no reason)
        try:
            from rest_framework_simplejwt.tokens import RefreshToken as RT
            unverified_token = RT(refresh_token)
            user_id = unverified_token.payload.get('user_id')
            User = get_user_model()
            user = User.objects.get(id=user_id)
            if not user.is_verified:
                return Response({'detail': 'Please verify your email first.'}, status=status.HTTP_403_FORBIDDEN)
        except Exception:
            pass  # Invalid/expired token — let serializer handle it below

        serializer = self.get_serializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response({'detail': 'Refresh token invalid or expired.'}, status=status.HTTP_401_UNAUTHORIZED)

        data = dict(serializer.validated_data)
        new_refresh = data.pop('refresh', None)

        resp = Response(data, status=status.HTTP_200_OK)
        if new_refresh:
            resp.set_cookie(
                'jwt-refresh-auth',
                new_refresh,
                httponly=True,
                secure=request.is_secure(),      # ← FIX
                samesite='Lax',
                path='/'
            )
        return resp


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get(
            'jwt-refresh-auth') or request.data.get('refresh')

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                try:
                    token.blacklist()
                except Exception:
                    pass
            except Exception:
                pass

        resp = Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)
        resp.delete_cookie('jwt-refresh-auth', path='/')
        return resp


@method_decorator(login_required, name='dispatch')
class GoogleLoginCompleteView(View):
    def get(self, request):
        user = request.user

        if not user.is_verified:
            user.is_verified = True
            user.save(update_fields=['is_verified'])

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        resp = redirect(f'{settings.FRONTEND_URL}/auth/callback')
        resp.set_cookie(
            'jwt-refresh-auth',
            refresh_token,
            httponly=True,
            secure=request.is_secure(),      # ← FIX
            samesite='Lax',
            path='/'
        )
        return resp


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .serializers import UserPrivateSerializer
        serializer = UserPrivateSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        from .serializers import UserPrivateSerializer
        serializer = UserPrivateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email_view(request, key):
    try:
        confirmation = EmailConfirmationHMAC.from_key(key)
        if not confirmation:
            confirmation = EmailConfirmation.objects.get(key=key)
        confirmation.confirm(request)

        user = confirmation.email_address.user
        if not user.is_verified:
            user.is_verified = True
            user.save(update_fields=['is_verified'])

        return redirect(f'{settings.FRONTEND_URL}/login?verified=success')
    except Exception:
        return redirect(f'{settings.FRONTEND_URL}/login?verified=failed')


@api_view(['GET'])
@permission_classes([AllowAny])
@throttle_classes([])
def health_check(request):
    return Response({'status': 'ok', 'service': 'django'})


class TournamentLeaderboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tournament_id = request.query_params.get('tournament')

        if not tournament_id:
            return Response(
                {'detail': 'tournament query parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cache_key = f'leaderboard_tournament_{tournament_id}'
        page_number = request.query_params.get('page', 1)
        cache_key += f'_page_{page_number}'

        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        # Show ALL users who have played in this tournament, even with 0 points
        queryset = User.objects.filter(
            fantasy_teams__tournament_id=tournament_id
        ).annotate(
            total_fantasy_points=Sum('fantasy_teams__total_points', default=0),
            teams_played=Count('fantasy_teams', distinct=True)
        ).order_by('-total_fantasy_points', 'name')

        # Paginate first
        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)

        # Compute rank in Python
        items = page if page is not None else queryset
        results = []
        current_rank = 0
        previous_points = None

        for idx, user_obj in enumerate(items, start=1):
            if user_obj.total_fantasy_points != previous_points:
                current_rank = idx
                previous_points = user_obj.total_fantasy_points

            results.append({
                'id': user_obj.id,
                'rank': current_rank,
                'name': user_obj.name,
                'email': user_obj.email,
                'total_fantasy_points': str(user_obj.total_fantasy_points),
                'teams_played': user_obj.teams_played,
            })

        response_data = {
            'count': paginator.page.paginator.count if page else len(results),
            'next': paginator.get_next_link() if page else None,
            'previous': paginator.get_previous_link() if page else None,
            'results': results,
        }

        cache.set(cache_key, response_data, 300)
        return Response(response_data)
