
from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status
from .models import (
    Player, Match, Sport, League, Tournament,
    Fantasy_Team, Fantasy_Team_Player,
    User, Cricket_Team, Player_Match_Performance, Transaction, LeagueMember, League
)


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
        response = self.client.post('/api/auth/register/', {
            'name': 'Test User',
            'email': 'test@test.com',
            'password': 'test123'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)

    def test_user_can_login(self):
        # first create a user
        User.objects.create_user(
            name='Test User',
            email='test@test.com',
            password='test123'
        )
        # then login
        response = self.client.post('/api/token/', {
            'email': 'test@test.com',
            'password': 'test123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
