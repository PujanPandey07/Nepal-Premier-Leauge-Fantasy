from rest_framework import serializers
from .models import (
    Player, Match, Sport, League, Tournament,
    Fantasy_Team, Fantasy_Team_Player, LeagueMember,
    User, Cricket_Team, Player_Match_Performance, Transaction
)
import secrets


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


class FantasyTeamPlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fantasy_Team_Player
        fields = '__all__'
        read_only_fields = ['points_earned']

    def validate(self, data):
        if data['is_vice_captain'] and data['is_captain']:

            raise serializers.ValidationError(
                "A player cannot be both captain and vice-captain.")
        if data['fantasy_team'].team_players.filter(
            player__team=data['player'].team
        ).count() >= 7:
            raise serializers.ValidationError(
                "No more than 7 players from the same team.")
        if data['fantasy_team'].team_players.filter(player=data['player']).exists():
            raise serializers.ValidationError(
                "Player already in the fantasy team.")
        if data['fantasy_team'].team_players.count() >= 11:
            raise serializers.ValidationError(
                "Fantasy team cannot have more than 11 players.")
        if data['fantasy_team'].team_players.count() == 10:
            existing_roles = list(data['fantasy_team'].team_players.values_list(
                'player__role', flat=True
            ))
            existing_roles.append(data['player'].role)
            required_roles = {
                'Batsman': 4,
                'Bowler': 4,
                'All-Rounder': 2,
                'Wicket-Keeper': 1,
            }

            for role, min_count in required_roles.items():
                if existing_roles.count(role) < min_count:
                    raise serializers.ValidationError(
                        f"Team must have at least {min_count} {role}.")
               # this is the 11th player being added
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
