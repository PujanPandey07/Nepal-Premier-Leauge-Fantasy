from django.core.management.base import BaseCommand
from django.db.models import Sum

from core.models import Fantasy_Team, Fantasy_Team_Player, Match, Player_Match_Performance


class Command(BaseCommand):
    help = 'Backfill Fantasy_Team_Player.points_earned and Fantasy_Team.total_points from completed match performances.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--match-id',
            dest='match_id',
            help='Optional match UUID to backfill only one match.',
        )

    def handle(self, *args, **options):
        match_id = options.get('match_id')

        matches = Match.objects.filter(
            status='completed').order_by('match_date')
        if match_id:
            matches = matches.filter(pk=match_id)

        if not matches.exists():
            self.stdout.write(self.style.WARNING(
                'No completed matches found to backfill.'))
            return

        updated_matches = 0
        updated_teams = 0

        for match in matches:
            player_points = {
                row['player']: row['total_points'] or 0
                for row in Player_Match_Performance.objects.filter(
                    match=match,
                    innings__is_complete=True,
                ).values('player').annotate(total_points=Sum('fantasy_points'))
            }

            fantasy_teams = Fantasy_Team.objects.filter(
                match=match).prefetch_related('team_players')
            if not fantasy_teams.exists():
                continue

            for team in fantasy_teams:
                total_points = 0
                for team_player in team.team_players.all():
                    base_points = int(player_points.get(
                        team_player.player_id, 0) or 0)
                    Fantasy_Team_Player.objects.filter(
                        pk=team_player.pk).update(points_earned=base_points)

                    if team_player.is_captain:
                        total_points += base_points * 2
                    elif team_player.is_vice_captain:
                        total_points += base_points * 1.5
                    else:
                        total_points += base_points

                Fantasy_Team.objects.filter(pk=team.pk).update(
                    total_points=total_points)
                updated_teams += 1

            updated_matches += 1
            self.stdout.write(self.style.SUCCESS(
                f'Backfilled match {match.id} ({match.home_team} vs {match.away_team})'))

        self.stdout.write(self.style.SUCCESS(
            f'Backfill complete. Matches processed: {updated_matches}, teams updated: {updated_teams}'
        ))
