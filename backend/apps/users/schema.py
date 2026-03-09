"""Compatibility wrapper for users GraphQL schema."""

from apps.users.graphql.schema import AuthPayloadType, UserMutations, UserQueries, UserType

__all__ = [
    "AuthPayloadType",
    "UserMutations",
    "UserQueries",
    "UserType",
]
