"""
User and MagicLink models for authentication.
"""
import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta
from django.conf import settings


class User(models.Model):
    """User model for pool members and owners."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return self.email


class MagicLink(models.Model):
    """Magic link tokens for passwordless authentication."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField()
    token = models.CharField(max_length=255, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'magic_links'
        ordering = ['-created_at']

    def __str__(self):
        return f"MagicLink for {self.email}"

    def is_valid(self):
        """Check if the magic link is still valid and unused."""
        return not self.used and timezone.now() < self.expires_at

    @classmethod
    def create_for_email(cls, email):
        """Create a new magic link for the given email."""
        import secrets
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(
            minutes=settings.MAGIC_LINK_EXPIRATION_MINUTES
        )
        return cls.objects.create(
            email=email,
            token=token,
            expires_at=expires_at
        )
