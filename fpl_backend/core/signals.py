from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Player_Match_Performance, Match, Fantasy_Team, Fantasy_Team_Player, LeagueMember


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

        for team in fantasy_teams:
            total_points = 0
            team_players = Fantasy_Team_Player.objects.filter(
                fantasy_team=team)

            for team_player in team_players:
                performances = Player_Match_Performance.objects.filter(
                    player=team_player.player, match=instance)
                for performance in performances:
                    points = performance.fantasy_points
                    if team_player.is_captain:
                        points *= 2
                    elif team_player.is_vice_captain:
                        points *= 1.5
                    total_points += points  # add here, not outside
            Fantasy_Team.objects.filter(pk=team.pk).update(
                total_points=total_points)

            LeagueMember.objects.filter(
                user=team.user,
                league__tournament=instance.tournament
            ).update(points=F('points') + total_points)

            # update rankings by ordering members by points
        members = LeagueMember.objects.filter(
            league__tournament=instance.tournament
        ).order_by('-points')

        for rank, member in enumerate(members, start=1):
            LeagueMember.objects.filter(
                pk=member.pk).update(ranking=rank)
