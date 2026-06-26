from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers
from .models import (
    Player, Match, Sport, League, Tournament,
    Fantasy_Team, Fantasy_Team_Player, LeagueMember,
    User, Cricket_Team, Player_Match_Performance, Transaction
)
import secrets
from django.db.models import Sum


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
    class Meta:
        model = Match
        fields = '__all__'
        read_only_fields = ['result']


class PlayerMatchPerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player_Match_Performance
        fields = '__all__'
        read_only_fields = ['fantasy_points']


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'profile_picture']


class UserPrivateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'phone_no',
                  'profile_picture', 'wallet_balance',
                  'is_verified', 'created_at']
        read_only_fields = ['id', 'wallet_balance',
                            'is_verified', 'created_at']


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


class FantasyTeamPlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fantasy_Team_Player
        fields = '__all__'
        read_only_fields = ['points_earned']

        def validate(self, data):
            instance = self.instance  # None when creating a new row, the existing row when updating

            fantasy_team = data.get(
                'fantasy_team', instance.fantasy_team if instance else None)
            player = data.get('player', instance.player if instance else None)
            is_captain = data.get(
                'is_captain', instance.is_captain if instance else False)
            is_vice_captain = data.get(
                'is_vice_captain', instance.is_vice_captain if instance else False)

            if is_vice_captain and is_captain:
                raise serializers.ValidationError(
                    "A player cannot be both captain and vice-captain.")

            team_players = fantasy_team.team_players
            if instance:
                # don't compare the row against itself
                team_players = team_players.exclude(pk=instance.pk)

            if team_players.filter(player__team=player.team).count() >= 7:
                raise serializers.ValidationError(
                    "No more than 7 players from the same team.")
            if team_players.filter(player=player).exists():
                raise serializers.ValidationError(
                    "Player already in the fantasy team.")

            if not instance and team_players.count() == 10:
                existing_roles = list(
                    team_players.values_list('player__role', flat=True))
                existing_roles.append(player.role)
                required_roles = {'Batsman': 4, 'Bowler': 4,
                                  'All-Rounder': 2, 'Wicket-Keeper': 1}
                for role, min_count in required_roles.items():
                    if existing_roles.count(role) < min_count:
                        raise serializers.ValidationError(
                            f"Team must have at least {min_count} {role}.")

            if not instance and team_players.count() >= 11:
                raise serializers.ValidationError(
                    "Fantasy team cannot have more than 11 players.")

            total_cost = team_players.aggregate(
                total=Sum('player__credit_value'))['total'] or 0
            total_cost += player.credit_value
            if total_cost > fantasy_team.tournament.budget_cap:
                raise serializers.ValidationError(
                    "Adding this player exceeds the team's budget.")

            return data


class LeagueSerializer(serializers.ModelSerializer):
    class Meta:
        model = League
        fields = '__all__'
        read_only_fields = ['created_at', 'created_by', 'invite_code']

    def create(self, validated_data):
        validated_data['invite_code'] = secrets.token_urlsafe(6)
        return League.objects.create(**validated_data)


class LeagueMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeagueMember
        fields = '__all__'
        read_only_fields = ['ranking', 'points', 'joined_at']


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['id', 'amount', 'type',
                            'status', 'created_at', 'user']


class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['name', 'email', 'phone_no', 'password']
        extra_kwargs = {'password': {'write_only': True},
                        'phone_no': {'required': False}}

    def create(self, validated_data):
        user = User.objects.create_user(
            name=validated_data['name'],
            email=validated_data['email'],
            phone_no=validated_data.get('phone_no'),
            password=validated_data['password']
        )
        return user


class CustomRegisterSerializer(RegisterSerializer):
    name = serializers.CharField(required=True)
    username = None  # remove username field

    def get_cleaned_data(self):
        data = super().get_cleaned_data()
        data['name'] = self.validated_data.get('name', '')
        return data

    def save(self, request):
        user = super().save(request)
        user.name = self.cleaned_data.get('name')
        user.save()
        return user
