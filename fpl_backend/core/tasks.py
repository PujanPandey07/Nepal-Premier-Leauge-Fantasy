import requests
from .models import Match, Innings, Cricket_Team, Player, Player_Match_Performance
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
from celery import shared_task
from django.core.mail import send_mail
from django.core.cache import cache
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Match, Fantasy_Team
import os
from dotenv import load_dotenv

load_dotenv()
User = get_user_model()


@shared_task
def send_welcome_email(user_id):
    """Sent immediately after signup (both custom and social)."""
    try:
        user = User.objects.get(id=user_id)
        send_mail(
            subject='Welcome to NPL Fantasy!',
            message=(
                f'Hi {user.name},\n\n'
                'Welcome to NPL Fantasy! We are excited to have you on board.\n\n'
                'If you signed up with email, please verify your account to start building your dream team.\n\n'
                'Good luck!'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
    except User.DoesNotExist:
        pass


@shared_task
def send_match_reminder(match_id):
    """Send once per match. Deduplicated via cache."""
    cache_key = f'match_reminder_sent:{match_id}'
    if cache.get(cache_key):
        return

    try:
        match = Match.objects.get(id=match_id)
    except Match.DoesNotExist:
        return

    teams = Fantasy_Team.objects.filter(match=match).select_related('user')
    recipient_list = list(set(
        team.user.email for team in teams if team.user.email
    ))

    if recipient_list:
        send_mail(
            subject=f'Match Reminder: {match.home_team} vs {match.away_team}',
            message=(
                f'Hi,\n\n'
                f'Just a reminder that {match.home_team} vs {match.away_team} is starting soon!\n'
                f'Make sure to check your lineup before the deadline.\n\n'
                f'Good luck!'
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
        )

    cache.set(cache_key, True, timeout=60 * 60 * 24 * 2)  # 2 days


@shared_task
def send_points_updated_notification(match_id):
    """Send once per match after points are finalized."""
    cache_key = f'points_notification_sent:{match_id}'
    if cache.get(cache_key):
        return

    try:
        match = Match.objects.get(id=match_id)
    except Match.DoesNotExist:
        return

    teams = Fantasy_Team.objects.filter(
        match=match
    ).select_related('user')

    for team in teams:
        if team.user.email:
            send_mail(
                subject='Points Updated: Check Your Team!',
                message=(
                    f'Hi {team.user.name},\n\n'
                    f'Your fantasy team "{team.name}" earned {team.total_points} points '
                    f'in the match between {match.home_team} and {match.away_team}.\n\n'
                    f'Check the leaderboard to see where you stand!'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[team.user.email],
            )

    cache.set(cache_key, True, timeout=60 * 60 * 24 * 2)


CRICBUZZ_HEADERS = {
    "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com",
    "x-rapidapi-key": os.getenv('Cricbuzz_API_KEY'),
}


def _write_innings(match, innings_data, innings_number, is_complete):
    """Robust innings writer with fuzzy team name matching."""
    team_name = innings_data.get('batteamname', '')

    try:
        batting_team = Cricket_Team.objects.get(name__iexact=team_name.strip())
    except Cricket_Team.DoesNotExist:
        # Fuzzy fallback: try matching on first word or short name
        name_parts = team_name.strip().split()
        first_word = name_parts[0] if name_parts else ''
        batting_team = Cricket_Team.objects.filter(
            Q(name__icontains=first_word) |
            Q(short_name__iexact=team_name[:3].strip())
        ).first()

        if not batting_team:
            print(
                f"[INGEST] Could not find team: '{team_name}' — skipping innings {innings_number}")
            return

    innings, _ = Innings.objects.update_or_create(
        match=match, innings_number=innings_number,
        defaults={
            'batting_team': batting_team,
            'total_runs': innings_data.get('score', 0),
            'total_wickets': innings_data.get('wickets', 0),
            'overs': innings_data.get('overs', 0),
            'extras': innings_data.get('extras', {}).get('total', 0),
        }
    )

    stats_by_cricbuzz_id = {}
    for b in innings_data.get('batsman', []):
        stats_by_cricbuzz_id.setdefault(int(b['id']), {}).update({
            'runs_scored': b.get('runs', 0),
            'balls_faced': b.get('balls', 0),
            'fours': b.get('fours', 0),
            'sixes': b.get('sixes', 0),
            'strike_rate': Decimal(str(b.get('strkrate') or 0)),
        })
    for bl in innings_data.get('bowler', []):
        stats_by_cricbuzz_id.setdefault(int(bl['id']), {}).update({
            'wickets_taken': bl.get('wickets', 0),
            'economy_rate': Decimal(str(bl.get('economy') or 0)),
            'maidens': bl.get('maidens', 0),
        })

    for cricbuzz_id, stats in stats_by_cricbuzz_id.items():
        try:
            player = Player.objects.get(cricbuzz_id=cricbuzz_id)
        except Player.DoesNotExist:
            continue
        Player_Match_Performance.objects.update_or_create(
            player=player, match=match, innings=innings, defaults=stats,
        )

    if is_complete:
        innings.is_complete = True
        innings.save()


@shared_task
def ingest_live_npl_matches():
    if not os.getenv('Cricbuzz_API_KEY'):
        print("[INGEST] Cricbuzz_API_KEY not set — skipping")
        return

    now = timezone.now()
    matches = Match.objects.filter(
        status__in=['upcoming', 'live'],
        match_date__lte=now,
    )

    print(f"[INGEST] Found {matches.count()} matches to process")
    for match in matches:
        print(
            f"[INGEST] Match {match.pk} | status={match.status} | cricbuzz_id={match.cricbuzz_match_id}")

        if match.status == 'upcoming':
            match.status = 'live'
            match.save()

        if not match.cricbuzz_match_id:
            continue

        resp = requests.get(
            f"https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/{match.cricbuzz_match_id}/scard",
            headers=CRICBUZZ_HEADERS,
            timeout=30,
        )
        try:
            data = resp.json()
        except ValueError:
            print(f"[INGEST] Bad JSON for match {match.pk}, skipping")
            continue

        scorecard = data.get('scorecard', [])
        match_complete = data.get('ismatchcomplete', False)

        if len(scorecard) < 1:
            continue

        innings_1_complete = len(scorecard) >= 2 or match_complete
        _write_innings(
            match, scorecard[0], innings_number=1, is_complete=innings_1_complete)

        if len(scorecard) >= 2:
            _write_innings(
                match, scorecard[1], innings_number=2, is_complete=match_complete)

        if match_complete:
            match.status = 'completed'
            match.save()
            print(f"[INGEST] Match {match.pk} marked as completed")
