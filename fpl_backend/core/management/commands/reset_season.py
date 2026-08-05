from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import (
    Match, Innings, Player_Match_Performance,
    Fantasy_Team, Fantasy_Team_Player, League, Tournament,
)


class Command(BaseCommand):
    help = "Reset the NPL replay season: clears all fantasy teams/points/performances/leagues and re-shifts the match schedule to start today, back at gameweek 1."

    def handle(self, *args, **options):
        Fantasy_Team_Player.objects.all().delete()
        Fantasy_Team.objects.all().delete()
        Player_Match_Performance.objects.all().delete()
        Innings.objects.all().delete()
        League.objects.all().delete()  # cascades and deletes LeagueMember rows too

        tournament = Tournament.objects.get(
            name="Nepal Premier League", season="2025")
        matches = Match.objects.filter(
            tournament=tournament).order_by('gameweek')

        if not matches.exists():
            self.stdout.write(self.style.WARNING(
                "No matches found for this tournament."))
            return

        original_start = matches.first().match_date
        new_start = timezone.now()

        for match in matches:
            offset = match.match_date - original_start
            match.match_date = new_start + offset
            match.status = 'upcoming'
            match.result = None
            match.save()

        self.stdout.write(self.style.SUCCESS(
            f"Reset {matches.count()} matches to 'upcoming', schedule restarted at {new_start}. "
            f"All fantasy teams, performances, innings, and leagues cleared."
        ))
