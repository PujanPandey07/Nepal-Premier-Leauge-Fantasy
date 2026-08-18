from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Player, Match, Sport, League, Tournament,
    Fantasy_Team, Fantasy_Team_Player, LeagueMember,
    User, Cricket_Team, Player_Match_Performance, Transaction, Innings, News
)
import secrets
from django.db.models import Sum

User = get_user_model()


class SportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sport
        fields = '__all__'


class TournamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = '__all__'


class CricketTeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cricket_Team
        fields = '__all__'


class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = '__all__'
        read_only_fields = ['id', 'credit_value']


class MatchSerializer(serializers.ModelSerializer):
    home_team_name = serializers.CharField(
        source='home_team.name', read_only=True)
    away_team_name = serializers.CharField(
        source='away_team.name', read_only=True)
    score_summary = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = '__all__'
        read_only_fields = ['result']

    def get_score_summary(self, obj):
        innings = obj.innings.all().order_by('innings_number')
        if not innings:
            return None
        return [
            {'team': i.batting_team.name, 'runs': i.total_runs,
                'wickets': i.total_wickets, 'overs': str(i.overs)}
            for i in innings
        ]


class PlayerMatchPerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player_Match_Performance
        fields = '__all__'
        read_only_fields = ['fantasy_points']


# --- Scorecard-specific serializers ---
class ScorecardPerformanceSerializer(serializers.ModelSerializer):
    player_name = serializers.CharField(source='player.name', read_only=True)

    class Meta:
        model = Player_Match_Performance
        fields = [
            'player', 'player_name', 'runs_scored', 'balls_faced', 'fours',
            'sixes', 'strike_rate', 'wickets_taken', 'overs_bowled', 'economy_rate',
            'maidens', 'catches', 'stumpings', 'run_outs', 'fantasy_points', 'how_out'
        ]
        read_only_fields = ['fantasy_points']


class InningSerializer(serializers.ModelSerializer):
    batting_team_name = serializers.CharField(
        source='batting_team.name', read_only=True)
    performances = ScorecardPerformanceSerializer(many=True, read_only=True)

    class Meta:
        model = Innings
        fields = [
            'id', 'innings_number', 'batting_team', 'batting_team_name',
            'total_runs', 'total_wickets', 'overs', 'extras',
            'is_complete', 'performances',
        ]


class MatchScorecardSerializer(serializers.ModelSerializer):
    home_team_name = serializers.CharField(
        source='home_team.name', read_only=True)
    away_team_name = serializers.CharField(
        source='away_team.name', read_only=True)
    innings = InningSerializer(many=True, read_only=True)

    class Meta:
        model = Match
        fields = [
            'id', 'home_team', 'home_team_name', 'away_team', 'away_team_name',
            'match_date', 'venue', 'status', 'result', 'innings',
        ]


class NewsSerializer(serializers.ModelSerializer):
    class Meta:
        model = News
        fields = '__all__'


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'profile_picture', 'team_name']


class UserPrivateSerializer(serializers.ModelSerializer):
    favorite_team_detail = CricketTeamSerializer(
        source='favorite_team', read_only=True)
    favorite_players_detail = PlayerSerializer(
        source='favorite_players', many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'phone_no',
                  'profile_picture', 'wallet_balance',
                  'is_verified', 'created_at', 'team_name',
                  'favorite_team', 'favorite_team_detail',
                  'favorite_players', 'favorite_players_detail']
        read_only_fields = ['id', 'is_verified', 'created_at']

    def validate_favorite_players(self, value):
        if len(value) > 3:
            raise serializers.ValidationError(
                "You can select at most 3 favorite players.")
        return value


# --- NEW: Registration serializer for custom /api/auth/register/ endpoint ---
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'name', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError(
                {'password2': ['Passwords do not match.']})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class FantasyTeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fantasy_Team
        fields = '__all__'
        read_only_fields = ['id', 'total_points',
                            'created_at', 'updated_at', 'user']

    def validate(self, data):
        user = self.context['request'].user
        if Fantasy_Team.objects.filter(user=user, match=data['match']).exists():
            raise serializers.ValidationError(
                "You have already created a team for this match.")
        return data

    def create(self, validated_data):
        validated_data['remaining_budget'] = validated_data['tournament'].budget_cap
        return Fantasy_Team.objects.create(**validated_data)


def normalize_role(role_str):
    """Maps raw DB strings (e.g., 'Wicket Keeper Batsman', 'Batting All-Rounder')

    to your 4 exact role keys.
    """
    if not role_str:
        return 'Batsman'
    r = str(role_str).lower()
    if 'keeper' in r or 'wk' in r:
        return 'Wicket-Keeper'
    if 'all' in r or 'rounder' in r or 'ar' in r:
        return 'All-Rounder'
    if 'bowl' in r or 'bow' in r:
        return 'Bowler'
    return 'Batsman'


class FantasyTeamPlayerSerializer(serializers.ModelSerializer):

    class Meta:

        model = Fantasy_Team_Player
        fields = '__all__'
        read_only_fields = ['points_earned']

    def validate(self, data):
        instance = self.instance

        fantasy_team = data.get(
            'fantasy_team', instance.fantasy_team if instance else None
        )
        player = data.get('player', instance.player if instance else None)
        is_captain = data.get(
            'is_captain', instance.is_captain if instance else False
        )
        is_vice_captain = data.get(
            'is_vice_captain', instance.is_vice_captain if instance else False
        )

        if is_vice_captain and is_captain:
            raise serializers.ValidationError(
                'A player cannot be both captain and vice-captain.'
            )

        team_players = fantasy_team.team_players
        if instance:
            team_players = team_players.exclude(pk=instance.pk)

        if team_players.filter(player__team=player.team).count() >= 7:
            raise serializers.ValidationError(
                'No more than 7 players from the same team.'
            )
        if team_players.filter(player=player).exists():
            raise serializers.ValidationError(
                'Player already in the fantasy team.'
            )

        # Enforce exact 3-3-4-1 count check at 11th player insertion (10 existing + 1 new)
        if not instance and team_players.count() == 10:
            raw_roles = list(
                team_players.values_list('player__role', flat=True)
            )
            raw_roles.append(player.role)

            # Map raw role strings to your 4 exact required keys
            existing_roles = [normalize_role(r) for r in raw_roles]

            required_roles = {
                'Batsman': 3,
                'Bowler': 3,
                'All-Rounder': 4,
                'Wicket-Keeper': 1,
            }
            for role, min_count in required_roles.items():
                if existing_roles.count(role) < min_count:
                    raise serializers.ValidationError(
                        f'Team must have at least {min_count} {role}.'
                    )

        if not instance and team_players.count() >= 11:
            raise serializers.ValidationError(
                'Fantasy team cannot have more than 11 players.'
            )

        total_cost = (
            team_players.aggregate(total=Sum('player__credit_value'))['total']
            or 0
        )
        total_cost += player.credit_value
        if total_cost > fantasy_team.tournament.budget_cap:
            raise serializers.ValidationError(
                "Adding this player exceeds the team's budget."
            )

        return data


class LeagueSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = League
        fields = '__all__'
        read_only_fields = ['created_at', 'created_by', 'invite_code']

    def get_member_count(self, obj):
        return obj.members.count()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if not request or request.user != instance.created_by:
            data.pop('invite_code', None)
        return data

    def create(self, validated_data):
        if not validated_data.get('is_public', True):
            validated_data['invite_code'] = secrets.token_urlsafe(6)
        created_by = validated_data.pop('created_by', None)

        league = League.objects.create(
            **validated_data, created_by=created_by) if created_by else League.objects.create(**validated_data)

        try:
            from .models import LeagueMember
            if created_by:
                member = LeagueMember.objects.create(
                    user=created_by, league=league)
                try:
                    latest_team = Fantasy_Team.objects.filter(
                        user=created_by, tournament=league.tournament).order_by('-created_at').first()
                    if latest_team:
                        member.fantasy_team = latest_team
                        member.save()
                except Exception:
                    pass
            else:
                request = self.context.get('request')
                if request and getattr(request, 'user', None) and request.user.is_authenticated:
                    member = LeagueMember.objects.create(
                        user=request.user, league=league)
                    try:
                        latest_team = Fantasy_Team.objects.filter(
                            user=request.user, tournament=league.tournament).order_by('-created_at').first()
                        if latest_team:
                            member.fantasy_team = latest_team
                            member.save()
                    except Exception:
                        pass
        except Exception:
            pass

        return league


class LeagueMemberSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    team_name = serializers.CharField(source='user.team_name', read_only=True)
    points = serializers.SerializerMethodField()

    class Meta:
        model = LeagueMember
        fields = '__all__'
        read_only_fields = ['ranking', 'joined_at']

    def get_points(self, obj):
        # Sum total_points from ALL fantasy teams for this user in this league's tournament
        total = Fantasy_Team.objects.filter(
            user=obj.user,
            tournament=obj.league.tournament
        ).aggregate(total=Sum('total_points'))['total'] or 0
        return total


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['id', 'amount', 'type',
                            'status', 'created_at', 'user']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'


class GlobalLeaderboardSerializer(serializers.ModelSerializer):
    rank = serializers.IntegerField(read_only=True)
    total_fantasy_points = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    teams_played = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'rank', 'name', 'email',
                  'total_fantasy_points', 'teams_played']
