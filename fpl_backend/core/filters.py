from rest_framework import filters
import django_filters
from .models import League, Player, Tournament


class PlayerFilter(django_filters.FilterSet):
    min_credit_value = django_filters.NumberFilter(
        field_name='credit_value', lookup_expr='gte')
    max_credit_value = django_filters.NumberFilter(
        field_name='credit_value', lookup_expr='lte')

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
