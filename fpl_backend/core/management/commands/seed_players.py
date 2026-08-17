import json
import os
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
# Adjust 'your_app' to your Django app name
from your_app.models import Cricket_Team, Player

CATEGORY_HEADERS = {"BATTERS", "ALL ROUNDERS",
                    "WICKET KEEPERS", "BOWLERS", "OTHERS"}


class Command(BaseCommand):
    help = "Seeds Player model from NPL JSON player data."

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='all_npl_players.json',
            help='Path to the players JSON file'
        )

    @transaction.atomic
    def handle(self, *args, **options):
        json_path = options['file']

        if not os.path.exists(json_path):
            raise CommandError(f"File not found: {json_path}")

        with open(json_path, 'r', encoding='utf-8') as f:
            teams_data = json.load(f)

        total_created = 0
        total_updated = 0

        for team_entry in teams_data:
            team_name = team_entry['team_name']

            try:
                team = Cricket_Team.objects.get(name__iexact=team_name.strip())
            except Cricket_Team.DoesNotExist:
                self.stdout.write(self.style.WARNING(
                    f"Team '{team_name}' not found in database. Skipping..."))
                continue

            for p_data in team_entry.get('players', []):
                # Filter out section headers and invalid entries
                name = p_data.get('name', '').strip()
                cricbuzz_id_raw = p_data.get('cricbuzz_id')

                if not cricbuzz_id_raw or name in CATEGORY_HEADERS:
                    continue

                cricbuzz_id = int(cricbuzz_id_raw)
                image_id = p_data.get('image_id')
                image_url = f"https://static.cricbuzz.com/a/img/v1/i1/c{image_id}/i.jpg" if image_id else None

                player, created = Player.objects.update_or_create(
                    cricbuzz_id=cricbuzz_id,
                    defaults={
                        'team': team,
                        'name': name,
                        'role': p_data.get('role') or 'Player',
                        'batting_style': p_data.get('batting_style', ''),
                        'bowling_style': p_data.get('bowling_style', ''),
                        'credit_value': 8.50,  # Default fantasy credit rating
                        'nationality': 'Nepal',  # Default baseline nationality
                        'image_url': image_url,
                        'is_available': True,
                    }
                )

                if created:
                    total_created += 1
                else:
                    total_updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Player seeding completed successfully! "
                f"Created: {total_created}, Updated: {total_updated}"
            )
        )
