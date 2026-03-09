"""
Django admin configuration for pools app.
"""
from django.contrib import admin
from apps.pools.models import Pool, PoolMembership


@admin.register(Pool)
class PoolAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'owner', 'draft_status', 'max_members', 'created_at')
    search_fields = ('name', 'url_slug')
    list_filter = ('draft_status',)
    readonly_fields = ('id', 'url_slug', 'created_at', 'updated_at')
    ordering = ('-created_at',)


@admin.register(PoolMembership)
class PoolMembershipAdmin(admin.ModelAdmin):
    list_display = ('id', 'pool', 'user', 'draft_position', 'total_points', 'created_at')
    search_fields = ('pool__name', 'user__email')
    list_filter = ('pool',)
    readonly_fields = ('id', 'created_at')
    ordering = ('-total_points',)
