# seed_data.py
import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import (
    Tournament, Cricket_Team, Player, Match, Player_Match_Performance,
    User, Fantasy_Team, Fantasy_Team_Player, League, LeagueMember
)

# Role string MUST match ROLE_LIMITS keys in your frontend's TeamContext.jsx exactly
ROLE_LIMITS = {'Wicket-Keeper': 1, 'Batsman': 4, 'Bowler': 4, 'All-Rounder': 2}
ROLES_FOR_NEW_PLAYERS = (
    ['Wicket-Keeper'] * 1 + ['Batsman'] * 4 +
    ['Bowler'] * 4 + ['All-Rounder'] * 2
)

FIRST_NAMES = ['Rohan', 'Bibek', 'Suman', 'Anil', 'Kiran', 'Prakash', 'Sandip',
               'Rajesh', 'Nabin', 'Sagar', 'Aayush', 'Manish', 'Dipesh', 'Saroj']
LAST_NAMES = ['Shrestha', 'Thapa', 'Gurung',
              'Rai', 'Tamang', 'Karki', 'Bhandari', 'Khadka']


class Command(BaseCommand):
    help = 'Seeds the database with extra matches, players, users, fantasy teams, performances, and a league'

    def handle(self, *args, **options):
        tournament = Tournament.objects.first()
        if not tournament:
            self.stdout.write(self.style.ERROR(
                'No tournament found — create one first.'))
            return

        teams = list(Cricket_Team.objects.filter(tournament=tournament))
        if len(teams) < 2:
            self.stdout.write(self.style.ERROR(
                'Need at least 2 cricket teams.'))
            return

        # ---- 1. Top up each team's roster ----
        for team in teams:
            existing_count = Player.objects.filter(team=team).count()
            needed = max(0, 16 - existing_count)
            for i in range(needed):
                role = ROLES_FOR_NEW_PLAYERS[i % len(ROLES_FOR_NEW_PLAYERS)]
                Player.objects.create(
                    team=team,
                    name=f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
                    role=role,
                    batting_style=random.choice(
                        ['Right-hand bat', 'Left-hand bat']),
                    bowling_style=random.choice(
                        ['Right-arm fast', 'Left-arm spin', 'Right-arm off-break', 'N/A']),
                    credit_value=round(random.uniform(6.0, 11.0), 1),
                    nationality='Nepal',
                )
        self.stdout.write(self.style.SUCCESS('Topped up player rosters.'))

        # ---- 2. Add more matches (mix of past/completed and one upcoming) ----
        now = timezone.now()
        new_matches = []
        for i, (home, away) in enumerate(zip(teams[::2], teams[1::2])):
            is_past = i < 3
            match_date = now - \
                timedelta(days=(3 - i) * 5) if is_past else now + \
                timedelta(days=(i + 1) * 5)
            match = Match.objects.create(
                tournament=tournament,
                home_team=home,
                away_team=away,
                match_date=match_date,
                venue=home.home_venue,
                status='completed' if is_past else 'upcoming',
                gameweek=i + 1,
                result=f"{home.short_name} won" if is_past else None,
            )
            new_matches.append((match, is_past))
        self.stdout.write(self.style.SUCCESS(
            f'Created {len(new_matches)} matches.'))

        # ---- 3. Generate Player_Match_Performance + fantasy_points for completed matches ----
        completed_matches = [m for m, is_past in new_matches if is_past]
        for match in completed_matches:
            squad = list(Player.objects.filter(
                team__in=[match.home_team, match.away_team]))
            for player in squad:
                runs = random.randint(0, 90)
                wickets = random.randint(0, 4) if player.role in (
                    'Bowler', 'All-Rounder') else 0
                catches = random.randint(0, 2)
                points = runs + wickets * 20 + catches * 8
                Player_Match_Performance.objects.create(
                    player=player,
                    match=match,
                    runs_scored=runs,
                    balls_faced=runs + random.randint(0, 20),
                    fours=random.randint(0, 6),
                    sixes=random.randint(0, 3),
                    wickets_taken=wickets,
                    catches=catches,
                    economy_rate=round(random.uniform(4.0, 9.0), 2),
                    strike_rate=round(random.uniform(80, 160), 2),
                    fantasy_points=points,
                )
        self.stdout.write(self.style.SUCCESS('Created match performances.'))

        # ---- 4. New users ----
        new_users = []
        for i in range(5):
            email = f'testuser{i+1}@example.com'
            user, created = User.objects.get_or_create(
                email=email, defaults={'name': f'Test User {i+1}'}
            )
            if created:
                user.set_password('testpass123')
                user.save()
            new_users.append(user)
        self.stdout.write(self.style.SUCCESS(
            f'Created/found {len(new_users)} users.'))

        # ---- 5. Premade fantasy teams for new users, on completed matches ----
        def build_valid_squad(match):
            pool = list(Player.objects.filter(
                team__in=[match.home_team, match.away_team]))
            random.shuffle(pool)
            squad, role_counts, team_counts, total_cost = [], {}, {}, 0
            for player in pool:
                if len(squad) >= 11:
                    break
                role_count = role_counts.get(player.role, 0)
                if role_count >= ROLE_LIMITS.get(player.role, 0):
                    continue
                team_count = team_counts.get(player.team_id, 0)
                if team_count >= 7:
                    continue
                if total_cost + float(player.credit_value) > float(tournament.budget_cap):
                    continue
                squad.append(player)
                role_counts[player.role] = role_count + 1
                team_counts[player.team_id] = team_count + 1
                total_cost += float(player.credit_value)
            return squad if len(squad) == 11 else None

        for user in new_users:
            for match in completed_matches[:2]:
                if Fantasy_Team.objects.filter(user=user, match=match).exists():
                    continue
                squad = build_valid_squad(match)
                if not squad:
                    continue

                captain, vice_captain = squad[0], squad[1]
                fantasy_team = Fantasy_Team.objects.create(
                    user=user,
                    tournament=tournament,
                    match=match,
                    name=f"{user.name}'s XI",
                    deadline=match.match_date,
                    # FIX: budget_cap is a Decimal, squad cost was summed as float —
                    # wrap budget_cap in float() too so both sides match before subtracting
                    remaining_budget=float(
                        tournament.budget_cap) - sum(float(p.credit_value) for p in squad),
                    captain=captain,
                    vice_captain=vice_captain,
                )

                match_total = 0
                for player in squad:
                    perf = Player_Match_Performance.objects.filter(
                        player=player, match=match).first()
                    base_points = perf.fantasy_points if perf else 0
                    is_cap = player.id == captain.id
                    is_vc = player.id == vice_captain.id
                    earned = base_points * \
                        2 if is_cap else (
                            base_points * 1.5 if is_vc else base_points)
                    earned = int(earned)
                    Fantasy_Team_Player.objects.create(
                        fantasy_team=fantasy_team,
                        player=player,
                        is_captain=is_cap,
                        is_vice_captain=is_vc,
                        points_earned=earned,
                    )
                    match_total += earned

                fantasy_team.total_points = match_total
                fantasy_team.save()

        self.stdout.write(self.style.SUCCESS(
            'Created fantasy teams + points for new users.'))

        # ---- 6. A league with the new users as members ----
        league, created = League.objects.get_or_create(
            tournament=tournament,
            name='Friends League',
            defaults={
                'created_by': new_users[0],
                'entry_fee': 0,
                'prize_pool': 0,
                'max_members': 20,
                'invite_code': 'TESTLG1',
            }
        )
        for user in new_users:
            ft = Fantasy_Team.objects.filter(user=user).first()
            LeagueMember.objects.get_or_create(
                league=league, user=user,
                defaults={'fantasy_team': ft,
                          'points': ft.total_points if ft else 0}
            )
        self.stdout.write(self.style.SUCCESS('Created league + members.'))

        self.stdout.write(self.style.SUCCESS('Seeding complete.'))
