"""
Django admin configuration for tournaments app.
"""
from django.contrib import admin
from apps.tournaments.models import TeamGameResult


@admin.register(TeamGameResult)
class TeamGameResultAdmin(admin.ModelAdmin):
    list_display = ('id', 'team', 'pool', 'tournament_round', 'result', 'points_awarded', 'updated_at')
    search_fields = ('team__name',)
    list_filter = ('result', 'tournament_round', 'pool')
    readonly_fields = ('id', 'points_awarded', 'updated_at')
    ordering = ('tournament_round', 'team__name')
