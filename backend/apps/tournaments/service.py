"""
Utility functions for tournament result management.
"""
from apps.tournaments.models import TeamGameResult, GameResult


def validate_result_update(pool, team, tournament_round):
    """
    Validate if a tournament result update is allowed.

    Args:
        pool: Pool model instance
        team: Team model instance
        tournament_round: Tournament round number (1-6)

    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    # Check if team has already lost in a previous round
    previous_loss = TeamGameResult.objects.filter(
        pool=pool,
        team=team,
        tournament_round__lt=tournament_round,
        result=GameResult.LOST
    ).exists()

    if previous_loss:
        return False, f"Team {team.name} was already eliminated in a previous round"

    return True, None


def get_team_elimination_round(pool, team):
    """
    Get the round in which a team was eliminated (if any).

    Args:
        pool: Pool model instance
        team: Team model instance

    Returns:
        int or None: Round number where team lost, or None if still active
    """
    loss_result = TeamGameResult.objects.filter(
        pool=pool,
        team=team,
        result=GameResult.LOST
    ).first()

    return loss_result.tournament_round if loss_result else None
