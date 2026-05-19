from django.contrib import admin

from .models import Player, Match, Transaction, Sport, League, Tournament, Fantasy_Team, Fantasy_Team_Player, LeagueMember, User, Cricket_Team, player_Match_Performance


admin.site.register(Player)
admin.site.register(Match)
admin.site.register(Transaction)
admin.site.register(Sport)
admin.site.register(League)
admin.site.register(Tournament)
admin.site.register(Fantasy_Team)
admin.site.register(Fantasy_Team_Player)
admin.site.register(LeagueMember)
admin.site.register(User)
admin.site.register(Cricket_Team)
admin.site.register(player_Match_Performance)
