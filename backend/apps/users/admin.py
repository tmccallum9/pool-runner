"""
Django admin configuration for users app.
"""
from django.contrib import admin
from apps.users.models import User, MagicLink


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'created_at')
    search_fields = ('email',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)


@admin.register(MagicLink)
class MagicLinkAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'used', 'expires_at', 'created_at')
    search_fields = ('email', 'token')
    list_filter = ('used',)
    readonly_fields = ('id', 'token', 'created_at')
    ordering = ('-created_at',)
