from celery import shared_task
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from .models import Match, Fantasy_Team

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
