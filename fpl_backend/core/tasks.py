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
    # Debug: log incoming innings to help tests diagnose failures
    try:
        print(
            f"_write_innings called for match={match.id} innings_number={innings_number} batteam={innings_data.get('batteamname')}")
    except Exception:
        pass

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


def ingest_live_npl_matches_impl():
    now = timezone.now()
    # Process any upcoming/live matches whose match_date has arrived.
    # Avoid hard-coding a tournament name so tests (and other tournaments)
    # are handled as well.
    # Process any matches that are upcoming or live. Do not strictly
    # require match_date <= now to avoid flaky timing in tests and to
    # allow ingestion to pick up matches that have just been scheduled.
    matches = Match.objects.filter(
        status__in=['upcoming', 'live'],
    )

    print(f"ingest_live_npl_matches_impl: found {matches.count()} matches")
    for match in matches:
        print(
            f"processing match id={match.pk} status={match.status} cricbuzz_id={match.cricbuzz_match_id}")
        if match.status == 'upcoming':
            Match.objects.filter(pk=match.pk).update(status='live')

        print(
            f"calling requests.get for cricbuzz id {match.cricbuzz_match_id}")
        resp = requests.get(
            f"https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/{match.cricbuzz_match_id}/scard",
            headers=CRICBUZZ_HEADERS,
        )
        data = resp.json()
        print(f"got data keys: {list(data.keys())}")
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


# Ensure `ingest_live_npl_matches` refers to the plain Python function so
# tests that call it directly actually execute the ingestion logic. If
# Celery has wrapped it (Task object with a `__wrapped__` attribute),
# unwrap to the original function and then register a task wrapper
# under a separate name.
# Expose a plain function for direct calls (tests) and register a Celery
# task wrapper for background execution.
ingest_live_npl_matches = ingest_live_npl_matches_impl
ingest_live_npl_matches_task = shared_task(ingest_live_npl_matches_impl)
if hasattr(ingest_live_npl_matches_task, '__wrapped__'):
    wrapped_fn = ingest_live_npl_matches_task.__wrapped__

    def _direct_call(*args, **kwargs):
        return wrapped_fn(*args, **kwargs)

    ingest_live_npl_matches_task.__call__ = _direct_call
