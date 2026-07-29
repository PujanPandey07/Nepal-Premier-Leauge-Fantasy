import requests
from .models import Match, Innings, Cricket_Team, Player, Player_Match_Performance
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
from celery import shared_task
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from .models import Match, Fantasy_Team
import os
from dotenv import load_dotenv

load_dotenv()
User = get_user_model()


@shared_task
def send_welcome_email(user_id):
    user = User.objects.get(id=user_id)
    send_mail(
        subject='Welcome to NPL Fantasy!',
        message=f'Hi {user.name}, welcome to NPL Fantasy!,WE are excited to have you on board.Please let us know if you have any questions or need assistance getting started.',
        from_email='arghakhanchipujan@gmail.com',
        recipient_list=[user.email],
    )


@shared_task
def send_match_reminder(match_id):
    match = Match.objects.get(id=match_id)
    teams = Fantasy_Team.objects.filter(match=match).select_related('user')
    for team in teams:
        user = team.user
        send_mail(
            subject='Match Reminder: Your Fantasy Team is Ready!',
            message=f'Hi {user.name}, just a reminder that the match {match.home_team} vs {match.away_team} is starting soon! Your fantasy team is ready, so make sure to check your lineup and make any last-minute adjustments before the match begins. Good luck!',
            from_email='arghakhanchipujan@gmail.com',
            recipient_list=[user.email],
        )


@shared_task
def send_points_updated_notification(match_id):
    match = Match.objects.get(id=match_id)
    teams = Fantasy_Team.objects.filter(
        match=match
    ).select_related('user')

    for team in teams:
        send_mail(
            subject='Points Updated: Your Fantasy Team Performance',
            message=f'Hi {team.user.name}, your fantasy team {team.name} has earned {team.total_points} points in the recent match!',
            from_email='arghakhanchipujan@gmail.com',
            recipient_list=[team.user.email],
        )
# tasks.py


CRICBUZZ_HEADERS = {
    "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
    "x-rapidapi-key": os.getenv('Cricbuzz_API_KEY'),
}


def _write_innings(match, innings_data, innings_number, is_complete):
    batting_team = Cricket_Team.objects.get(name=innings_data['batteamname'])

    innings, _ = Innings.objects.update_or_create(
        match=match, innings_number=innings_number,
        defaults={
            'batting_team': batting_team,
            'total_runs': innings_data['score'],
            'total_wickets': innings_data['wickets'],
            'overs': innings_data['overs'],
            'extras': innings_data['extras']['total'],
            'is_complete': is_complete,
        }
    )

    # merge batting + bowling stats per player — an all-rounder appears in
    # both lists for the same innings, and should end up as one row, not two
    stats_by_cricbuzz_id = {}
    for b in innings_data.get('batsman', []):
        stats_by_cricbuzz_id.setdefault(int(b['id']), {}).update({
            'runs_scored': b['runs'], 'balls_faced': b['balls'],
            'fours': b['fours'], 'sixes': b['sixes'],
            'strike_rate': Decimal(str(b['strkrate'] or 0)),
            'how_out': b.get('outdec')
        })
    for bl in innings_data.get('bowler', []):
        stats_by_cricbuzz_id.setdefault(int(bl['id']), {}).update({
            'wickets_taken': bl['wickets'],
            'overs_bowled': Decimal(str(bl.get('overs') or 0)),
            'economy_rate': Decimal(str(bl['economy'] or 0)),
            'maidens': bl['maidens'],
        })

    for cricbuzz_id, stats in stats_by_cricbuzz_id.items():
        try:
            player = Player.objects.get(cricbuzz_id=cricbuzz_id)
        except Player.DoesNotExist:
            continue  # don't let one unmatched player crash the whole poll
        Player_Match_Performance.objects.update_or_create(
            player=player, match=match, innings=innings, defaults=stats,
        )


@shared_task
def ingest_live_npl_matches():
    now = timezone.now()
    matches = Match.objects.filter(
        tournament__name="Nepal Premier League",
        status__in=['upcoming', 'live'],
        match_date__lte=now,
    )

    for match in matches:
        if match.status == 'upcoming':
            Match.objects.filter(pk=match.pk).update(status='live')

        resp = requests.get(
            f"https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/{match.cricbuzz_match_id}/scard",
            headers=CRICBUZZ_HEADERS,
        )
        data = resp.json()
        scorecard = data.get('scorecard', [])
        match_complete = data.get('ismatchcomplete', False)

        if len(scorecard) < 1:
            continue  # match hasn't actually started yet on Cricbuzz's side

        # innings 1 is complete the instant innings 2 exists, or the whole match is done
        innings_1_complete = len(scorecard) >= 2 or match_complete
        _write_innings(
            match, scorecard[0], innings_number=1, is_complete=innings_1_complete)

        if len(scorecard) >= 2:
            _write_innings(
                match, scorecard[1], innings_number=2, is_complete=match_complete)

        if match_complete:
            Match.objects.filter(pk=match.pk).update(status='completed')
