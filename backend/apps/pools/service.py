"""
Utility functions for pool management.
"""
import random
from apps.pools.models import PoolMembership


def randomize_draft_order(pool):
    """
    Randomize draft order for all members in a pool.

    Args:
        pool: Pool model instance

    Returns:
        list: List of PoolMembership objects with updated draft_position
    """
    memberships = list(pool.memberships.all())
    positions = list(range(1, len(memberships) + 1))
    random.shuffle(positions)

    updated_memberships = []
    for membership, position in zip(memberships, positions):
        membership.draft_position = position
        membership.save()
        updated_memberships.append(membership)

    return updated_memberships


def check_pool_owner(user, pool):
    """
    Check if a user is the owner of a pool.

    Args:
        user: User model instance
        pool: Pool model instance

    Returns:
        bool: True if user is the owner, False otherwise
    """
    return pool.owner.id == user.id


def check_pool_member(user, pool):
    """
    Check if a user is a member of a pool.

    Args:
        user: User model instance
        pool: Pool model instance

    Returns:
        bool: True if user is a member, False otherwise
    """
    return PoolMembership.objects.filter(pool=pool, user=user).exists()


def validate_draft_complete(pool):
    """
    Validate that all draft picks have been made for a pool.

    Args:
        pool: Pool model instance

    Returns:
        tuple: (is_complete: bool, message: str)
    """
    total_members = pool.memberships.count()
    expected_picks = total_members * 5  # 5 rounds of drafting
    actual_picks = pool.draft_picks.count()

    if actual_picks < expected_picks:
        missing_picks = expected_picks - actual_picks
        return False, f"Draft incomplete. {missing_picks} picks remaining."

    return True, "Draft is complete."
