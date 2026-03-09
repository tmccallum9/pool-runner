"""
Pool and PoolMembership models.
"""
import uuid
from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from apps.users.models import User


class DraftStatus(models.TextChoices):
    """Draft status options for pools."""
    NOT_STARTED = 'NOT_STARTED', 'Not Started'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    COMPLETED = 'COMPLETED', 'Completed'


class Pool(models.Model):
    """Pool model for March Madness brackets."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True, db_index=True)
    password = models.CharField(max_length=255)  # Hashed password
    url_slug = models.SlugField(max_length=255, unique=True, db_index=True)
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='owned_pools'
    )
    draft_status = models.CharField(
        max_length=20,
        choices=DraftStatus.choices,
        default=DraftStatus.NOT_STARTED
    )
    max_members = models.IntegerField(default=12)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'pools'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def set_password(self, raw_password):
        """Hash and set the pool password."""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Check if the provided password matches the pool password."""
        return check_password(raw_password, self.password)

    def is_full(self):
        """Check if the pool has reached maximum capacity."""
        return self.memberships.count() >= self.max_members

    def save(self, *args, **kwargs):
        """Override save to generate url_slug if not provided."""
        if not self.url_slug:
            import secrets
            self.url_slug = f"{self.name.lower().replace(' ', '-')}-{secrets.token_urlsafe(8)}"
        super().save(*args, **kwargs)


class PoolMembership(models.Model):
    """Represents a user's membership in a pool."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pool = models.ForeignKey(
        Pool,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='pool_memberships'
    )
    draft_position = models.IntegerField(null=True, blank=True)
    total_points = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pool_memberships'
        ordering = ['-total_points']
        unique_together = [
            ('pool', 'user'),
            ('pool', 'draft_position'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(draft_position__gte=1) | models.Q(draft_position__isnull=True),
                name='draft_position_positive'
            ),
            models.CheckConstraint(
                check=models.Q(draft_position__lte=12) | models.Q(draft_position__isnull=True),
                name='draft_position_max_12'
            ),
        ]

    def __str__(self):
        return f"{self.user.email} in {self.pool.name}"

    def recalculate_points(self):
        """Recalculate total points from all team results."""
        from apps.tournaments.models import TeamGameResult
        total = 0
        for pick in self.user.draft_picks.filter(pool=self.pool):
            results = TeamGameResult.objects.filter(
                pool=self.pool,
                team=pick.team,
                result='WON'
            )
            total += sum(result.points_awarded for result in results)
        self.total_points = total
        self.save()
        return total
