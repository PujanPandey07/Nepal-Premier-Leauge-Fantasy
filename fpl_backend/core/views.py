from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from django.shortcuts import redirect
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.models import SocialAccount
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from .serializers import CustomTokenObtainPairSerializer
from .permissions import IsAdminOrReadOnly, IsAuthenticated
from decimal import Decimal
from django.core.cache import cache

from django.db.models import Sum, Count, F
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
from django.db.models import F
from .filters import PlayerFilter, TournamentFilter, LeagueFilter
from .pagination import StandardPagination
from .caching import CacheInvalidateMixin
from .tasks import send_welcome_email, send_match_reminder
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


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

        # aggregate() returns None for any field with zero matching rows —
        # normalize to 0 so the frontend doesn't need to handle null
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
        # schedule reminder 1 hour before match
        reminder_time = match.match_date - timedelta(hours=1)
        send_match_reminder.apply_async(
            args=[match.id],
            eta=reminder_time  # run at this specific time
        )
        cache.delete(self.cache_key)

    @action(detail=True, methods=['get'], url_path='scorecard')
    def scorecard(self, request, pk=None):
        # prefetch_related avoids N+1 queries across innings -> performances -> player
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
        # join action only needs to be authenticated, not admin
        if self.action in ['join', 'create']:
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        league = serializer.save(created_by=self.request.user)

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
        # If the user has an existing fantasy team for this tournament, link
        # their latest team as the membership's `fantasy_team` for display/points
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
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh_token = str(refresh)

        response = Response({
            'access': access,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.name,
            }
        }, status=status.HTTP_201_CREATED)

        response.set_cookie(
            'jwt-refresh-auth',
            refresh_token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            path='/'
        )
        return response
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LeagueMemberView(viewsets.ModelViewSet):
    serializer_class = LeagueMemberSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['league', 'user']
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        # Any member can see ALL members of leagues they belong to
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

        # amount comes in paisa — convert to NPR for storing
        amount_in_npr = int(amount) / 100

        transaction = Transaction.objects.create(
            user=request.user,
            amount=amount_in_npr,
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
    permission_classes = []  # public — Khalti redirect has no JWT token

    def get(self, request):
        pidx = request.query_params.get('pidx')
        if not pidx:
            return redirect('http://localhost/wallet?status=failed')

        response = verify_payment(pidx)
        transaction = get_object_or_404(Transaction, reference_id=pidx)

        if response.get('status') == 'Completed':
            transaction.status = 'completed'
            transaction.save()

            User.objects.filter(pk=transaction.user.pk).update(
                wallet_balance=F('wallet_balance') + transaction.amount
            )
            # Redirect to frontend wallet page with success message
            return redirect('http://localhost/wallet?status=success')
        else:
            transaction.status = 'failed'
            transaction.save()
            return redirect('http://localhost/wallet?status=failed')


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200 and 'refresh' in response.data:
            # ← pop, don't just get — removes it from the body
            refresh = response.data.pop('refresh')
            response.set_cookie(
                'jwt-refresh-auth',
                refresh,
                httponly=True,
                secure=not settings.DEBUG,
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

        serializer = self.get_serializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response({'detail': 'Refresh token invalid or expired.'}, status=status.HTTP_401_UNAUTHORIZED)

        data = dict(serializer.validated_data)
        new_refresh = data.pop('refresh', None)  # ← strip before responding

        # body now only has {'access': ...}
        resp = Response(data, status=status.HTTP_200_OK)
        if new_refresh:
            resp.set_cookie(
                'jwt-refresh-auth',
                new_refresh,
                httponly=True,
                secure=not settings.DEBUG,
                samesite='Lax',
                path='/'
            )
        return resp


@csrf_exempt
def token_refresh_with_cors(request, *args, **kwargs):
    """Wrapper for the Token refresh endpoint that explicitly responds to
    OPTIONS preflight with the required CORS credentials header. POST is
    delegated to the existing CookieTokenRefreshView.
    """
    # Handle preflight explicitly so browsers see Access-Control-Allow-Credentials
    if request.method == 'OPTIONS':
        origin = request.META.get('HTTP_ORIGIN') or '*'
        resp = HttpResponse()
        resp['Access-Control-Allow-Origin'] = origin
        resp['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        resp['Access-Control-Allow-Headers'] = 'accept, authorization, content-type, x-csrftoken, x-requested-with'
        resp['Access-Control-Allow-Credentials'] = 'true'
        resp['Access-Control-Max-Age'] = '86400'
        return resp

    # For POST, delegate to the TokenRefreshView implementation
    view = CookieTokenRefreshView.as_view()
    return view(request, *args, **kwargs)


class LogoutView(APIView):
    """Log the user out by blacklisting the refresh token (if present) and clearing the cookie."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        # try to read refresh from cookie first, then body
        refresh_token = request.COOKIES.get(
            'jwt-refresh-auth') or request.data.get('refresh')

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                # blacklist if the app has blacklist enabled
                try:
                    token.blacklist()
                except Exception:
                    # blacklist may not be enabled; ignore
                    pass
            except Exception:
                # token invalid/expired — we still proceed to clear cookie
                pass

        # clear cookie
        resp = Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)
        resp.delete_cookie('jwt-refresh-auth', path='/')
        return resp


# views.py


User = get_user_model()


class GoogleLoginCompleteView(APIView):
    permission_classes = []

    def get(self, request):
        # allauth uses Django sessions, not JWT — so we read from session
        user_id = request.session.get('_auth_user_id')
        if not user_id:
            return redirect('http://localhost/login?error=auth_failed')

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return redirect('http://localhost/login?error=auth_failed')

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        # Persist refresh token in a HttpOnly cookie so the SPA can
        # silently obtain an access token via the cookie-based refresh
        # endpoint. Avoid placing tokens in the URL.
        resp = redirect('http://localhost/auth/callback')
        resp.set_cookie(
            'jwt-refresh-auth',
            refresh_token,
            httponly=True,
            secure=not settings.DEBUG,
            samesite='Lax',
            path='/'
        )
        try:
            resp['Access-Control-Allow-Credentials'] = 'true'
        except Exception:
            pass
        return resp


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .serializers import UserPrivateSerializer
        serializer = UserPrivateSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        from .serializers import UserPrivateSerializer
        # partial=True means only the fields sent will be updated
        # wallet_balance is read_only so users can't manually set it
        serializer = UserPrivateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
