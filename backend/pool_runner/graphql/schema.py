"""Root GraphQL schema for Pool Runner."""

import graphene

from apps.pools.graphql.schema import PoolMutations, PoolQueries
from apps.teams.graphql.schema import TeamMutations, TeamQueries
from apps.tournaments.graphql.schema import TournamentMutations, TournamentQueries
from apps.users.graphql.schema import UserMutations, UserQueries


class Query(
    UserQueries,
    PoolQueries,
    TeamQueries,
    TournamentQueries,
    graphene.ObjectType,
):
    """Root Query combining all service queries."""


class Mutation(
    UserMutations,
    PoolMutations,
    TeamMutations,
    TournamentMutations,
    graphene.ObjectType,
):
    """Root Mutation combining all service mutations."""


schema = graphene.Schema(
    query=Query,
    mutation=Mutation,
    auto_camelcase=True,
)
