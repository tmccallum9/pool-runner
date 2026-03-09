"""Compatibility wrapper for teams GraphQL schema."""

from apps.teams.graphql.schema import DraftPickType, TeamMutations, TeamQueries, TeamStatusType, TeamType

__all__ = [
    "DraftPickType",
    "TeamMutations",
    "TeamQueries",
    "TeamStatusType",
    "TeamType",
]
