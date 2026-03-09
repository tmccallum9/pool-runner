"""
Utility functions for team and draft pick management.
"""
from apps.teams.models import DraftPick, Team
from apps.pools.models import DraftStatus


def validate_draft_pick(pool, user, team):
    """
    Validate if a draft pick is allowed.

    Args:
        pool: Pool model instance
        user: User model instance
        team: Team model instance

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    # Check draft status
    if pool.draft_status != DraftStatus.IN_PROGRESS:
        return False, "Draft is not in progress"

    # Check if team already picked
    if DraftPick.objects.filter(pool=pool, team=team).exists():
        return False, "Team already drafted"

    # Check if user has exceeded pick limit
    user_picks = DraftPick.objects.filter(pool=pool, user=user).count()
    if user_picks >= 5:
        return False, "You have already made 5 picks"

    # Check if it's user's turn
    current_turn = DraftPick.get_current_turn(pool)
    if not current_turn or current_turn.user.id != user.id:
        return False, "It's not your turn to pick"

    return True, None


def get_available_teams(pool):
    """
    Get teams that haven't been drafted yet in a pool.

    Args:
        pool: Pool model instance

    Returns:
        QuerySet: Available Team objects
    """
    drafted_team_ids = DraftPick.objects.filter(pool=pool).values_list('team_id', flat=True)
    return Team.objects.filter(pool=pool).exclude(id__in=drafted_team_ids)


def validate_seed_group_constraint(user_picks, team, draft_round):
    """
    Validate seed group constraints for draft picks.

    Rules:
    - Rounds 1-4: Must pick one team from each seed group (1-4, 5-8, 9-12, 13-16)
    - Round 5: Wildcard (any team from any seed group)

    Args:
        user_picks: QuerySet of user's existing DraftPick objects
        team: Team to be picked
        draft_round: Current draft round (1-5)

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    # Round 5 is wildcard, no restrictions
    if draft_round == 5:
        return True, None

    # For rounds 1-4, check if user already has a team from this seed group
    seed_group = team.get_seed_group()
    for pick in user_picks:
        if pick.team.get_seed_group() == seed_group and pick.draft_round <= 4:
            return False, f"You have already picked a team from seed group {seed_group}"

    return True, None
