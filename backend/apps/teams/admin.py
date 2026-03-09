"""
Django admin configuration for teams app.
"""
from django.contrib import admin
from apps.teams.models import Team, DraftPick


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'seed_rank', 'region', 'pool', 'created_at')
    search_fields = ('name',)
    list_filter = ('seed_rank', 'region', 'pool')
    readonly_fields = ('id', 'created_at')
    ordering = ('seed_rank', 'name')


@admin.register(DraftPick)
class DraftPickAdmin(admin.ModelAdmin):
    list_display = ('id', 'pool', 'user', 'team', 'draft_round', 'pick_order', 'created_at')
    search_fields = ('user__email', 'team__name')
    list_filter = ('draft_round', 'pool')
    readonly_fields = ('id', 'created_at')
    ordering = ('pick_order',)
