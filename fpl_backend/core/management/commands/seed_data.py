
from django.core.management.base import BaseCommand
from core.models import Sport, Tournament, Cricket_Team, Player
from datetime import date


class Command(BaseCommand):
    help = 'Seed database with test data'

    def handle(self, *args, **kwargs):
        # Create Sport
        sport, _ = Sport.objects.get_or_create(name='Cricket')
        self.stdout.write('Created sport')

        # Create Tournament
        tournament, _ = Tournament.objects.get_or_create(
            name='Nepal Premier League',
            defaults={
                'sport': sport,
                'season': '2024',
                'start_date': date(2024, 9, 1),
                'end_date': date(2024, 9, 30),
                'status': 'upcoming',
                'max_players': 11,
                'squad_size': 15,
                'max_substitutions': 3,
                'max_foreign_players': 4,
                'budget_cap': 100.00,
            }
        )
        self.stdout.write('Created tournament')

        # Create Teams
        teams_data = [
            {'name': 'Kathmandu Kings', 'short_name': 'KK', 'home_venue': 'TU Ground'},
            {'name': 'Pokhara Rhinos', 'short_name': 'PR',
                'home_venue': 'Pokhara Stadium'},
            {'name': 'Chitwan Tigers', 'short_name': 'CT',
                'home_venue': 'Bharatpur Stadium'},
            {'name': 'Lalitpur Patriots', 'short_name': 'LP',
                'home_venue': 'Lalitpur Ground'},
        ]
        teams = []
        for t in teams_data:
            team, _ = Cricket_Team.objects.get_or_create(
                name=t['name'],
                defaults={
                    'tournament': tournament,
                    'short_name': t['short_name'],
                    'home_venue': t['home_venue'],
                }
            )
            teams.append(team)
        self.stdout.write('Created teams')

        # Create Players
        players_data = [
            {'name': 'Rohit Paudel', 'role': 'BAT', 'batting_style': 'Right',
                'bowling_style': 'None', 'credit_value': 10.5, 'nationality': 'Nepali'},
            {'name': 'Sandeep Lamichhane', 'role': 'BOWL', 'batting_style': 'Right',
                'bowling_style': 'Leg Spin', 'credit_value': 11.0, 'nationality': 'Nepali'},
            {'name': 'Kushal Bhurtel', 'role': 'BAT', 'batting_style': 'Right',
                'bowling_style': 'None', 'credit_value': 9.5, 'nationality': 'Nepali'},
            {'name': 'Dipendra Airee', 'role': 'ALL', 'batting_style': 'Right',
                'bowling_style': 'Off Spin', 'credit_value': 10.0, 'nationality': 'Nepali'},
            {'name': 'Aasif Sheikh', 'role': 'WK', 'batting_style': 'Left',
                'bowling_style': 'None', 'credit_value': 9.0, 'nationality': 'Nepali'},
            {'name': 'Aarif Sheikh', 'role': 'BAT', 'batting_style': 'Left',
                'bowling_style': 'None', 'credit_value': 8.5, 'nationality': 'Nepali'},
            {'name': 'Sompal Kami', 'role': 'BOWL', 'batting_style': 'Right',
                'bowling_style': 'Fast', 'credit_value': 9.0, 'nationality': 'Nepali'},
            {'name': 'Binod Bhandari', 'role': 'WK', 'batting_style': 'Right',
                'bowling_style': 'None', 'credit_value': 8.0, 'nationality': 'Nepali'},
        ]
        for i, p in enumerate(players_data):
            Player.objects.get_or_create(
                name=p['name'],
                defaults={
                    'team': teams[i % len(teams)],
                    'role': p['role'],
                    'batting_style': p['batting_style'],
                    'bowling_style': p['bowling_style'],
                    'credit_value': p['credit_value'],
                    'nationality': p['nationality'],
                }
            )
        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
