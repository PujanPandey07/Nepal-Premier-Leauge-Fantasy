from allauth.socialaccount.signals import social_account_added, pre_social_login
from allauth.account.signals import user_signed_up
from .tasks import send_welcome_email
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from .models import League, Player_Match_Performance, Match, Fantasy_Team, Fantasy_Team_Player, LeagueMember, User, Transaction, Innings
from django.db.models import F, Sum
from core import models
from decimal import Decimal
from .tasks import send_points_updated_notification


def _refresh_team_player_points(match):
    # If the match is completed, include all innings for that match
    # (some ingestion flows may not mark every Innings.is_complete correctly
    # at the exact same time the match status flips). For non-completed
    # matches only include performances tied to completed innings.
    perf_qs = Player_Match_Performance.objects.filter(match=match)
    if match.status != 'completed':
        perf_qs = perf_qs.filter(innings__is_complete=True)

    player_points = {
        row['player']: row['total_points'] or 0
        for row in perf_qs.values('player').annotate(total_points=Sum('fantasy_points'))
    }

    fantasy_teams = Fantasy_Team.objects.filter(
        match=match).prefetch_related('team_players')

    for team in fantasy_teams:
        total_points = 0
        for team_player in team.team_players.all():
            base_points = player_points.get(team_player.player_id, 0)
            Fantasy_Team_Player.objects.filter(pk=team_player.pk).update(
                points_earned=base_points
            )

            if team_player.is_captain:
                total_points += base_points * 2
            elif team_player.is_vice_captain:
                total_points += base_points * 1.5
            else:
                total_points += base_points

        Fantasy_Team.objects.filter(pk=team.pk).update(
            total_points=total_points)


@receiver(post_save, sender=Player_Match_Performance)
def calculate_fantasy_points(sender, instance, **kwargs):
    points = 0
    point_per_run = 2
    point_per_wicket = 25
    point_per_catch = 10
    point_per_stumping = 15
    point_per_run_out = 10
    point_per_maidens = 10
    point_per_4 = 3
    point_per_6 = 5
    if instance.strike_rate > 200:
        points += 10
    if instance.economy_rate < 6:
        points += 10
    if instance.runs_scored >= 50:
        points += 20
    if instance.runs_scored >= 100:
        points += 50
    if instance.wickets_taken >= 3:
        points += 20
    if instance.wickets_taken >= 5:
        points += 50
    if instance.catches >= 3:
        points += 15
    if instance.stumpings >= 3:
        points += 15
    if instance.run_outs >= 2:
        points += 15
    points += instance.runs_scored * point_per_run
    points += instance.wickets_taken * point_per_wicket
    points += instance.catches * point_per_catch
    points += instance.stumpings * point_per_stumping
    points += instance.run_outs * point_per_run_out
    points += instance.maidens * point_per_maidens
    points += instance.fours * point_per_4
    points += instance.sixes * point_per_6

    Player_Match_Performance.objects.filter(
        pk=instance.pk).update(fantasy_points=points)


@receiver(post_save, sender=Match)
def update_league_rankings(sender, instance, **kwargs):
    if instance.status == 'completed':
        fantasy_teams = Fantasy_Team.objects.filter(
            tournament=instance.tournament)

        _refresh_team_player_points(instance)

        for team in fantasy_teams:
            total_points = 0
            team_players = Fantasy_Team_Player.objects.filter(
                fantasy_team=team)

            for team_player in team_players:
                points = team_player.points_earned or 0
                if team_player.is_captain:
                    points *= 2
                elif team_player.is_vice_captain:
                    points *= 1.5
                total_points += points  # add here, not outside
            Fantasy_Team.objects.filter(pk=team.pk).update(
                total_points=total_points)

            # Only add points for league members who had joined the league
            # before this match started. This ensures a member's points reflect
            # only matches that occurred after they joined.
            LeagueMember.objects.filter(
                user=team.user,
                league__tournament=instance.tournament,
                joined_at__lte=instance.match_date
            ).update(points=F('points') + total_points)

        # Rank members WITHIN each league separately — ranking is a
        # per-league standing, not a position in the whole tournament's
        # combined member pool across every league.
        leagues = League.objects.filter(tournament=instance.tournament)
        for league in leagues:
            league_members = LeagueMember.objects.filter(
                league=league
            ).order_by('-points')

            for rank, member in enumerate(league_members, start=1):
                LeagueMember.objects.filter(
                    pk=member.pk).update(ranking=rank)

        total_matches = Match.objects.filter(
            tournament=instance.tournament).count()

        completed_matches = Match.objects.filter(
            tournament=instance.tournament, status='completed').count()

        if completed_matches == total_matches:
            # NOW distribute prizes
            for league in League.objects.filter(tournament=instance.tournament):
                winner = LeagueMember.objects.filter(
                    league=league, ranking=1).first()
                if winner:
                    # Avoid double-crediting: make this payout idempotent by
                    # attaching a predictable reference_id and skipping if
                    # an identical payout transaction already exists.
                    ref = f"league_{league.id}_tournament_{instance.tournament.id}_match_{instance.id}"
                    exists = Transaction.objects.filter(
                        user=winner.user,
                        amount=league.prize_pool,
                        type='credit',
                        payment_method='wallet',
                        reference_id=ref,
                    ).exists()
                if not exists:
                    User.objects.filter(pk=winner.user.pk).update(
                        wallet_balance=F('wallet_balance') + league.prize_pool
                    )
                    Transaction.objects.create(
                        user=winner.user,
                        amount=league.prize_pool,
                        type='credit',
                        status='completed',
                        payment_method='wallet',
                        reference_id=ref,
                    )
        send_points_updated_notification.delay(instance.id)


@receiver(post_save, sender=Fantasy_Team_Player)
@receiver(post_delete, sender=Fantasy_Team_Player)
def update_fantasy_team_budget(sender, instance, **kwargs):
    team = instance.fantasy_team
    total_cost = team.team_players.aggregate(
        total=Sum('player__credit_value'))['total'] or Decimal('0')

    Fantasy_Team.objects.filter(pk=team.pk).update(
        remaining_budget=team.tournament.budget_cap - total_cost)


@receiver(user_signed_up)
def on_user_signed_up(request, user, **kwargs):
    send_welcome_email.delay(user.id)


@receiver(pre_social_login)
def populate_user_from_google(sender, request, sociallogin, **kwargs):
    user = sociallogin.user
    extra_data = sociallogin.account.extra_data
    if not user.email:
        user.email = extra_data.get(
            'email', '') or extra_data.get('verified_email', '')
    if not user.name:
        user.name = extra_data.get(
            'name', '') or extra_data.get('given_name', '')
        # Don't call user.save() here — allauth will handle saving the user.
        # Calling save() at this point causes an INSERT instead of UPDATE
        # for existing users, hitting the unique email constraint.


@receiver(post_save, sender=Innings)
def update_fantasy_points_after_innings(sender, instance, created, **kwargs):
    if not instance.is_complete:
        return  # only recalc once this innings is actually done

    match = instance.match
    _refresh_team_player_points(match)
