from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
import random

from core.models import User, Fantasy_Team, League, LeagueMember


class Command(BaseCommand):
    help = 'Seed synthetic users and league members for testing (10 members per league)'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=2,
                            help='Number of leagues to seed (default: 2)')

    @transaction.atomic
    def handle(self, *args, **options):
        limit = options['limit']
        leagues = list(League.objects.all()[:limit])
        if not leagues:
            self.stdout.write(self.style.ERROR('No leagues found to seed'))
            return

        for league in leagues:
            self.stdout.write(f"Seeding league: {league.name} ({league.id})")
            tournament = league.tournament
            existing = LeagueMember.objects.filter(league=league).count()
            to_create = max(0, 10 - existing)
            created = 0

            for i in range(to_create):
                name = f"AutoUser{random.randint(1000,9999)}"
                email = f"{name.lower()}@example.local"
                user, _ = User.objects.get_or_create(email=email, defaults={
                    'name': name,
                    'team_name': f"Team {name}",
                })

                # ensure user has a fantasy team for this tournament
                ft, _ = Fantasy_Team.objects.get_or_create(
                    user=user,
                    tournament=tournament,
                    defaults={
                        'name': f"{user.name}'s Team",
                        'deadline': timezone.now(),
                        'remaining_budget': tournament.budget_cap,
                    }
                )

                # assign random points to team and member
                points = random.randint(0, 300)
                ft.total_points = points
                ft.save()

                lm, created_flag = LeagueMember.objects.get_or_create(
                    league=league,
                    user=user,
                    defaults={
                        'fantasy_team': ft,
                        'joined_at': timezone.now(),
                        'points': points,
                    }
                )
                if not created_flag:
                    lm.fantasy_team = ft
                    lm.points = points
                    lm.joined_at = timezone.now()
                    lm.save()

                created += 1

            # Recompute rankings for this league
            members = LeagueMember.objects.filter(
                league=league).order_by('-points')
            for rank, member in enumerate(members, start=1):
                member.ranking = rank
                member.save()

            self.stdout.write(self.style.SUCCESS(
                f"Added/updated {created} members for league {league.name}"))

        self.stdout.write(self.style.SUCCESS('Seeding complete'))
