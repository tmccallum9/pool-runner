"""Compatibility wrapper for pools GraphQL schema."""

from apps.pools.graphql.schema import DraftStatusEnum, PoolMembershipType, PoolMutations, PoolQueries, PoolType

__all__ = [
    "DraftStatusEnum",
    "PoolMembershipType",
    "PoolMutations",
    "PoolQueries",
    "PoolType",
]
