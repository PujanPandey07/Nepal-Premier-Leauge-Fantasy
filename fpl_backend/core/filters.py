# filters.py
from rest_framework import filters
import django_filters
from .models import League, Player, Tournament


class PlayerFilter(django_filters.FilterSet):
    min_credit_value = django_filters.NumberFilter(
        field_name='credit_value', lookup_expr='gte')
    max_credit_value = django_filters.NumberFilter(
        field_name='credit_value', lookup_expr='lte')
    # Accepts a comma-separated pair of team ids, e.g. ?teams=id1,id2
    # so the frontend can fetch players from BOTH teams in a match at once.
    teams = django_filters.CharFilter(method='filter_teams')

    def filter_teams(self, queryset, name, value):
        team_ids = value.split(',')
        return queryset.filter(team__in=team_ids)

    class Meta:
        model = Player
        fields = ['team', 'role',
                  'name', 'batting_style', 'bowling_style', 'nationality',]


class TournamentFilter(django_filters.FilterSet):
    start_after = django_filters.DateFilter(
        field_name='start_date', lookup_expr='gte')
    start_before = django_filters.DateFilter(
        field_name='start_date', lookup_expr='lte')
    end_after = django_filters.DateFilter(
        field_name='end_date', lookup_expr='gte')
    end_before = django_filters.DateFilter(
        field_name='end_date', lookup_expr='lte')

    class Meta:
        model = Tournament
        fields = ['sport', 'season', 'status',]


class LeagueFilter(django_filters.FilterSet):
    min_entry_fee = django_filters.NumberFilter(
        field_name='entry_fee', lookup_expr='gte')
    max_entry_fee = django_filters.NumberFilter(
        field_name='entry_fee', lookup_expr='lte')

    class Meta:
        model = League
        fields = ['tournament', 'name',
                  'max_members', 'prize_pool', 'status']
