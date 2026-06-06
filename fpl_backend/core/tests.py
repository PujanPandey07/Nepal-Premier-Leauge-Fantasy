from datetime import timedelta
from decimal import Decimal
from django.utils import timezone

from rest_framework.test import APITestCase
from rest_framework import status
from .models import (
    Player, Match, Sport, League, Tournament,
    Fantasy_Team, Fantasy_Team_Player,
    User, Cricket_Team, Transaction, LeagueMember
)
from django.db.models import Sum


class SportTest(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='test123',
            name='Admin',
            is_staff=True
        )

    def test_anyone_can_list_sports(self):
        response = self.client.get('/api/sports/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_only_admin_can_create_sport(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/sports/', {
            'name': 'Cricket',
            'slug': 'cricket'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class UserAuthTest(APITestCase):

    def test_user_can_register(self):
        response = self.client.post('/api/auth/registration/', {
            'name': 'Test User',
            'email': 'test@test.com',
            'password1': 'TestPass123!',
            'password2': 'TestPass123!',
        })
        print(response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(User.objects.count(), 1)

    def test_user_can_login(self):
        User.objects.create_user(
            name='Test User',
            email='test@test.com',
            password='test123'
        )
        response = self.client.post('/api/token/', {
            'email': 'test@test.com',
            'password': 'test123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)


class FantasyTeamTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@test.com',
            password='test123',
            name='Test User'
        )
        self.sport = Sport.objects.create(
            name='Cricket',
            slug='cricket'
        )
        self.tournament = Tournament.objects.create(
            sport=self.sport,
            name='NPL 2024',
            season='2024',
            start_date='2024-01-01',
            end_date='2024-12-31',
            max_players=15,
            squad_size=11,
            max_substitutions=3,
            max_foreign_players=4,
            budget_cap=Decimal('100.00')
        )
        self.team1 = Cricket_Team.objects.create(
            tournament=self.tournament,
            name='Kathmandu Kings',
            short_name='KK',
            home_venue='TU Ground'
        )
        self.team2 = Cricket_Team.objects.create(
            tournament=self.tournament,
            name='Pokhara Rhinos',
            short_name='PR',
            home_venue='Pokhara Stadium'
        )
        self.match = Match.objects.create(
            tournament=self.tournament,
            home_team=self.team1,
            away_team=self.team2,
            match_date=timezone.now() + timedelta(hours=2),
            venue='TU Ground',
            gameweek=1
        )
        self.players_team1 = []
        roles = ['Batsman', 'Batsman', 'Batsman',
                 'Bowler', 'Bowler', 'Wicket-Keeper', 'Bowler']
        for i, role in enumerate(roles):
            player = Player.objects.create(
                team=self.team1,
                name=f'Player {i+1}',
                role=role,
                batting_style='Right',
                bowling_style='Right',
                credit_value=Decimal('8.0'),
                nationality='Nepali'
            )
            self.players_team1.append(player)

        self.players_team2 = []
        roles2 = ['Batsman', 'Bowler', 'Bowler', 'All-Rounder', 'All-Rounder']
        for i, role in enumerate(roles2):
            player = Player.objects.create(
                team=self.team2,
                name=f'Player {i+7}',
                role=role,
                batting_style='Right',
                bowling_style='Right',
                credit_value=Decimal('8.0'),
                nationality='Nepali'
            )
            self.players_team2.append(player)

    def test_authenticated_user_can_create_fantasy_team(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/fantasy-teams/', {
            'name': 'My Team',
            'tournament': self.tournament.id,
            'match': self.match.id,
            'deadline': timezone.now() + timedelta(hours=1),
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_cannot_add_more_than_7_players_from_same_team(self):
        self.client.force_authenticate(user=self.user)
        fantasy_team = Fantasy_Team.objects.create(
            name='My Team',
            tournament=self.tournament,
            match=self.match,
            deadline=timezone.now() + timedelta(hours=1),
            user=self.user
        )
        for player in self.players_team1:
            Fantasy_Team_Player.objects.create(
                fantasy_team=fantasy_team, player=player)

        new_player = Player.objects.create(
            team=self.team1,
            name='Player 7',
            role='Batsman',
            batting_style='Right',
            bowling_style='Right',
            credit_value=Decimal('8.0'),
            nationality='Nepali'
        )
        response = self.client.post(
            f'/api/fantasy-team-players/', {
                'fantasy_team': fantasy_team.id,
                'player': new_player.id
            })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No more than 7 players', str(response.data))

    def test_cannot_exceed_budget_cap(self):
        self.client.force_authenticate(user=self.user)
        fantasy_team = Fantasy_Team.objects.create(
            name='My Team',
            tournament=self.tournament,
            match=self.match,
            deadline=timezone.now() + timedelta(hours=1),
            user=self.user
        )
        expensive_player = Player.objects.create(
            team=self.team1,
            name='Expensive Player',
            role='Batsman',
            batting_style='Right',
            bowling_style='Right',
            credit_value=Decimal('200.0'),
            nationality='Nepali'
        )
        response = self.client.post(
            f'/api/fantasy-team-players/', {
                'fantasy_team': fantasy_team.id,
                'player': expensive_player.id
            })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('budget', str(response.data).lower())

    def test_cannot_create_team_after_deadline(self):
        self.client.force_authenticate(user=self.user)
        self.match.match_date = timezone.now() - timedelta(hours=2)
        self.match.save()
        response = self.client.post('/api/fantasy-teams/', {
            'name': 'My Team',
            'tournament': self.tournament.id,
            'match': self.match.id,
            'deadline': timezone.now() - timedelta(hours=1),
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LeagueTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@test.com',
            password='test123',
            name='Test User'
        )
        self.sport = Sport.objects.create(
            name='Cricket',
            slug='cricket'
        )
        self.tournament = Tournament.objects.create(
            sport=self.sport,
            name='NPL 2024',
            season='2024',
            start_date='2024-01-01',
            end_date='2024-12-31',
            max_players=15,
            squad_size=11,
            max_substitutions=3,
            max_foreign_players=4,
            budget_cap=Decimal('100.00')
        )
        self.league = League.objects.create(
            tournament=self.tournament,
            created_by=self.user,
            name='Test League',
            entry_fee=Decimal('0.00'),
            prize_pool=Decimal('0.00'),
            max_members=10,
            invite_code='TEST123'
        )

    def test_user_can_join_league(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/leagues/join/', {
            'invite_code': 'TEST123'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(LeagueMember.objects.count(), 1)

    def test_user_cannot_join_league_twice(self):
        self.client.force_authenticate(user=self.user)
        self.client.post('/api/leagues/join/', {
            'invite_code': 'TEST123'
        })
        response = self.client.post('/api/leagues/join/', {
            'invite_code': 'TEST123'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_join_full_league(self):
        self.league.max_members = 1
        self.league.save()
        user2 = User.objects.create_user(
            email='user2@test.com',
            password='test123',
            name='User 2'
        )
        self.client.force_authenticate(user=self.user)
        self.client.post('/api/leagues/join/', {
            'invite_code': 'TEST123'
        })
        self.client.force_authenticate(user=user2)
        response = self.client.post('/api/leagues/join/', {
            'invite_code': 'TEST123'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('full', str(response.data).lower())
