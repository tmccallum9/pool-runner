"""
Tournament game result models.
"""
import uuid
from django.db import models
from apps.pools.models import Pool
from apps.teams.models import Team


class GameResult(models.TextChoices):
    """Game result options."""
    WON = 'WON', 'Won'
    LOST = 'LOST', 'Lost'
    NOT_PLAYED = 'NOT_PLAYED', 'Not Played'


class TeamGameResult(models.Model):
    """Tracks win/loss results for teams in each tournament round."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pool = models.ForeignKey(
        Pool,
        on_delete=models.CASCADE,
        related_name='game_results'
    )
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='game_results'
    )
    tournament_round = models.IntegerField()
    result = models.CharField(
        max_length=20,
        choices=GameResult.choices,
        default=GameResult.NOT_PLAYED
    )
    points_awarded = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'team_game_results'
        ordering = ['tournament_round']
        unique_together = [('pool', 'team', 'tournament_round')]
        constraints = [
            models.CheckConstraint(
                check=models.Q(tournament_round__gte=1) & models.Q(tournament_round__lte=6),
                name='tournament_round_valid_range'
            ),
        ]

    def __str__(self):
        return f"{self.team.name} - Round {self.tournament_round}: {self.result}"

    def calculate_points(self):
        """
        Calculate points awarded for this game result.
        Formula: seed_rank + tournament_round if WON, else 0
        """
        if self.result == GameResult.WON:
            self.points_awarded = self.team.seed_rank + self.tournament_round
        else:
            self.points_awarded = 0
        return self.points_awarded

    def save(self, *args, **kwargs):
        """Override save to automatically calculate points and update team status."""
        self.calculate_points()
        super().save(*args, **kwargs)

        # After saving, update team elimination status
        if self.result == GameResult.LOST:
            # Team lost - mark as eliminated
            self.team.mark_eliminated(self.tournament_round)
        elif self.result == GameResult.WON or self.result == GameResult.NOT_PLAYED:
            # Update team status based on all results (handles result corrections)
            self.team.update_elimination_status()

        # Trigger point recalculation for affected users
        if self.result == GameResult.WON or self.result == GameResult.LOST:
            self.update_member_points()

    def update_member_points(self):
        """Update total points for pool members who drafted this team."""
        from apps.teams.models import DraftPick
        from apps.pools.models import PoolMembership

        # Find all users who drafted this team in this pool
        draft_picks = DraftPick.objects.filter(pool=self.pool, team=self.team)
        for pick in draft_picks:
            membership = PoolMembership.objects.get(pool=self.pool, user=pick.user)
            membership.recalculate_points()

    def check_team_eliminated(self):
        """Check if the team has already lost in a previous round."""
        previous_loss = TeamGameResult.objects.filter(
            pool=self.pool,
            team=self.team,
            tournament_round__lt=self.tournament_round,
            result=GameResult.LOST
        ).exists()
        return previous_loss
