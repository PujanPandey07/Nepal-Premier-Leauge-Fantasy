from django.db import models
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils.text import slugify


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone_no = models.CharField(
        max_length=15, unique=True, null=True, blank=True)
    profile_picture = models.URLField(null=True, blank=True)
    wallet_balance = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00)

    role = models.CharField(max_length=20, choices=[
        ('user', 'User'),
        ('admin', 'Admin'),
        ('moderator', 'Moderator'),
    ], default='user')

    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return f"{self.name} ({self.email})"

    class Meta:
        ordering = ['-created_at']


class Sport(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Tournament(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)
    sport = models.ForeignKey(
        Sport, on_delete=models.CASCADE, related_name='tournaments')
    name = models.CharField(max_length=100)
    season = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=[
        ('upcoming', 'Upcoming'),
        ('live', 'Live'),
        ('completed', 'Completed'),
    ], default='upcoming')
    max_players = models.IntegerField()
    squad_size = models.IntegerField()
    max_substitutions = models.IntegerField()
    max_foreign_players = models.IntegerField()
    budget_cap = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.name}{self.season}"


class Cricket_Team(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)
    tournament = models.ForeignKey(
        Tournament, on_delete=models.CASCADE, related_name='teams')
    name = models.CharField(max_length=100)
    logo_url = models.URLField(blank=True, null=True)
    short_name = models.CharField(max_length=20)
    home_venue = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Match(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)
    tournament = models.ForeignKey(
        Tournament, on_delete=models.CASCADE, related_name='matches')
    home_team = models.ForeignKey(
        Cricket_Team, on_delete=models.CASCADE, related_name='home_matches')
    away_team = models.ForeignKey(
        Cricket_Team, on_delete=models.CASCADE, related_name='away_matches')
    match_date = models.DateTimeField()
    venue = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=[
        ('upcoming', 'Upcoming'),
        ('live', 'Live'),
        ('completed', 'Completed'),
    ], default='upcoming')
    gameweek = models.IntegerField()
    result = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.home_team} vs {self.away_team} on {self.match_date.strftime('%Y-%m-%d %H:%M')}"


class Player(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)
    team = models.ForeignKey(
        Cricket_Team, on_delete=models.CASCADE, related_name='players')
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=20)
    batting_style = models.CharField(max_length=20)
    bowling_style = models.CharField(max_length=20)
    credit_value = models.DecimalField(max_digits=10, decimal_places=2)
    nationality = models.CharField(max_length=50)
    image_url = models.URLField(blank=True, null=True)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class Player_Match_Performance(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)
    player = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name='performances')
    match = models.ForeignKey(
        Match, on_delete=models.CASCADE, related_name='performances')
    runs_scored = models.IntegerField(default=0)
    balls_faced = models.IntegerField(default=0)
    fours = models.IntegerField(default=0)
    sixes = models.IntegerField(default=0)
    wickets_taken = models.IntegerField(default=0)
    catches = models.IntegerField(default=0)
    economy_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.00)
    stumpings = models.IntegerField(default=0)
    run_outs = models.IntegerField(default=0)
    fantasy_points = models.IntegerField(default=0)
    strike_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.player.name} - {self.match.home_team.name} vs {self.match.away_team.name}"


class Fantasy_Team(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='fantasy_teams')
    tournament = models.ForeignKey(
        Tournament, on_delete=models.CASCADE, related_name='fantasy_teams')
    name = models.CharField(max_length=100)
    total_points = models.IntegerField(default=0)
    match = models.ForeignKey(
        Match, on_delete=models.SET_NULL, blank=True, null=True)
    captain = models.ForeignKey(
        Player, on_delete=models.SET_NULL, blank=True, null=True, related_name='captain_teams')
    vice_captain = models.ForeignKey(
        Player, on_delete=models.SET_NULL, blank=True, null=True, related_name='vice_captain_teams')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deadline = models.DateTimeField()

    def __str__(self):
        return f"{self.name} ({self.user.name})"


class Fantasy_Team_Player(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)
    fantasy_team = models.ForeignKey(
        Fantasy_Team, on_delete=models.CASCADE, related_name='team_players')
    player = models.ForeignKey(
        Player, on_delete=models.CASCADE, related_name='fantasy_team_players')
    is_captain = models.BooleanField(default=False)
    is_vice_captain = models.BooleanField(default=False)
    points_earned = models.IntegerField(default=0)

    class Meta:
        unique_together = ('fantasy_team', 'player')

    def __str__(self):
        return f"{self.player.name} in {self.fantasy_team.name}"


class League(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)
    tournament = models.ForeignKey(
        Tournament, on_delete=models.CASCADE, related_name='leagues')
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='created_leagues')
    name = models.CharField(max_length=100)
    entry_fee = models.DecimalField(max_digits=10, decimal_places=2)
    prize_pool = models.DecimalField(max_digits=10, decimal_places=2)
    max_members = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    invite_code = models.CharField(max_length=10, unique=True)
    status = models.CharField(max_length=20, default='open')
    type = models.CharField(max_length=20, default='public')
    is_public = models.BooleanField(default=True)

    def __str__(self):
        return self.name


class LeagueMember(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)
    league = models.ForeignKey(
        League, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='league_memberships')
    fantasy_team = models.ForeignKey(
        Fantasy_Team, on_delete=models.SET_NULL, blank=True, null=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    ranking = models.IntegerField(default=0)
    points = models.IntegerField(default=0)

    class Meta:
        unique_together = ('league', 'user')

    def __str__(self):
        return f"{self.user.name} in {self.league.name}"


class Transaction(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=[
        ('Pending', 'Pending'),
        ('completed', 'Completed'),
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    payment_method = models.CharField(max_length=20)
    reference_id = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.user.name} - {self.amount}"
