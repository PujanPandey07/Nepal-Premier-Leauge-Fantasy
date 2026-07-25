from datetime import datetime, timezone as dt_timezone
from django.utils import timezone
from core.models import Match, Cricket_Team, Tournament

tournament = Tournament.objects.get(name="Nepal Premier League", season="2025")

# Cricbuzz's ALL-CAPS names -> your actual seeded Cricket_Team names
TEAM_NAME_MAP = {
    "JANAKPUR BOLTS": "Janakpur Bolts",
    "KATHMANDU GORKHAS": "Kathmandu Gorkhas",
    "CHITWAN RHINOS": "Chitwan Rhinos",
    "KARNALI YAKS": "Karnali Yaks",
    "BIRATNAGAR KINGS": "Biratnagar Kings",
    "SUDUR PASCHIM ROYALS": "Sudur Paschim Royals",
    "LUMBINI LIONS": "Lumbini Lions",
    "POKHARA AVENGERS": "Pokhara Avengers",
}

MATCHES = [
    {"matchId": 137877, "team1": "JANAKPUR BOLTS", "team2": "KATHMANDU GORKHAS",
        "startDate": 1763374500000, "desc": "1st Match"},
    {"matchId": 137885, "team1": "CHITWAN RHINOS", "team2": "KARNALI YAKS",
        "startDate": 1763445600000, "desc": "2nd Match"},
    {"matchId": 137886, "team1": "BIRATNAGAR KINGS", "team2": "POKHARA AVENGERS",
        "startDate": 1763460900000, "desc": "3rd Match"},
    {"matchId": 137897, "team1": "KATHMANDU GORKHAS", "team2": "SUDUR PASCHIM ROYALS",
        "startDate": 1763547300000, "desc": "4th Match"},
    {"matchId": 137908, "team1": "CHITWAN RHINOS", "team2": "LUMBINI LIONS",
        "startDate": 1763633700000, "desc": "5th Match"},
    {"matchId": 137910, "team1": "POKHARA AVENGERS", "team2": "SUDUR PASCHIM ROYALS",
        "startDate": 1763720100000, "desc": "6th Match"},
    {"matchId": 137921, "team1": "KARNALI YAKS", "team2": "LUMBINI LIONS",
        "startDate": 1763789400000, "desc": "7th Match"},
    {"matchId": 137927, "team1": "BIRATNAGAR KINGS", "team2": "KATHMANDU GORKHAS",
        "startDate": 1763804700000, "desc": "8th Match"},
    {"matchId": 137938, "team1": "BIRATNAGAR KINGS", "team2": "JANAKPUR BOLTS",
        "startDate": 1763964000000, "desc": "9th Match"},
    {"matchId": 137949, "team1": "KARNALI YAKS", "team2": "SUDUR PASCHIM ROYALS",
        "startDate": 1763979300000, "desc": "10th Match"},
    {"matchId": 137960, "team1": "KATHMANDU GORKHAS", "team2": "LUMBINI LIONS",
        "startDate": 1764065700000, "desc": "11th Match"},
    {"matchId": 137971, "team1": "BIRATNAGAR KINGS", "team2": "CHITWAN RHINOS",
        "startDate": 1764152100000, "desc": "12th Match"},
    {"matchId": 137973, "team1": "LUMBINI LIONS", "team2": "SUDUR PASCHIM ROYALS",
        "startDate": 1764223200000, "desc": "13th Match"},
    {"matchId": 137984, "team1": "JANAKPUR BOLTS", "team2": "POKHARA AVENGERS",
        "startDate": 1764238500000, "desc": "14th Match"},
    {"matchId": 137995, "team1": "CHITWAN RHINOS", "team2": "KATHMANDU GORKHAS",
        "startDate": 1764309600000, "desc": "15th Match"},
    {"matchId": 138006, "team1": "BIRATNAGAR KINGS", "team2": "KARNALI YAKS",
        "startDate": 1764324900000, "desc": "16th Match"},
    {"matchId": 138017, "team1": "LUMBINI LIONS", "team2": "POKHARA AVENGERS",
        "startDate": 1764394200000, "desc": "17th Match"},
    {"matchId": 138028, "team1": "JANAKPUR BOLTS", "team2": "SUDUR PASCHIM ROYALS",
        "startDate": 1764409500000, "desc": "18th Match"},
    {"matchId": 138031, "team1": "KARNALI YAKS", "team2": "KATHMANDU GORKHAS",
        "startDate": 1764495900000, "desc": "19th Match"},
    {"matchId": 138042, "team1": "CHITWAN RHINOS", "team2": "JANAKPUR BOLTS",
        "startDate": 1764655200000, "desc": "20th Match"},
    {"matchId": 138053, "team1": "KARNALI YAKS", "team2": "POKHARA AVENGERS",
        "startDate": 1764670500000, "desc": "21st Match"},
    {"matchId": 138064, "team1": "BIRATNAGAR KINGS", "team2": "LUMBINI LIONS",
        "startDate": 1764756900000, "desc": "22nd Match"},
    {"matchId": 138075, "team1": "KATHMANDU GORKHAS", "team2": "POKHARA AVENGERS",
        "startDate": 1764828000000, "desc": "23rd Match"},
    {"matchId": 138086, "team1": "CHITWAN RHINOS", "team2": "SUDUR PASCHIM ROYALS",
        "startDate": 1764843300000, "desc": "24th Match"},
    {"matchId": 138095, "team1": "JANAKPUR BOLTS", "team2": "LUMBINI LIONS",
        "startDate": 1764929700000, "desc": "25th Match"},
    {"matchId": 138106, "team1": "BIRATNAGAR KINGS", "team2": "SUDUR PASCHIM ROYALS",
        "startDate": 1764999000000, "desc": "26th Match"},
    {"matchId": 138117, "team1": "CHITWAN RHINOS", "team2": "POKHARA AVENGERS",
        "startDate": 1765014300000, "desc": "27th Match"},
    {"matchId": 138128, "team1": "JANAKPUR BOLTS", "team2": "KARNALI YAKS",
        "startDate": 1765100700000, "desc": "28th Match"},
    {"matchId": 138139, "team1": "SUDUR PASCHIM ROYALS", "team2": "BIRATNAGAR KINGS",
        "startDate": 1765275300000, "desc": "Qualifier 1"},
    {"matchId": 138150, "team1": "KATHMANDU GORKHAS", "team2": "LUMBINI LIONS",
        "startDate": 1765361700000, "desc": "Eliminator"},
    {"matchId": 138161, "team1": "BIRATNAGAR KINGS", "team2": "LUMBINI LIONS",
        "startDate": 1765448100000, "desc": "Qualifier 2"},
    {"matchId": 138172, "team1": "SUDUR PASCHIM ROYALS",
        "team2": "LUMBINI LIONS", "startDate": 1765619100000, "desc": "Final"},
]

original_start = datetime.fromtimestamp(
    MATCHES[0]["startDate"] / 1000, tz=dt_timezone.utc)
replay_start = timezone.now()

for i, m in enumerate(MATCHES, start=1):
    original_dt = datetime.fromtimestamp(
        m["startDate"] / 1000, tz=dt_timezone.utc)
    offset = original_dt - original_start
    shifted_dt = replay_start + offset

    home_team = Cricket_Team.objects.get(name=TEAM_NAME_MAP[m["team1"]])
    away_team = Cricket_Team.objects.get(name=TEAM_NAME_MAP[m["team2"]])

    Match.objects.get_or_create(
        cricbuzz_match_id=m["matchId"],
        defaults={
            'tournament': tournament,
            'home_team': home_team,
            'away_team': away_team,
            'match_date': shifted_dt,
            'venue': "Tribhuvan University International Cricket Ground",
            'status': 'upcoming',
            'gameweek': i,
        }
    )

print(f"Created {Match.objects.filter(tournament=tournament).count()} matches")
