import json
import os
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
# Adjust import path if needed
from core.models import Cricket_Team, Player, Tournament

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

        # Fallback tournament if new team needs to be created
        default_tournament = Tournament.objects.first()

        for team_entry in teams_data:
            raw_team_name = team_entry.get('team_name', '').strip()

            if not raw_team_name:
                continue

            # Get existing team or create it on the fly to prevent skipping players
            team, team_created = Cricket_Team.objects.get_or_create(
                name__iexact=raw_team_name,
                defaults={
                    'name': raw_team_name,
                    'short_name': raw_team_name[:3].upper(),
                    'tournament': default_tournament,
                    'home_venue': 'TBD'
                }
            )

            if team_created:
                self.stdout.write(self.style.SUCCESS(
                    f"Created missing Cricket_Team: '{team.name}'"))

            for p_data in team_entry.get('players', []):
                name = p_data.get('name', '').strip()
                cricbuzz_id_raw = p_data.get('cricbuzz_id')

                # Filter out headers and missing cricbuzz IDs
                if not cricbuzz_id_raw or name.upper() in CATEGORY_HEADERS:
                    continue

                cricbuzz_id = int(cricbuzz_id_raw)
                image_id = p_data.get('image_id')
                image_url = f"https://static.cricbuzz.com/a/img/v1/i1/c{image_id}/i.jpg" if image_id else None

                # Idempotent save: Updates existing player by cricbuzz_id or creates a new one
                player, created = Player.objects.update_or_create(
                    cricbuzz_id=cricbuzz_id,
                    defaults={
                        'team': team,  # Assures team FK is explicitly set
                        'name': name,
                        'role': p_data.get('role') or 'Player',
                        'batting_style': p_data.get('batting_style', ''),
                        'bowling_style': p_data.get('bowling_style', ''),
                        'credit_value': 8.50,
                        'nationality': p_data.get('nationality') or 'Nepal',
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
