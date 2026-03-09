"""
Team and DraftPick models.
"""
import uuid
from django.db import models
from apps.users.models import User
from apps.pools.models import Pool


class Team(models.Model):
    """Team model representing NCAA March Madness teams per pool."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pool = models.ForeignKey(
        Pool,
        on_delete=models.CASCADE,
        related_name='teams'
    )
    name = models.CharField(max_length=255)
    seed_rank = models.IntegerField()
    region = models.CharField(max_length=50, blank=True, null=True)
    is_eliminated = models.BooleanField(default=False)
    elimination_round = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teams'
        ordering = ['seed_rank', 'name']
        unique_together = [('pool', 'name')]
        constraints = [
            models.CheckConstraint(
                check=models.Q(seed_rank__gte=1) & models.Q(seed_rank__lte=16),
                name='seed_rank_valid_range'
            ),
            models.CheckConstraint(
                check=models.Q(elimination_round__gte=1) & models.Q(elimination_round__lte=6) | models.Q(elimination_round__isnull=True),
                name='elimination_round_valid_range'
            ),
        ]

    def __str__(self):
        status = " [ELIMINATED]" if self.is_eliminated else ""
        return f"{self.name} (Seed {self.seed_rank}){status}"

    def get_seed_group(self):
        """Determine which seed group this team belongs to (1-4, 5-8, 9-12, 13-16)."""
        if 1 <= self.seed_rank <= 4:
            return 1
        elif 5 <= self.seed_rank <= 8:
            return 2
        elif 9 <= self.seed_rank <= 12:
            return 3
        elif 13 <= self.seed_rank <= 16:
            return 4
        return None

    def mark_eliminated(self, tournament_round):
        """
        Mark team as eliminated from the tournament.

        Args:
            tournament_round: The round in which the team was eliminated (1-6)
        """
        self.is_eliminated = True
        self.elimination_round = tournament_round
        self.save(update_fields=['is_eliminated', 'elimination_round', 'updated_at'])

    def mark_active(self):
        """
        Mark team as active (not eliminated).
        Used when correcting tournament results.
        """
        self.is_eliminated = False
        self.elimination_round = None
        self.save(update_fields=['is_eliminated', 'elimination_round', 'updated_at'])

    def update_elimination_status(self):
        """
        Update elimination status based on tournament results.
        Returns True if status changed, False otherwise.
        """
        from apps.tournaments.models import TeamGameResult, GameResult

        # Check if team has any losses
        loss_result = TeamGameResult.objects.filter(
            pool=self.pool,
            team=self,
            result=GameResult.LOST
        ).order_by('tournament_round').first()

        if loss_result:
            # Team has a loss - should be eliminated
            if not self.is_eliminated or self.elimination_round != loss_result.tournament_round:
                self.mark_eliminated(loss_result.tournament_round)
                return True
        else:
            # Team has no losses - should be active
            if self.is_eliminated:
                self.mark_active()
                return True

        return False

    def get_tournament_status(self):
        """
        Get a human-readable tournament status.

        Returns:
            dict: Status information including is_eliminated, elimination_round, and status_text
        """
        if not self.is_eliminated:
            return {
                'is_eliminated': False,
                'elimination_round': None,
                'status_text': 'Active'
            }

        round_names = {
            1: 'Round of 64',
            2: 'Round of 32',
            3: 'Sweet 16',
            4: 'Elite 8',
            5: 'Final Four',
            6: 'Championship'
        }

        return {
            'is_eliminated': True,
            'elimination_round': self.elimination_round,
            'status_text': f"Eliminated in {round_names.get(self.elimination_round, 'Unknown')}"
        }


class DraftPick(models.Model):
    """Represents a user's draft pick in a pool."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pool = models.ForeignKey(
        Pool,
        on_delete=models.CASCADE,
        related_name='draft_picks'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='draft_picks'
    )
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='draft_pick'
    )
    draft_round = models.IntegerField()
    pick_order = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'draft_picks'
        ordering = ['pick_order']
        unique_together = [
            ('pool', 'team'),      # Each team can only be drafted once per pool
            ('pool', 'pick_order'),  # Each pick order is unique per pool
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(draft_round__gte=1) & models.Q(draft_round__lte=5),
                name='draft_round_valid_range'
            ),
            models.CheckConstraint(
                check=models.Q(pick_order__gte=1) & models.Q(pick_order__lte=60),
                name='pick_order_valid_range'
            ),
        ]

    def __str__(self):
        return f"Pick {self.pick_order}: {self.user.email} -> {self.team.name}"

    @staticmethod
    def calculate_pick_order(draft_position, draft_round, total_members=12):
        """
        Calculate the pick order based on draft position and round using snake draft logic.

        Args:
            draft_position: Position in draft order (1-12)
            draft_round: Current round (1-5)
            total_members: Total number of pool members (default 12)

        Returns:
            Overall pick order number (1-60)
        """
        if draft_round % 2 == 1:  # Odd rounds: normal order
            pick_order = (draft_round - 1) * total_members + draft_position
        else:  # Even rounds: reverse order (snake draft)
            pick_order = (draft_round - 1) * total_members + (total_members - draft_position + 1)
        return pick_order

    @staticmethod
    def get_current_turn(pool):
        """
        Calculate whose turn it is in the draft based on existing picks.

        Returns:
            PoolMembership object of the user whose turn it is, or None if draft complete.
        """
        from apps.pools.models import PoolMembership

        total_picks = pool.draft_picks.count()
        total_members = pool.memberships.count()

        # Draft is complete if all 60 picks are made (12 members * 5 rounds)
        if total_picks >= total_members * 5:
            return None

        # Calculate current round and position
        next_pick_order = total_picks + 1
        current_round = ((next_pick_order - 1) // total_members) + 1

        # Calculate draft position based on snake logic
        if current_round % 2 == 1:  # Odd rounds: normal order
            position_in_round = ((next_pick_order - 1) % total_members) + 1
            draft_position = position_in_round
        else:  # Even rounds: reverse order
            position_in_round = ((next_pick_order - 1) % total_members) + 1
            draft_position = total_members - position_in_round + 1

        # Find the membership with this draft position
        try:
            return PoolMembership.objects.get(pool=pool, draft_position=draft_position)
        except PoolMembership.DoesNotExist:
            return None
